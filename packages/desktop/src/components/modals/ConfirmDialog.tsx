import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center px-4 select-none animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-[#1e1e22] rounded-2xl border border-[#2e2e34] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${danger ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-[#7c5cff]/15 text-[#7c5cff] border border-[#7c5cff]/30'}`}>
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#14151e] flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-lg transition-colors ${
              danger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                : 'bg-[#7c5cff] hover:bg-[#6c48ff] shadow-[#7c5cff]/25'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
