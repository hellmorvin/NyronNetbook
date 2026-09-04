import React, { useState, useEffect } from 'react';


export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI?.isMaximized) {
        const max = await window.electronAPI.isMaximized();
        setIsMaximized(max);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimize?.();
  };

  const handleMaximize = async () => {
    window.electronAPI?.maximize?.();
    if (window.electronAPI?.isMaximized) {
      setTimeout(async () => {
        const max = await window.electronAPI?.isMaximized?.();
        if (typeof max === 'boolean') setIsMaximized(max);
      }, 100);
    }
  };

  const handleClose = () => {
    window.electronAPI?.close?.();
  };

  return (
    <div className="flex items-center h-full select-none shrink-0 app-no-drag">
      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        className="h-11 w-11 flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors app-no-drag cursor-pointer"
        title="Свернуть"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>

      {/* Maximize / Restore Button */}
      <button
        onClick={handleMaximize}
        className="h-11 w-11 flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors app-no-drag cursor-pointer"
        title={isMaximized ? 'Восстановить' : 'Развернуть'}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M2.5 1.5H8.5V7.5" />
            <rect x="1.5" y="2.5" width="6" height="6" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="h-11 w-11 flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-[#e81123] active:bg-[#bf0f1d] transition-colors app-no-drag cursor-pointer group"
        title="Закрыть"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
          <line x1="1" y1="1" x2="9" y2="9" />
          <line x1="9" y1="1" x2="1" y2="9" />
        </svg>
      </button>
    </div>
  );
};
