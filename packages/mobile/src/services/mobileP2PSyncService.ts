import {
  Neuron,
  createMerkleRoot,
  computeHash,
  threeWayMerge,
} from '@axon/shared';

export interface SyncStatus {
  state: 'idle' | 'connecting' | 'syncing' | 'connected' | 'error';
  lastSyncTime: number | null;
  remoteIp: string;
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
    localStorage.setItem('axon_remote_ip', ip);
    this.updateStatus({ remoteIp: ip });
  }

  public async pingDesktop(customIp?: string): Promise<{ ok: boolean; info?: any; error?: string }> {
    const rawIp = (customIp || this.status.remoteIp).trim();
    if (!rawIp) return { ok: false, error: 'Укажите IP адрес' };
    const host = rawIp.includes(':') ? rawIp : `${rawIp}:49200`;
    const pingUrl = `http://${host}/api/sync/ping`;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(pingUrl, { signal: ctrl.signal });
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
    const httpUrl = `http://${host}/api/sync/vault`;

    this.updateStatus({ state: 'connecting', errorMessage: undefined });

    try {
      // 1. Fast HTTP Synchronization
      const localData = getLocalPayload();
      this.updateStatus({ state: 'syncing' });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(httpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Сервер ПК вернул ошибку: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.vault) {
        throw new Error(result.error || 'Ошибка формата ответа');
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
            errorMessage: 'Не удалось подключиться к ПК. Проверьте IP и подключение к одной Wi-Fi сети.',
          });
        };
      } catch (wsErr: any) {
        this.updateStatus({
          state: 'error',
          errorMessage: 'Ошибка соединения. Убедитесь, что приложение на ПК открыто и находится в одной Wi-Fi сети.',
        });
      }
    }
  }
}

export const p2pSyncService = new MobileP2PSyncService();

