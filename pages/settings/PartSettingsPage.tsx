
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import HeaderBar from '../../components/HeaderBar';

const PartSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { parts, addPart, updatePart, deletePart } = useApp();

  const [newPartName, setNewPartName] = useState('');
  const [newPartDifficulty, setNewPartDifficulty] = useState(1.0);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editingPartName, setEditingPartName] = useState('');
  const [editingPartDiff, setEditingPartDiff] = useState(1.0);

  const handleAdd = () => {
    if (newPartName.trim()) {
      addPart({
        id: crypto.randomUUID(),
        name: newPartName.trim(),
        difficultyMultiplier: newPartDifficulty,
        order: parts.length,
        isDisabled: false
      });
      setNewPartName('');
      setNewPartDifficulty(1.0);
    }
  };

  return (
    <div className="pb-24 text-gray-800">
      <HeaderBar />
      <main className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">部位管理</h2>
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="bg-gray-50/50 p-4 rounded-2xl mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 bg-white" 
                value={newPartName} 
                onChange={e => setNewPartName(e.target.value)} 
                placeholder="新しい部位名" 
              />
              <div className="flex gap-2">
                <div className="flex-1 sm:w-24">
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 bg-white" 
                    value={newPartDifficulty} 
                    onChange={e => setNewPartDifficulty(parseFloat(e.target.value) || 1.0)} 
                  />
                </div>
                <button onClick={handleAdd} className="bg-blue-400 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg shadow-blue-100 active:scale-95 transition whitespace-nowrap">追加</button>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-black px-1 uppercase tracking-widest mt-2">難易度倍率 (1.0 = 標準)</div>
          </div>
          
          <div className="space-y-3">
            {parts.map(pt => (
              <div key={pt.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                {editingPartId === pt.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input className="flex-1 border-2 border-blue-200 rounded-xl px-3 py-1 text-sm font-bold" value={editingPartName} onChange={e => setEditingPartName(e.target.value)} />
                    <div className="flex gap-2 items-center">
                      <input type="number" step="0.1" className="w-16 border-2 border-blue-200 rounded-xl px-3 py-1 text-sm font-bold h-[34px]" value={editingPartDiff} onChange={e => setEditingPartDiff(parseFloat(e.target.value) || 1.0)} />
                      <button onClick={() => { updatePart({...pt, name: editingPartName, difficultyMultiplier: editingPartDiff}); setEditingPartId(null); }} className="text-blue-500 font-black text-xs whitespace-nowrap">保存</button>
                      <button onClick={() => setEditingPartId(null)} className="text-gray-400 font-bold text-xs whitespace-nowrap">戻る</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`text-sm font-black truncate ${pt.isDisabled ? 'text-gray-300 line-through' : 'text-gray-700'}`}>{pt.name}</span>
                      <span className="text-[10px] font-black px-2 py-1 bg-white border border-gray-100 rounded-lg text-gray-400 shadow-sm whitespace-nowrap">×{pt.difficultyMultiplier}</span>
                    </div>
                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button onClick={() => { setEditingPartId(pt.id); setEditingPartName(pt.name); setEditingPartDiff(pt.difficultyMultiplier); }} className="text-blue-400 text-xs font-bold hover:underline">編集</button>
                      <button onClick={() => updatePart({...pt, isDisabled: !pt.isDisabled})} className="text-gray-400 text-xs font-bold hover:underline">{pt.isDisabled ? '有効化' : '非表示'}</button>
                      <button onClick={() => deletePart(pt.id)} className="text-red-400 text-xs font-bold hover:underline">削除</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {parts.length === 0 && <p className="text-center py-10 text-xs text-gray-400 font-bold uppercase tracking-widest italic">部位が登録されていません</p>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PartSettingsPage;
