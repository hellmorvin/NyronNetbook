import React from 'react';
import logoImg from '../../assets/logo.png';

interface NeuralNotebookLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
  animated?: boolean;
}

export const NeuralNotebookLogo: React.FC<NeuralNotebookLogoProps> = ({
  size = 24,
  className = '',
  glow = true,
  animated = false,
}) => {
  return (
    <img
      src={logoImg}
      alt="NyronNotebook"
      width={size}
      height={size}
      className={`select-none shrink-0 object-contain rounded-full transition-transform ${
        animated ? 'animate-pulse' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        filter: glow ? 'drop-shadow(0 0 8px rgba(124, 92, 255, 0.45))' : undefined,
      }}
    />
  );
};
