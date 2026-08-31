import React, { useState } from 'react';
import { Plus, Trash2, Palette } from 'lucide-react';
import { useMobileBrainStore } from '../../store/useMobileBrainStore';

const COLOR_OPTIONS = ['#8052ff', '#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#3b82f6'];

export const MobileCanvasView: React.FC = () => {
  const { canvasStickies, addCanvasSticky, updateCanvasSticky, deleteCanvasSticky } =
    useMobileBrainStore();

  const [newStickyText, setNewStickyText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#8052ff');

  const handleAdd = () => {
    if (!newStickyText.trim()) return;
    addCanvasSticky(newStickyText.trim(), selectedColor);
    setNewStickyText('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0d12]">
      {/* Top Quick Create Input */}
      <div className="p-3 bg-[#14151e] border-b border-[#232533] flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newStickyText}
            onChange={(e) => setNewStickyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Новая мысль или стикер..."
            className="flex-1 py-2 px-3 rounded-xl bg-[#0c0d12] border border-[#232533] text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#8052ff]"
          />
          <button
            onClick={handleAdd}
            className="py-2 px-3 rounded-xl bg-[#8052ff] text-white font-semibold text-xs shrink-0 active:scale-95 shadow-md"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Color Picker Palette */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-[#64748b]">Цвет:</span>
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-5 h-5 rounded-full transition-transform ${
                selectedColor === color ? 'scale-125 ring-2 ring-white/60' : 'opacity-70'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Stickies List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {canvasStickies.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#64748b] p-6">
            <span className="text-4xl mb-2"></span>
            <h4 className="text-xs font-bold text-white">Холст пуст</h4>
            <p className="text-[11px] mt-1">Добавьте первый цветной стикер с идеей выше</p>
          </div>
        ) : (
          canvasStickies.map((sticky) => (
            <div
              key={sticky.id}
              className="p-4 rounded-2xl border flex flex-col justify-between shadow-lg relative group transition-all"
              style={{
                backgroundColor: `${sticky.color}15`,
                borderColor: `${sticky.color}40`,
              }}
            >
              <textarea
                value={sticky.text}
                onChange={(e) => updateCanvasSticky(sticky.id, { text: e.target.value })}
                rows={3}
                className="w-full bg-transparent text-xs text-white focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.08]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sticky.color }} />
                <button
                  onClick={() => deleteCanvasSticky(sticky.id)}
                  className="p-1 rounded-md text-[#94a3b8] hover:text-[#ff4757] active:bg-white/[0.08]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
