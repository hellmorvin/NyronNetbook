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
            <div className={`p-2 rounded-lg ${danger ? 'bg-[#ff4757]/15 text-[#ff4757]' : 'bg-[#8052ff]/15 text-[#8052ff]'}`}>
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs text-[#8b8b92] mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#2e2e34] bg-[#161618] flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs text-[#8b8b92] hover:text-white hover:bg-[#24242c] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
              danger
                ? 'bg-[#ff4757] hover:bg-[#ff4757]/90'
                : 'bg-[#8052ff] hover:bg-[#8052ff]/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
