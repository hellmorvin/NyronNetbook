import React, { useMemo } from 'react';
import { generateQRCodeMatrix } from '@axon/shared';

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  border?: number;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 200,
  className = '',
  border = 3,
}) => {
  const { totalSize, pathData } = useMemo(() => {
    if (!value) return { totalSize: 0, pathData: '' };
    try {
      const { size: qrSize, modules } = generateQRCodeMatrix(value);
      const total = qrSize + border * 2;
      let path = '';
      for (let y = 0; y < qrSize; y++) {
        for (let x = 0; x < qrSize; x++) {
          if (modules[y][x]) {
            path += `M${x + border},${y + border}h1v1h-1z `;
          }
        }
      }
      return { totalSize: total, pathData: path };
    } catch (e) {
      console.error('Error generating QR:', e);
      return { totalSize: 0, pathData: '' };
    }
  }, [value, border]);

  if (!pathData) return null;

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white p-3 rounded-2xl shadow-xl transition-transform ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        className="w-full h-full"
        shapeRendering="crispEdges"
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        <path d={pathData} fill="#0a0b10" />
      </svg>
    </div>
  );
};
