import {
  Neuron,
  createMerkleRoot,
  computeHash,
  threeWayMerge,
  NyronQRSyncPayload,
} from '@axon/shared';

export interface SyncStatus {
  state: 'idle' | 'connecting' | 'syncing' | 'connected' | 'error';
  lastSyncTime: number | null;
  remoteIp: string;
  pairingKey: string;
  errorMessage?: string;
  syncedCount: number;
}

export interface LocalVaultPayload {
  neurons: Neuron[];
  transactions?: any[];
  shifts?: any[];
  canvasCards?: any[];
  canvasConnections?: any[];
  savingsGoals?: any[];
}

export class MobileP2PSyncService {
  private socket: WebSocket | null = null;
  private statusListeners: Array<(status: SyncStatus) => void> = [];
  private status: SyncStatus = {
    state: 'idle',
    lastSyncTime: null,
    remoteIp: localStorage.getItem('axon_remote_ip') || '',
    pairingKey: localStorage.getItem('nyron_p2p_pairing_key') || '',
    syncedCount: 0,
  };

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private updateStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach((l) => l(this.status));
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public setRemoteIp(ip: string) {
    const cleaned = ip.trim();
    localStorage.setItem('axon_remote_ip', cleaned);
    this.updateStatus({ remoteIp: cleaned });
  }

  public setPairingKey(key: string) {
    const cleaned = key.trim().toUpperCase();
    localStorage.setItem('nyron_p2p_pairing_key', cleaned);
    this.updateStatus({ pairingKey: cleaned });
  }

  public getPairingKey(): string {
    return this.status.pairingKey || localStorage.getItem('nyron_p2p_pairing_key') || '';
  }

