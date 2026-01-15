
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';

const NewProjectPage: React.FC = () => {
  const { projects, tasks, addProject, addTask } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [area, setArea] = useState('');
  const [methods, setMethods] = useState('');
  const [tags, setTags] = useState('');
  const [sourceProjectId, setSourceProjectId] = useState('');
  const [copyEstimates, setCopyEstimates] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProjectId = crypto.randomUUID();
    await addProject({
      id: newProjectId,
      name: name.trim(),
      deadline: deadline || undefined,
      startDate: startDate || undefined,
      area: area ? parseFloat(area) : undefined,
      constructionMethods: methods ? methods.split(',').map(m => m.trim()) : [],
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      createdAt: Date.now()
    });

    if (sourceProjectId) {
      const sourceTasks = tasks.filter(t => t.projectId === sourceProjectId);
      const taskMap: Record<string, string> = {};
      
      for (const st of sourceTasks) {
        if (!st.parentTaskId) {
          const newId = crypto.randomUUID();
          taskMap[st.id] = newId;
          await addTask({
            ...st,
            id: newId,
            projectId: newProjectId,
            estimatedMin: copyEstimates ? st.estimatedMin : 0,
          });
        }
      }

      for (const st of sourceTasks) {
        if (st.parentTaskId) {
          const newId = crypto.randomUUID();
          await addTask({
            ...st,
            id: newId,
            projectId: newProjectId,
            parentTaskId: taskMap[st.parentTaskId],
            estimatedMin: copyEstimates ? st.estimatedMin : 0
          });
        }
      }
    }

    navigate(`/project/${newProjectId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <HeaderBar />
      <main className="p-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-6">新規プロジェクト作成</h2>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <label className="block text-sm font-semibold mb-2">プロジェクト名</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full border rounded-lg p-3 outline-blue-600"
              placeholder="例: ウェブサイトのリニューアル"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">開始日</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="w-full border rounded-lg p-3 outline-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">期限</label>
              <input 
                type="date" 
                value={deadline} 
                onChange={e => setDeadline(e.target.value)}
                className="w-full border rounded-lg p-3 outline-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">面積 (数值)</label>
            <input 
              type="number" 
              step="any"
              value={area} 
              onChange={e => setArea(e.target.value)}
              className="w-full border rounded-lg p-3 outline-blue-600"
              placeholder="例: 120.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">工法 (カンマ区切り)</label>
            <input 
              type="text" 
              value={methods} 
              onChange={e => setMethods(e.target.value)}
              className="w-full border rounded-lg p-3 outline-blue-600"
              placeholder="例: 木造, 鉄骨造"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">タグ (カンマ区切り)</label>
            <input 
              type="text" 
              value={tags} 
              onChange={e => setTags(e.target.value)}
              className="w-full border rounded-lg p-3 outline-blue-600"
              placeholder="例: 公共, 民間, 急ぎ"
            />
          </div>

          <div className="pt-4 border-t">
            <label className="block text-sm font-semibold mb-2">既存プロジェクトの構成をコピー</label>
            <select 
              className="w-full border rounded-lg p-3 outline-blue-600"
              value={sourceProjectId}
              onChange={e => setSourceProjectId(e.target.value)}
            >
              <option value="">-- 新規作成 --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {sourceProjectId && (
            <div className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                id="copyEst" 
                checked={copyEstimates} 
                onChange={e => setCopyEstimates(e.target.checked)}
              />
              <label htmlFor="copyEst">見積り時間もコピーする</label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-semibold"
            >
              キャンセル
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700"
            >
              作成する
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewProjectPage;
