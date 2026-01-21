
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import HeaderBar from '../../components/HeaderBar';
import ConfirmDialog from '../../components/ConfirmDialog';

const TaskTypeSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { taskTypes, taskFolders, addTaskType, updateTaskType, deleteTaskType, addTaskFolder, updateTaskFolder, deleteTaskFolder } = useApp();
  
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showFolderDeleteConfirm, setShowFolderDeleteConfirm] = useState<string | null>(null);

  const [newTaskTypeName, setNewTaskTypeName] = useState('');
  const [newTaskTypeFolderId, setNewTaskTypeFolderId] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addTaskFolder({
        id: crypto.randomUUID(),
        name: newFolderName.trim(),
        order: taskFolders.length
      });
      setNewFolderName('');
    }
  };

  const handleAddTaskType = () => {
    if (newTaskTypeName.trim()) {
      addTaskType({
        id: crypto.randomUUID(),
        name: newTaskTypeName.trim(),
        folderId: newTaskTypeFolderId || undefined,
        order: taskTypes.length,
        isDisabled: false
      });
      setNewTaskTypeName('');
    }
  };

  const handleConfirmDeleteFolder = async (folderId: string) => {
    const tasksInFolder = taskTypes.filter(t => t.folderId === folderId);
    if (tasksInFolder.length > 0) {
      alert(`このフォルダーには${tasksInFolder.length}件のタスクが含まれています。削除する前にタスクを移動するか削除してください。`);
      return;
    }
    await deleteTaskFolder(folderId);
    setShowFolderDeleteConfirm(null);
  };

  const groupedTasks = taskFolders.map(folder => ({
    folder,
    tasks: taskTypes.filter(t => t.folderId === folder.id)
  }));
  const uncategorizedTasks = taskTypes.filter(t => !t.folderId);

  return (
    <div className="pb-24 text-gray-800">
      <HeaderBar />
      <main className="p-4 md:p-6 max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">タスク名称管理</h2>
        </div>

        {/* フォルダ作成セクション */}
        <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4">フォルダー管理</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input 
              className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)} 
              placeholder="新しいフォルダー名を入力" 
              onKeyPress={e => e.key === 'Enter' && handleAddFolder()}
            />
            <button onClick={handleAddFolder} className="bg-blue-400 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg shadow-blue-100 active:scale-95 transition whitespace-nowrap">追加</button>
          </div>
          
          <div className="space-y-2">
            {taskFolders.map(folder => (
              <div key={folder.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl group border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                {editingFolderId === folder.id ? (
                  <div className="flex-1 flex gap-2">
                    <input className="flex-1 border-2 border-blue-200 rounded-xl px-3 py-1 text-sm font-bold outline-none" value={editingFolderName} onChange={e => setEditingFolderName(e.target.value)} autoFocus />
                    <button onClick={() => { updateTaskFolder({...folder, name: editingFolderName}); setEditingFolderId(null); }} className="text-blue-500 font-black text-xs px-2">保存</button>
                    <button onClick={() => setEditingFolderId(null)} className="text-gray-400 font-bold text-xs px-2">戻る</button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-black text-gray-700">📁 {folder.name}</span>
                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name); }} className="text-blue-400 text-xs font-bold hover:underline">名称変更</button>
                      <button onClick={() => setShowFolderDeleteConfirm(folder.id)} className="text-red-400 text-xs font-bold hover:underline">削除</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* タスク作成セクション */}
        <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4">タスク名称登録</h3>
          <div className="bg-gray-50/50 p-4 rounded-2xl mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                className="flex-[2] border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 bg-white min-w-0" 
                value={newTaskTypeName} 
                onChange={e => setNewTaskTypeName(e.target.value)} 
                placeholder="タスク名を入力" 
              />
              <select 
                className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 bg-white"
                value={newTaskTypeFolderId}
                onChange={e => setNewTaskTypeFolderId(e.target.value)}
              >
                <option value="">未分類</option>
                {taskFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <button onClick={handleAddTaskType} className="bg-blue-400 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg shadow-blue-100 active:scale-95 transition whitespace-nowrap">追加</button>
            </div>
          </div>

          <div className="space-y-6">
            {groupedTasks.map(({ folder, tasks }) => (
              <div key={folder.id} className="space-y-2">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-1 flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                  {folder.name} ({tasks.length})
                </div>
                {tasks.map(tt => <TaskItem key={tt.id} tt={tt} folders={taskFolders} />)}
              </div>
            ))}
            
            {uncategorizedTasks.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-1 flex items-center gap-2">
                   <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                   未分類 ({uncategorizedTasks.length})
                </div>
                {uncategorizedTasks.map(tt => <TaskItem key={tt.id} tt={tt} folders={taskFolders} />)}
              </div>
            )}
            
            {taskTypes.length === 0 && <p className="text-center py-10 text-xs text-gray-400 font-bold uppercase tracking-widest italic">タスク名が登録されていません</p>}
          </div>
        </section>
      </main>

      <ConfirmDialog 
        isOpen={!!showFolderDeleteConfirm} 
        title="フォルダーの削除" 
        message="このフォルダーを削除しますか？フォルダー内にタスクがある場合は削除できません。" 
        onConfirm={() => showFolderDeleteConfirm && handleConfirmDeleteFolder(showFolderDeleteConfirm)} 
        onCancel={() => setShowFolderDeleteConfirm(null)} 
        isDestructive 
      />
    </div>
  );
};

const TaskItem = ({ tt, folders }: any) => {
  const { updateTaskType, deleteTaskType } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tt.name);
  const [fid, setFid] = useState(tt.folderId || '');
  
  if (editing) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-white border-2 border-blue-100 rounded-2xl shadow-sm">
        <input className="w-full sm:flex-1 border-2 border-gray-100 rounded-xl px-3 py-1 text-sm font-bold" value={name} onChange={e => setName(e.target.value)} />
        <div className="flex w-full sm:w-auto gap-2 items-center">
          <select className="flex-1 border-2 border-gray-100 rounded-xl px-2 py-1 text-xs font-bold h-[34px]" value={fid} onChange={e => setFid(e.target.value)}>
            <option value="">未分類</option>
            {folders.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={() => { updateTaskType({...tt, name, folderId: fid || undefined}); setEditing(false); }} className="text-blue-500 font-black text-xs px-1 whitespace-nowrap">保存</button>
          <button onClick={() => setEditing(false)} className="text-gray-400 font-bold text-xs px-1 whitespace-nowrap">戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group border border-transparent hover:border-blue-100 hover:bg-white transition-all">
      <span className={`text-sm font-black ${tt.isDisabled ? 'text-gray-300 line-through' : 'text-gray-700'} truncate mr-2`}>{tt.name}</span>
      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button onClick={() => setEditing(true)} className="text-blue-400 text-xs font-bold hover:underline">編集</button>
        <button onClick={() => updateTaskType({...tt, isDisabled: !tt.isDisabled})} className="text-gray-400 text-xs font-bold hover:underline">{tt.isDisabled ? '有効化' : '非表示'}</button>
        <button onClick={() => deleteTaskType(tt.id)} className="text-red-400 text-xs font-bold hover:underline">削除</button>
      </div>
    </div>
  );
};

export default TaskTypeSettingsPage;