  public async pingDesktop(
    customIp?: string,
    customKey?: string
  ): Promise<{ ok: boolean; info?: any; error?: string }> {
    const rawIp = (customIp || this.status.remoteIp).trim();
    if (!rawIp) return { ok: false, error: 'Укажите IP адрес' };
    const host = rawIp.includes(':') ? rawIp : `${rawIp}:49200`;
    const key = (customKey !== undefined ? customKey : this.getPairingKey()).trim().toUpperCase();
    const pingUrl = `http://${host}/api/sync/ping${key ? `?key=${encodeURIComponent(key)}` : ''}`;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2800);
      const res = await fetch(pingUrl, {
        headers: key ? { 'X-Pairing-Key': key } : {},
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        return { ok: true, info: json };
      }
      return { ok: false, error: `Код ответа: ${res.status}` };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Компьютер недоступен' };
    }
  }

  /**
   * Fast parallel search across potential candidate IPs (Wi-Fi, hotspots, gateways)
   */
  public async autoDiscoverDesktop(
    suggestedIps?: string[]
  ): Promise<{ ok: boolean; ip?: string; info?: any }> {
    const candidates = Array.from(
      new Set([
        ...(suggestedIps || []),
        this.status.remoteIp,
        '192.168.148.152',
        '192.168.137.1', // Windows Mobile Hotspot default
        '192.168.43.1',  // Android Mobile Hotspot default
        '192.168.1.1',
        '192.168.0.1',
      ])
    ).filter(Boolean);

    this.updateStatus({ state: 'connecting', errorMessage: undefined });

    const pingPromises = candidates.map(async (ip) => {
      const res = await this.pingDesktop(ip);
      return { ip, ...res };
    });

    try {
      const results = await Promise.all(pingPromises);
      const found = results.find((r) => r.ok);
      if (found && found.ip) {
        this.setRemoteIp(found.ip);
        this.updateStatus({ state: 'idle' });
        return { ok: true, ip: found.ip, info: found.info };
      }
    } catch {
      // ignore
    }

    this.updateStatus({ state: 'idle' });
    return { ok: false };
  }

  /**
   * Connect and sync using QR Code payload scanned from desktop
   */
  public async connectWithQRPayload(
    payload: NyronQRSyncPayload,
    getLocalPayload: () => LocalVaultPayload,
    applyMergedVault: (vault: any) => void,
    onSuccess?: (msg: string) => void
  ): Promise<{ success: boolean; hostUsed?: string; error?: string }> {
    if (payload.key) {
      this.setPairingKey(payload.key);
    }

    const candidateIps = (payload.ips && payload.ips.length > 0)
      ? payload.ips
      : [this.status.remoteIp];

    this.updateStatus({ state: 'connecting', errorMessage: undefined });

    // 1. Probe all candidate IPs from the QR code
    let workingHost: string | null = null;
    for (const ip of candidateIps) {
      const host = `${ip}:${payload.port || 49200}`;
      const pingRes = await this.pingDesktop(host, payload.key);
      if (pingRes.ok) {
        workingHost = host;
        this.setRemoteIp(host);
        break;
      }
    }

    if (!workingHost) {
      const err = `Не удалось связаться с ПК по адресам: ${candidateIps.join(', ')}. Убедитесь, что оба устройства в одной сети (Wi-Fi или точке доступа).`;
      this.updateStatus({ state: 'error', errorMessage: err });
      return { success: false, error: err };
    }

    // 2. Perform synchronization
    await this.syncWithDesktop(getLocalPayload, applyMergedVault, onSuccess);
    return { success: true, hostUsed: workingHost };
  }

  public async syncWithDesktop(
    getLocalPayload: () => LocalVaultPayload,
    applyMergedVault: (vault: any) => void,
    onSuccess?: (msg: string) => void
  ): Promise<void> {
    const ip = this.status.remoteIp.trim();
    if (!ip) {
      this.updateStatus({ state: 'error', errorMessage: 'Укажите IP-адрес компьютера' });
      return;
    }

    const host = ip.includes(':') ? ip : `${ip}:49200`;
    const key = this.getPairingKey().trim().toUpperCase();
    const httpUrl = `http://${host}/api/sync/vault${key ? `?key=${encodeURIComponent(key)}` : ''}`;

    this.updateStatus({ state: 'connecting', errorMessage: undefined });

    try {
      // 1. Fast HTTP Synchronization
      const localData = getLocalPayload();
      this.updateStatus({ state: 'syncing' });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(httpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { 'X-Pairing-Key': key } : {}),
        },
        body: JSON.stringify(localData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errMsg = `Ошибка сервера: ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody.error) errMsg = errBody.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      const result = await response.json();
      if (!result.success || !result.vault) {
        throw new Error(result.error || 'Ошибка формата данных');
      }

      // Apply merged vault from desktop
      applyMergedVault(result.vault);

      const totalNotes = result.vault.neurons?.length || localData.neurons.length;
      this.updateStatus({
        state: 'connected',
        lastSyncTime: Date.now(),
        syncedCount: totalNotes,
      });

      const successMsg = `Синхронизировано: ${totalNotes} заметок`;
      if (onSuccess) onSuccess(successMsg);

      setTimeout(() => {
        this.updateStatus({ state: 'idle' });
      }, 3500);
    } catch (e: any) {
      console.warn('HTTP sync failed, trying WebSocket fallback...', e);

      // 2. WebSocket Fallback
      const wsUrl = `ws://${host}/axon-sync`;
      try {
        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }

        const ws = new WebSocket(wsUrl);
        this.socket = ws;

        ws.onopen = () => {
          this.updateStatus({ state: 'syncing' });
          const localData = getLocalPayload();
          ws.send(
            JSON.stringify({
              type: 'NOTES_PAYLOAD',
              key,
              neurons: localData.neurons,
              transactions: localData.transactions,
              shifts: localData.shifts,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'SYNC_MERGED' && msg.neurons) {
              applyMergedVault({ neurons: msg.neurons });
              this.updateStatus({
                state: 'connected',
                lastSyncTime: Date.now(),
                syncedCount: msg.neurons.length,
              });
              if (onSuccess) onSuccess(`Синхронизировано: ${msg.neurons.length} заметок`);
              setTimeout(() => this.updateStatus({ state: 'idle' }), 3000);
            }
          } catch (err: any) {
            this.updateStatus({ state: 'error', errorMessage: err?.message || 'Ошибка данных' });
          }
        };

        ws.onerror = () => {
          this.updateStatus({
            state: 'error',
            errorMessage: e?.message || 'Не удалось подключиться к ПК. Проверьте IP и подключение к одной сети Wi-Fi или точке доступа.',
          });
        };
      } catch (wsErr: any) {
        this.updateStatus({
          state: 'error',
          errorMessage: e?.message || 'Ошибка соединения. Убедитесь, что приложение на ПК открыто и находится в одной сети.',
        });
      }
    }
  }
}

export const p2pSyncService = new MobileP2PSyncService();

