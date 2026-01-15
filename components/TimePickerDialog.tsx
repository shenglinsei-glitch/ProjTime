
import React, { useState, useEffect } from 'react';

interface TimePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (minutes: number) => void;
  initialMinutes?: number;
  title?: string;
}

const TimePickerDialog: React.FC<TimePickerDialogProps> = ({ isOpen, onClose, onSave, initialMinutes = 0, title = '時間を選択' }) => {
  const [d, setD] = useState(0);
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setD(0);
      setH(Math.floor(initialMinutes / 60));
      setM(initialMinutes % 60);
    }
  }, [isOpen, initialMinutes]);

  if (!isOpen) return null;

  const handleSave = () => {
    const total = (d * 8 * 60) + (h * 60) + m; 
    onSave(total);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3 className="text-xl font-bold mb-6 text-gray-800">{title}</h3>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">日 (8h)</label>
            <input 
              type="number" 
              value={d} 
              onChange={e => setD(Math.max(0, parseInt(e.target.value) || 0))} 
              className="w-full border-2 border-gray-100 rounded-xl p-3 text-center font-bold outline-none focus:border-[#53BEE8]" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">時間</label>
            <input 
              type="number" 
              value={h} 
              onChange={e => setH(Math.max(0, parseInt(e.target.value) || 0))} 
              className="w-full border-2 border-gray-100 rounded-xl p-3 text-center font-bold outline-none focus:border-[#53BEE8]" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">分</label>
            <input 
              type="number" 
              value={m} 
              onChange={e => setM(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} 
              className="w-full border-2 border-gray-100 rounded-xl p-3 text-center font-bold outline-none focus:border-[#53BEE8]" 
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">キャンセル</button>
          <button onClick={handleSave} className="flex-1 px-4 py-3 bg-[#53BEE8] text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform">適用</button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerDialog;
