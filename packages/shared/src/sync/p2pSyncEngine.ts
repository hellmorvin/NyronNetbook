import { Neuron, SyncDelta } from '../types/index.js';

export interface P2PDeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile';
  pairedAt: number;
  lastSeen: number;
  ip?: string;
}

export interface VaultSyncPayload {
  version: string;
  vaultName: string;
  timestamp: number;
  delta?: SyncDelta;
  neurons?: Neuron[];
  shifts?: any[];
  transactions?: any[];
  savingsGoals?: any[];
  bankDeposits?: any[];
  canvasCards?: any[];
  calendarEvents?: any[];
}

export interface P2PMessage {
  type: 'auth_req' | 'auth_res' | 'sync_delta' | 'sync_full' | 'ping' | 'pong';
  pairingKey?: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: 'desktop' | 'mobile';
  success?: boolean;
  error?: string;
  payload?: VaultSyncPayload;
  timestamp: number;
}

export function generatePairingKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `NYRON-${seg1}-${seg2}`;
}

export function validatePairingKey(inputKey: string, targetKey: string): boolean {
  if (!inputKey || !targetKey) return false;
  const cleanInput = inputKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanTarget = targetKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleanInput === cleanTarget;
}

export type P2PConnectionState = 'idle' | 'listening' | 'connecting' | 'connected' | 'auth_error' | 'disconnected';

export class P2PSyncEngine {
  private pairingKey: string;
  private deviceId: string;
  private deviceName: string;
  private deviceType: 'desktop' | 'mobile';
  private ws: WebSocket | null = null;
  private state: P2PConnectionState = 'idle';
  private onStateChangeCb: ((state: P2PConnectionState, details?: string) => void) | null = null;
  private onSyncReceivedCb: ((payload: VaultSyncPayload) => void) | null = null;

  constructor(pairingKey: string, deviceName: string, deviceType: 'desktop' | 'mobile') {
    this.pairingKey = pairingKey;
    this.deviceId = 'dev_' + Math.random().toString(36).substring(2, 9);
    this.deviceName = deviceName;
    this.deviceType = deviceType;
  }

  public setPairingKey(key: string) {
    this.pairingKey = key;
  }

  public getPairingKey(): string {
    return this.pairingKey;
  }

  public getState(): P2PConnectionState {
    return this.state;
  }

  public onStateChange(cb: (state: P2PConnectionState, details?: string) => void) {
    this.onStateChangeCb = cb;
  }

  public onSyncReceived(cb: (payload: VaultSyncPayload) => void) {
    this.onSyncReceivedCb = cb;
  }

  private setState(state: P2PConnectionState, details?: string) {
    this.state = state;
    if (this.onStateChangeCb) {
      this.onStateChangeCb(state, details);
    }
  }

  public connect(targetHost: string, targetPort: number = 5123) {
    this.disconnect();
    this.setState('connecting', `Подключение к ${targetHost}:${targetPort}...`);

    try {
      const wsUrl = `ws://${targetHost}:${targetPort}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        const authReq: P2PMessage = {
          type: 'auth_req',
          pairingKey: this.pairingKey,
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          deviceType: this.deviceType,
          timestamp: Date.now(),
        };
        this.ws?.send(JSON.stringify(authReq));
      };

      this.ws.onmessage = (evt) => {
        try {
          const msg: P2PMessage = JSON.parse(evt.data);
          this.handleIncomingMessage(msg);
        } catch (e) {
          console.error('[P2P] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[P2P] WebSocket error:', err);
        this.setState('auth_error', 'Ошибка подключения к хосту. Проверьте IP и Wi-Fi сеть.');
      };

      this.ws.onclose = () => {
        if (this.state !== 'auth_error') {
          this.setState('disconnected', 'Соединение закрыто.');
        }
      };
    } catch (e: any) {
      this.setState('auth_error', e?.message || 'Не удалось открыть сокет');
    }
  }

  public handleIncomingMessage(msg: P2PMessage) {
    if (msg.type === 'auth_req') {
      const isAuthValid = validatePairingKey(msg.pairingKey || '', this.pairingKey);
      if (isAuthValid) {
        const authRes: P2PMessage = {
          type: 'auth_res',
          success: true,
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          deviceType: this.deviceType,
          timestamp: Date.now(),
        };
        this.ws?.send(JSON.stringify(authRes));
        this.setState('connected', `Авторизовано устройство ${msg.deviceName || 'Peer'}`);
      } else {
        const authRes: P2PMessage = {
          type: 'auth_res',
          success: false,
          error: 'Ключи сопряжения не совпадают. Доступ отклонен в целях безопасности.',
          timestamp: Date.now(),
        };
        this.ws?.send(JSON.stringify(authRes));
        this.setState('auth_error', 'Попытка подключения с неверным ключом отклонена.');
        this.disconnect();
      }
      return;
    }

    if (msg.type === 'auth_res') {
      if (msg.success) {
        this.setState('connected', `Успешно подключено к ${msg.deviceName || 'Узлу'}`);
      } else {
        this.setState('auth_error', msg.error || 'Ключ сопряжения не подошел к удаленному устройству.');
        this.disconnect();
      }
      return;
    }

    if (msg.type === 'sync_delta' || msg.type === 'sync_full') {
      if (msg.payload && this.onSyncReceivedCb) {
        this.onSyncReceivedCb(msg.payload);
      }
      return;
    }
  }

  public broadcastPayload(payload: VaultSyncPayload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.state === 'connected') {
      const msg: P2PMessage = {
        type: payload.delta ? 'sync_delta' : 'sync_full',
        deviceId: this.deviceId,
        payload,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(msg));
    }
  }

  public disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}
