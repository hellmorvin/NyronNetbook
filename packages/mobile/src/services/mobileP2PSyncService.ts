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

  public async syncWithDesktop(
    getLocalNeurons: () => Neuron[],
    setLocalNeurons: (neurons: Neuron[]) => void,
    onSuccess?: () => void
  ): Promise<void> {
    const ip = this.status.remoteIp.trim();
    if (!ip) {
      this.updateStatus({ state: 'error', errorMessage: 'Укажите IP-адрес компьютера' });
      return;
    }

    const host = ip.includes(':') ? ip : `${ip}:49200`;
    const wsUrl = `ws://${host}/axon-sync`;

    this.updateStatus({ state: 'connecting', errorMessage: undefined });

    try {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      const ws = new WebSocket(wsUrl);
      this.socket = ws;

      ws.onopen = () => {
        this.updateStatus({ state: 'syncing' });
        const localNeurons = getLocalNeurons();
        const leaves = localNeurons.map((n) => ({
          id: n.id,
          filePath: n.filePath,
          contentHash: computeHash(n.content || ''),
          updatedAt: n.frontmatter.updated_at ? new Date(n.frontmatter.updated_at).getTime() : Date.now(),
        }));

        const merkleRoot = createMerkleRoot(leaves);

        // Send handshake with Merkle Root
        ws.send(
          JSON.stringify({
            type: 'HANDSHAKE',
            client: 'NyronNotebook-Mobile',
            merkleRoot,
            leaves,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'SYNC_REQUIRED') {
            // Send full notes payload for delta resolution
            const localNeurons = getLocalNeurons();
            ws.send(
              JSON.stringify({
                type: 'NOTES_PAYLOAD',
                neurons: localNeurons,
              })
            );
          } else if (msg.type === 'SYNC_MERGED') {
            // Apply merged notes
            const remoteNeurons: Neuron[] = msg.neurons || [];
            const localNeurons = getLocalNeurons();

            // Merge local and remote
            const mergedMap = new Map<string, Neuron>();
            localNeurons.forEach((n) => mergedMap.set(n.id, n));

            remoteNeurons.forEach((remote) => {
              const local = mergedMap.get(remote.id);
              if (!local) {
                mergedMap.set(remote.id, remote);
              } else {
                const localUpdated = new Date(local.frontmatter.updated_at).getTime();
                const remoteUpdated = new Date(remote.frontmatter.updated_at).getTime();

                if (remoteUpdated > localUpdated) {
                  // Run 3-way merge
                  const mergeResult = threeWayMerge(local.content, local.content, remote.content);
                  mergedMap.set(remote.id, {
                    ...remote,
                    content: mergeResult.merged,
                    rawContent: mergeResult.merged,
                  });
                }
              }
            });

            const mergedList = Array.from(mergedMap.values());
            setLocalNeurons(mergedList);

            this.updateStatus({
              state: 'connected',
              lastSyncTime: Date.now(),
              syncedCount: mergedList.length,
            });

            if (onSuccess) onSuccess();

            setTimeout(() => {
              this.updateStatus({ state: 'idle' });
            }, 3000);
          } else if (msg.type === 'ALREADY_SYNCED') {
            this.updateStatus({
              state: 'connected',
              lastSyncTime: Date.now(),
              syncedCount: getLocalNeurons().length,
            });

            if (onSuccess) onSuccess();

            setTimeout(() => {
              this.updateStatus({ state: 'idle' });
            }, 2500);
          }
        } catch (err: any) {
          console.error('P2P message error:', err);
          this.updateStatus({ state: 'error', errorMessage: err?.message || 'Ошибка обработки данных' });
        }
      };

      ws.onerror = () => {
        this.updateStatus({
          state: 'error',
          errorMessage: 'Не удалось подключиться к ПК. Проверьте IP и сеть.',
        });
      };

      ws.onclose = () => {
        if (this.status.state === 'connecting' || this.status.state === 'syncing') {
          this.updateStatus({ state: 'error', errorMessage: 'Соединение закрыто' });
        }
      };
    } catch (e: any) {
      this.updateStatus({ state: 'error', errorMessage: e?.message || 'Ошибка P2P соединения' });
    }
  }
}

export const p2pSyncService = new MobileP2PSyncService();
