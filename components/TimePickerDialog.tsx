
import React, { useState, useEffect } from 'react';

interface TimePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (minutes: number, isCompleted: boolean) => void;
  initialMinutes?: number;
  showCompletionToggle?: boolean;
  title?: string;
}

const TimePickerDialog: React.FC<TimePickerDialogProps> = ({ 
  isOpen, onClose, onSave, initialMinutes = 0, title = '時間を選択', showCompletionToggle = false 
}) => {
  const [d, setD] = useState(0);
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setD(0);
      setH(Math.floor(initialMinutes / 60));
      setM(initialMinutes % 60);
      setIsCompleted(false);
    }
  }, [isOpen, initialMinutes]);

  if (!isOpen) return null;

  const handleSave = () => {
    const total = (d * 8 * 60) + (h * 60) + m; 
    onSave(total, isCompleted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8">
        <h3 className="text-xl font-black mb-6 text-gray-800 tracking-tight">{title}</h3>
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest text-center">d</label>
            <input type="number" value={d} onChange={e => setD(Math.max(0, parseInt(e.target.value) || 0))} className="w-full border-2 border-gray-100 rounded-2xl p-4 text-center font-black outline-none focus:border-[#53BEE8]" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest text-center">h</label>
            <input type="number" value={h} onChange={e => setH(Math.max(0, parseInt(e.target.value) || 0))} className="w-full border-2 border-gray-100 rounded-2xl p-4 text-center font-black outline-none focus:border-[#53BEE8]" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest text-center">m</label>
            <input type="number" value={m} onChange={e => setM(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="w-full border-2 border-gray-100 rounded-2xl p-4 text-center font-black outline-none focus:border-[#53BEE8]" />
          </div>
        </div>

        {showCompletionToggle && (
          <div className="mb-8 p-4 bg-blue-50/50 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-blue-600">タスクを「完了」にする</span>
            <input 
              type="checkbox" 
              checked={isCompleted} 
              onChange={e => setIsCompleted(e.target.checked)}
              className="w-6 h-6 rounded-lg text-[#53BEE8] focus:ring-[#53BEE8] border-blue-200"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 rounded-2xl transition">中止</button>
          <button onClick={handleSave} className="flex-1 px-4 py-4 bg-[#53BEE8] text-white rounded-2xl font-black shadow-xl shadow-blue-100 tracking-widest uppercase text-[10px] active:scale-95 transition">保存</button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerDialog;
