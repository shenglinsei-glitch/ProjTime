
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';

const NewProjectPage: React.FC = () => {
  const { projects, tasks, addProject, addTask } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [sourceProjectId, setSourceProjectId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProjectId = crypto.randomUUID();
    await addProject({
      id: newProjectId,
      name: name.trim(),
      area: area ? parseFloat(area) : undefined,
      createdAt: Date.now()
    });

    if (sourceProjectId) {
      const sourceTasks = tasks.filter(t => t.projectId === sourceProjectId);
      const taskMap: Record<string, string> = {};
      
      // 按层级复制
      const copyRecursive = async (parentId?: string, newParentId?: string) => {
        const levelTasks = sourceTasks.filter(t => t.parentTaskId === parentId);
        for (const st of levelTasks) {
          const newId = crypto.randomUUID();
          await addTask({
            ...st,
            id: newId,
            projectId: newProjectId,
            parentTaskId: newParentId,
            startDate: undefined, // 清空日期
            deadline: undefined
          });
          await copyRecursive(st.id, newId);
        }
      };
      await copyRecursive();
    }

    navigate(`/project/${newProjectId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <HeaderBar />
      <main className="p-6 max-w-lg mx-auto">
        <h2 className="text-2xl font-black text-gray-900 mb-8">新規プロジェクト</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">プロジェクト名</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-[#53BEE8] font-bold" placeholder="プロジェクト名を入力" />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">面積 (数值)</label>
            <input type="number" step="any" value={area} onChange={e => setArea(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-[#53BEE8] font-bold" placeholder="例: 120.5" />
          </div>

          <div className="space-y-1 pt-4 border-t">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">テンプレートから構成をコピー</label>
            <select className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-[#53BEE8] bg-white font-bold text-gray-600" value={sourceProjectId} onChange={e => setSourceProjectId(e.target.value)}>
              <option value="">-- 新規作成 (空) --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-4 text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-gray-50 rounded-2xl transition">戻る</button>
            <button type="submit" className="flex-1 px-4 py-4 bg-[#53BEE8] text-white rounded-2xl font-black shadow-xl shadow-blue-100 tracking-widest uppercase text-xs active:scale-95 transition">作成</button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewProjectPage;
