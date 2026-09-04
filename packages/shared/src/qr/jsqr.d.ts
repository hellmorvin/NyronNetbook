export interface QRCodePoint {
  x: number;
  y: number;
}

export interface QRCodeLocation {
  topRightCorner: QRCodePoint;
  topLeftCorner: QRCodePoint;
  bottomRightCorner: QRCodePoint;
  bottomLeftCorner: QRCodePoint;
  topRightFinderPattern: QRCodePoint;
  topLeftFinderPattern: QRCodePoint;
  bottomLeftFinderPattern: QRCodePoint;
  bottomRightAlignmentPattern?: QRCodePoint;
}

export interface QRCode {
  binaryData: number[];
  data: string;
  chunks: Array<{ type: string; bytes: number[] } | { type: string; text: string }>;
  location: QRCodeLocation;
}

export interface Options {
  inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
}

declare function jsQR(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  providedOptions?: Options
): QRCode | null;

export default jsQR;
export { jsQR };
