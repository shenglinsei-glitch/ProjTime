import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import HeaderBar from '../../components/HeaderBar';

const MethodSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { methodTags, addMethodTag, updateMethodTag, deleteMethodTag } = useApp();

  const [newTagName, setNewTagName] = useState('');
  const [newTagMultiplier, setNewTagMultiplier] = useState(1.0);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagMultiplier, setEditingTagMultiplier] = useState(1.0);

  const handleAdd = () => {
    if (newTagName.trim()) {
      addMethodTag({
        id: crypto.randomUUID(),
        name: newTagName.trim(),
        multiplier: newTagMultiplier
      });
      setNewTagName('');
      setNewTagMultiplier(1.0);
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
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">工法管理</h2>
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="bg-gray-50/50 p-4 rounded-2xl mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 bg-white" 
                value={newTagName} 
                onChange={e => setNewTagName(e.target.value)} 
                placeholder="新しい工法名" 
              />
              <div className="flex gap-2">
                <div className="flex-1 sm:w-24">
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 bg-white" 
                    value={newTagMultiplier} 
                    onChange={e => setNewTagMultiplier(parseFloat(e.target.value) || 1.0)} 
                  />
                </div>
                <button onClick={handleAdd} className="bg-blue-400 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg shadow-blue-100 active:scale-95 transition whitespace-nowrap">追加</button>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-black px-1 uppercase tracking-widest mt-2">工法倍率 (1.0 = 標準)</div>
          </div>
          
          <div className="space-y-3">
            {methodTags.map(mt => (
              <div key={mt.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                {editingTagId === mt.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input className="flex-1 border-2 border-blue-200 rounded-xl px-3 py-1 text-sm font-bold outline-none" value={editingTagName} onChange={e => setEditingTagName(e.target.value)} />
                    <div className="flex gap-2 items-center">
                      <input type="number" step="0.1" className="w-16 border-2 border-blue-200 rounded-xl px-3 py-1 text-sm font-bold h-[34px]" value={editingTagMultiplier} onChange={e => setEditingTagMultiplier(parseFloat(e.target.value) || 1.0)} />
                      <button onClick={() => { updateMethodTag({...mt, name: editingTagName, multiplier: editingTagMultiplier}); setEditingTagId(null); }} className="text-blue-500 font-black text-xs whitespace-nowrap">保存</button>
                      <button onClick={() => setEditingTagId(null)} className="text-gray-400 font-bold text-xs whitespace-nowrap">戻る</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-sm font-black text-gray-700 truncate">{mt.name}</span>
                      <span className="text-[10px] font-black px-2 py-1 bg-white border border-gray-100 rounded-lg text-gray-400 shadow-sm whitespace-nowrap">×{mt.multiplier || 1.0}</span>
                    </div>
                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button onClick={() => { setEditingTagId(mt.id); setEditingTagName(mt.name); setEditingTagMultiplier(mt.multiplier || 1.0); }} className="text-blue-400 text-xs font-bold hover:underline">編集</button>
                      <button onClick={() => deleteMethodTag(mt.id)} className="text-[#F7893F] text-xs font-bold hover:underline">削除</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {methodTags.length === 0 && <p className="text-center py-10 text-xs text-gray-400 font-bold uppercase tracking-widest italic">工法が登録されていません</p>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MethodSettingsPage;