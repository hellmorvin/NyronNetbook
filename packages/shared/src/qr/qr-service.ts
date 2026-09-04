import { qrcodegen } from './qrcodegen.js';
import jsQR from './jsqr.js';

export interface NyronQRSyncPayload {
  app: 'nyron';
  v: string;
  key: string;
  port: number;
  ips: string[];
  hostname?: string;
  created: number;
}

export function isVaultQRPayload(rawText: string): boolean {
  if (!rawText || typeof rawText !== 'string') return false;
  const trimmed = rawText.trim();
  return (
    trimmed.startsWith('nyron://vault?') ||
    trimmed.startsWith('nyron-vault:') ||
    trimmed.startsWith('{"neurons"') ||
    trimmed.startsWith('{"app":"nyron-vault"')
  );
}

export async function compressVaultForQR(vaultData: any): Promise<string> {
  try {
    const jsonStr = typeof vaultData === 'string' ? vaultData : JSON.stringify(vaultData);
    if (typeof CompressionStream !== 'undefined') {
      const stream = new Response(
        new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('gzip'))
      );
      const buffer = await stream.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      return `nyron://vault?d=${base64}`;
    } else {
      // Fallback
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      return `nyron://vault?plain=${base64}`;
    }
  } catch (e: any) {
    console.warn('compressVaultForQR failed:', e);
    const jsonStr = typeof vaultData === 'string' ? vaultData : JSON.stringify(vaultData);
    return `nyron://vault?plain=${btoa(unescape(encodeURIComponent(jsonStr)))}`;
  }
}

export async function decompressVaultFromQR(qrString: string): Promise<any | null> {
  try {
    const trimmed = qrString.trim();
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }

    let url: URL;
    if (trimmed.startsWith('nyron://')) {
      url = new URL(trimmed.replace('nyron://', 'http://localhost/'));
    } else if (trimmed.includes('vault?')) {
      url = new URL(trimmed.startsWith('http') ? trimmed : `http://localhost/${trimmed}`);
    } else {
      // Raw base64 string
      url = new URL(`http://localhost/?d=${encodeURIComponent(trimmed)}`);
    }

    const plain = url.searchParams.get('plain');
    if (plain) {
      const json = decodeURIComponent(escape(atob(plain)));
      return JSON.parse(json);
    }

    const base64 = url.searchParams.get('d') || url.searchParams.get('data');
    if (base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new Response(
          new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
        );
        const text = await stream.text();
        return JSON.parse(text);
      }
    }
    return null;
  } catch (err) {
    console.warn('decompressVaultFromQR error:', err);
    return null;
  }
}

export function encodeSyncQRPayload(payload: NyronQRSyncPayload): string {
  return JSON.stringify(payload);
}

export function decodeSyncQRPayload(rawText: string): NyronQRSyncPayload | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();

  // If this is a direct vault payload, return null so caller handles vault
  if (isVaultQRPayload(trimmed)) return null;

  // 1. Try standard JSON
  try {
    const obj = JSON.parse(trimmed);
    if (obj && (obj.app === 'nyron' || obj.key !== undefined || obj.ips || obj.port)) {
      return {
        app: 'nyron',
        v: obj.v || '1.1.0',
        key: obj.key || '',
        port: Number(obj.port) || 49200,
        ips: Array.isArray(obj.ips) ? obj.ips : (obj.ip ? [obj.ip] : []),
        hostname: obj.hostname,
        created: obj.created || Date.now(),
      };
    }
  } catch {
    // not json
  }

  // 2. Try URI format: nyron://sync?key=...&ips=192.168.1.15,192.168.137.1&port=49200
  if (trimmed.startsWith('nyron://sync') || trimmed.includes('sync?')) {
    try {
      const urlStr = trimmed.replace('nyron://', 'http://localhost/');
      const url = new URL(urlStr);
      const key = url.searchParams.get('key') || '';
      const port = Number(url.searchParams.get('port')) || 49200;
      const ipsParam = url.searchParams.get('ips') || url.searchParams.get('ip') || '';
      const ips = ipsParam.split(',').map(s => s.trim()).filter(Boolean);
      return {
        app: 'nyron',
        v: '1.1.0',
        key,
        port,
        ips,
        created: Date.now(),
      };
    } catch {
      // not url
    }
  }

  // 3. Try plain IP address like "192.168.1.45:49200" or "192.168.1.45"
  const ipMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d{1,5}))?$/);
  if (ipMatch) {
    return {
      app: 'nyron',
      v: '1.1.0',
      key: '',
      port: ipMatch[2] ? Number(ipMatch[2]) : 49200,
      ips: [ipMatch[1]],
      created: Date.now(),
    };
  }

  return null;
}

export function generateQRCodeMatrix(text: string, eccLevel: 'L' | 'M' | 'Q' | 'H' = 'M'): { size: number; modules: boolean[][] } {
  let ecc = qrcodegen.QrCode.Ecc.MEDIUM;
  if (eccLevel === 'L') ecc = qrcodegen.QrCode.Ecc.LOW;
  if (eccLevel === 'Q') ecc = qrcodegen.QrCode.Ecc.QUARTILE;
  if (eccLevel === 'H') ecc = qrcodegen.QrCode.Ecc.HIGH;

  const qr = qrcodegen.QrCode.encodeText(text, ecc);
  const size = qr.size;
  const modules: boolean[][] = [];

  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      row.push(qr.getModule(x, y));
    }
    modules.push(row);
  }

  return { size, modules };
}

export function generateQRCodeSVG(
  text: string,
  options: {
    border?: number;
    lightColor?: string;
    darkColor?: string;
  } = {}
): string {
  const border = options.border ?? 3;
  const lightColor = options.lightColor ?? '#ffffff';
  const darkColor = options.darkColor ?? '#000000';

  const { size, modules } = generateQRCodeMatrix(text);
  const totalSize = size + border * 2;

  let pathData = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules[y][x]) {
        pathData += `M${x + border},${y + border}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges">
    <rect width="100%" height="100%" fill="${lightColor}" rx="12"/>
    <path d="${pathData}" fill="${darkColor}"/>
  </svg>`;
}

export function scanQRCodeFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): string | null {
  try {
    const code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
    return code ? code.data : null;
  } catch (err) {
    console.warn('QR scan error:', err);
    return null;
  }
}
