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
    customKey?: string,
    timeoutMs: number = 1800
  ): Promise<{ ok: boolean; info?: any; error?: string }> {
    const rawIp = (customIp || this.status.remoteIp).trim();
    if (!rawIp) return { ok: false, error: 'Укажите IP адрес' };
    const host = rawIp.includes(':') ? rawIp : `${rawIp}:49200`;
    const key = (customKey !== undefined ? customKey : this.getPairingKey()).trim().toUpperCase();
    const pingUrl = `http://${host}/api/sync/ping${key ? `?key=${encodeURIComponent(key)}` : ''}`;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
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
   * Fast parallel search across potential candidate IPs (Wi-Fi, hotspots, gateways, subnet)
   */
  public async autoDiscoverDesktop(
    suggestedIps?: string[]
  ): Promise<{ ok: boolean; ip?: string; info?: any }> {
    this.updateStatus({ state: 'connecting', errorMessage: undefined });

    // Base candidates
    const baseList = [
      ...(suggestedIps || []),
      this.status.remoteIp,
      '192.168.148.173',
      '192.168.148.152',
      '192.168.137.1', // Windows Mobile Hotspot default
      '192.168.43.1',  // Android Mobile Hotspot default
      '192.168.1.1',
      '192.168.0.1',
    ].filter(Boolean);

    // If we have a known subnet, expand candidates
    const knownIp = this.status.remoteIp || suggestedIps?.[0] || '192.168.148.1';
    const match = knownIp.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\./);
    const prefix = match ? match[1] : '192.168.148';

    // Fast probe round 1: Prioritized IPs
    const priorityIps = Array.from(
      new Set([
        ...baseList,
        `${prefix}.173`,
        `${prefix}.152`,
        `${prefix}.100`,
        `${prefix}.101`,
        `${prefix}.102`,
        `${prefix}.103`,
        `${prefix}.104`,
        `${prefix}.105`,
        `${prefix}.2`,
        `${prefix}.3`,
        `${prefix}.10`,
        `${prefix}.20`,
      ])
    );

    const round1Promises = priorityIps.map(async (ip) => {
      const res = await this.pingDesktop(ip, undefined, 1200);
      return { ip, ...res };
    });

    try {
      const round1Results = await Promise.all(round1Promises);
      const round1Found = round1Results.find((r) => r.ok);
      if (round1Found && round1Found.ip) {
        this.setRemoteIp(round1Found.ip);
        this.updateStatus({ state: 'idle' });
        return { ok: true, ip: round1Found.ip, info: round1Found.info };
      }
    } catch {
      // ignore
    }

    // Fast probe round 2: scan chunks of subnet
    const allSubnetIps: string[] = [];
    for (let i = 1; i <= 254; i++) {
      const testIp = `${prefix}.${i}`;
      if (!priorityIps.includes(testIp)) {
        allSubnetIps.push(testIp);
      }
    }

    const chunkSize = 25;
    for (let c = 0; c < allSubnetIps.length; c += chunkSize) {
      const chunk = allSubnetIps.slice(c, c + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (ip) => {
          const res = await this.pingDesktop(ip, undefined, 800);
          return { ip, ...res };
        })
      );
      const foundInChunk = chunkResults.find((r) => r.ok);
      if (foundInChunk && foundInChunk.ip) {
        this.setRemoteIp(foundInChunk.ip);
        this.updateStatus({ state: 'idle' });
        return { ok: true, ip: foundInChunk.ip, info: foundInChunk.info };
      }
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
    if (payload.key !== undefined) {
      this.setPairingKey(payload.key);
    }

    const rawCandidates = payload.ips && payload.ips.length > 0
      ? payload.ips
      : [this.status.remoteIp].filter(Boolean);

    // Sort candidate IPs: Real Wi-Fi / Local Subnet (192.168.x, 10.x) FIRST,
    // Virtual adapters (172.x, 169.254.x, 127.x) LAST
    const candidateIps = Array.from(new Set(rawCandidates)).sort((a, b) => {
      const isVirtA = a.startsWith('172.') || a.startsWith('169.254.') || a.startsWith('127.');
      const isVirtB = b.startsWith('172.') || b.startsWith('169.254.') || b.startsWith('127.');
      if (isVirtA && !isVirtB) return 1;
      if (!isVirtA && isVirtB) return -1;
      if (a.startsWith('192.168.') && !b.startsWith('192.168.')) return -1;
      if (!a.startsWith('192.168.') && b.startsWith('192.168.')) return 1;
      if (a.startsWith('10.') && !b.startsWith('10.')) return -1;
      if (!a.startsWith('10.') && b.startsWith('10.')) return 1;
      return 0;
    });

    this.updateStatus({ state: 'connecting', errorMessage: undefined });

    // 1. Probe all candidate IPs from the QR code in PARALLEL
    const port = payload.port || 49200;
    const probePromises = candidateIps.map(async (rawIp) => {
      const host = rawIp.includes(':') ? rawIp : `${rawIp}:${port}`;
      const pingRes = await this.pingDesktop(host, payload.key, 2000);
      return { host, ok: pingRes.ok, info: pingRes.info };
    });

    const results = await Promise.all(probePromises);
    const found = results.find((r) => r.ok);
    let workingHost: string | null = found ? found.host : null;

    if (!workingHost) {
      // Fallback: try auto-discovery if candidate IPs failed
      const autoRes = await this.autoDiscoverDesktop(candidateIps);
      if (autoRes.ok && autoRes.ip) {
        workingHost = autoRes.ip.includes(':') ? autoRes.ip : `${autoRes.ip}:${port}`;
      }
    }

    if (!workingHost) {
      const err = `Не удалось связаться с ПК по адресам: ${candidateIps.join(', ')}. Убедитесь, что оба устройства в одной сети (Wi-Fi или точке доступа).`;
      this.updateStatus({ state: 'error', errorMessage: err });
      return { success: false, error: err };
    }

    this.setRemoteIp(workingHost);

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

