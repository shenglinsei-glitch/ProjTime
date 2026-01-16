
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import TimePickerDialog from '../components/TimePickerDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatMinutes } from '../utils/time';
import { getTaskCalculatedStats } from '../services/progressService';
import { Task, Project } from '../types';

const TaskEditDialog = ({ project, task, onClose, onSave, onDelete, methodTags }: any) => {
  const [name, setName] = useState(task?.name || '');
  const [est, setEst] = useState(task?.estimatedMin || 0);
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [method, setMethod] = useState(task?.method || '');
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]">
        <h3 className="text-xl font-bold mb-6 text-gray-800">{task?.id ? 'タスク設定' : '新規タスク'}</h3>
        <form onSubmit={e => { 
          e.preventDefault(); 
          if(!name.trim()) return;
          onSave({ 
            ...task,
            id: task?.id || crypto.randomUUID(), 
            projectId: project.id, 
            name: name.trim(), 
            estimatedMin: est, 
            startDate: startDate || undefined,
            deadline: deadline || undefined,
            method,
            labels: task?.labels || [], 
            isManualEstimate: true 
          }); 
        }} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">タスク名</label>
            <input required autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-[#53BEE8] font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">工法 / 方式</label>
              <select value={method} onChange={e => setMethod(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-[#53BEE8] bg-white">
                <option value="">未設定</option>
                {methodTags.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">予定時間</label>
              <button type="button" onClick={() => setShowPicker(true)} className="w-full text-left border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-600 bg-gray-50 truncate">
                {formatMinutes(est).split(' (')[0]}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t pt-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">開始日</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-xs outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">期限 (DDL)</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-xs outline-none" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            {task?.id && <button type="button" onClick={() => onDelete(task.id)} className="text-red-500 text-sm font-bold px-3 py-2 hover:bg-red-50 rounded-lg transition">削除</button>}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">中止</button>
              <button type="submit" className="px-6 py-2 bg-[#53BEE8] text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition hover:opacity-90">保存</button>
            </div>
          </div>
        </form>
        <TimePickerDialog isOpen={showPicker} initialMinutes={est} onClose={() => setShowPicker(false)} onSave={setEst} />
      </div>
    </div>
  );
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    projects, tasks, timeEntries, settings, overrides, methodTags,
    addTask, updateTask, deleteTask, addTimeEntry, deleteProject, updateProject, refreshData, deleteTimeEntry
  } = useApp();
  
  const originalProject = projects.find(p => p.id === id);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isEditingTasksMode, setIsEditingTasksMode] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [tempProject, setTempProject] = useState<Project | null>(null);
  
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTaskForDialog, setEditingTaskForDialog] = useState<{task?: Task, parentId?: string} | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<{taskId: string, type: 'est' | 'act'} | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (originalProject) setTempProject(JSON.parse(JSON.stringify(originalProject)));
  }, [originalProject, isEditingProject]);

  if (!originalProject || !tempProject) return <div className="p-10 text-center text-gray-500">プロジェクトが見つかりません</div>;

  const projectTasks = tasks.filter(t => t.projectId === id);
  const projectEntries = timeEntries.filter(e => e.projectId === id);

  const topLevelTasks = projectTasks.filter(t => !t.parentTaskId);
  const projectDeadline = topLevelTasks.reduce((max, t) => {
    if (!t.deadline) return max;
    return !max || t.deadline > max ? t.deadline : max;
  }, '');

  const projectStats = topLevelTasks.reduce((acc, t) => {
    const s = getTaskCalculatedStats(t.id, projectTasks, projectEntries);
    acc.est += s.estimatedMin;
    acc.act += s.actualMin;
    acc.completedEst += (s.estimatedMin * (s.progressPercent / 100));
    return acc;
  }, { est: 0, act: 0, completedEst: 0 });

  const totalProgress = projectStats.est > 0 ? Math.round((projectStats.completedEst / projectStats.est) * 100) : 0;

  const TaskRow: React.FC<{ task: Task, depth?: number }> = ({ task, depth = 0 }) => {
    const stats = getTaskCalculatedStats(task.id, projectTasks, projectEntries);
    const subtasks = projectTasks.filter(st => st.parentTaskId === task.id);
    const [expanded, setExpanded] = useState(true);
    const isContainer = subtasks.length > 0;

    return (
      <div className="border-b last:border-0">
        <div 
          className={`flex items-start py-4 px-3 transition group ${isEditingTasksMode ? 'bg-blue-50/20 cursor-pointer' : 'hover:bg-gray-50'}`}
          onClick={() => isEditingTasksMode && (setEditingTaskForDialog({task}), setShowTaskDialog(true))}
        >
          <div style={{ width: `${depth * 16}px` }}></div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              {isContainer && <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-1 text-gray-400 text-xs">{expanded ? '▼' : '▶'}</button>}
              <span className={`truncate font-bold text-sm ${stats.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {task.name}
              </span>
              {task.method && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[9px] font-bold rounded shrink-0">{task.method}</span>}
            </div>
            {task.deadline && <div className="text-[9px] font-bold text-gray-300 pl-4">期限: {task.deadline}</div>}
          </div>

          <div className="flex items-center gap-6 ml-4 shrink-0">
            <div className="text-right">
              <div className="text-[9px] font-black text-gray-300 uppercase leading-none mb-1">予定</div>
              <div className="text-xs font-bold text-gray-500">
                {formatMinutes(stats.estimatedMin).split(' (')[0]}
              </div>
            </div>
            <div 
              className={`text-right ${!isEditingTasksMode && !isContainer ? 'cursor-pointer hover:text-blue-600 transition' : ''}`}
              onClick={(e) => { 
                if (!isEditingTasksMode && !isContainer) {
                  e.stopPropagation();
                  setShowTimePicker({ taskId: task.id, type: 'act' });
                }
              }}
            >
              <div className="text-[9px] font-black text-[#53BEE8] uppercase leading-none mb-1">実績</div>
              <div className={`text-xs font-black ${stats.actualMin > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                {stats.actualMin > 0 ? formatMinutes(stats.actualMin).split(' (')[0] : '--'}
              </div>
            </div>
            <div className="w-10 text-center">
              <div className="text-[9px] font-black text-gray-300 uppercase leading-none mb-1">進捗</div>
              <div className={`text-xs font-black ${stats.isCompleted ? 'text-green-500' : 'text-[#53BEE8]'}`}>{stats.progressPercent}%</div>
            </div>
            {!isEditingTasksMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingTaskForDialog({parentId: task.id}); setShowTaskDialog(true); }} 
                className="bg-gray-50 border border-gray-100 text-gray-400 p-1.5 rounded-lg active:scale-90 transition hover:bg-white hover:border-blue-100 hover:text-blue-400"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            )}
          </div>
        </div>
        {expanded && subtasks.map(st => <TaskRow key={st.id} task={st} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <div className="pb-24">
      <HeaderBar onRefresh={refreshData} />
      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">プロジェクト</div>
            {isEditingProject ? (
              <input className="text-2xl font-black text-gray-900 w-full bg-white border-b-2 border-[#53BEE8] outline-none" value={tempProject.name} onChange={e => setTempProject({ ...tempProject, name: e.target.value })} />
            ) : (
              <h2 className="text-2xl font-black text-gray-900">{originalProject.name}</h2>
            )}
          </div>
          <div className="flex gap-2 relative" ref={menuRef}>
            <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
            {showMoreMenu && (
              <div className="absolute top-10 right-0 w-40 bg-white border rounded shadow-lg z-[60] py-1">
                <button onClick={() => { setIsEditingProject(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b">基本情報を編集</button>
                <button onClick={() => { setShowDeleteConfirm(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-bold">プロジェクト削除</button>
              </div>
            )}
            {isEditingProject && <button onClick={async () => { await updateProject(tempProject); setIsEditingProject(false); }} className="bg-[#53BEE8] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100">保存</button>}
          </div>
        </div>

        {/* プロジェクト基本情報パネル (Foldable) */}
        <div className="bg-white rounded-3xl border border-gray-100 mb-8 shadow-sm overflow-hidden">
          <div 
            className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition border-b border-gray-50"
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          >
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">基本情報</h3>
            <button className="text-gray-400 hover:text-[#53BEE8] transition">
              <svg className={`w-5 h-5 transition-transform duration-300 ${isInfoExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
          
          {isInfoExpanded && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                <div className="space-y-4">
                  <DetailRow label="面積" isEditing={isEditingProject} value={originalProject.area ? `${originalProject.area} ㎡` : '--'} 
                    editNode={<input type="number" className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-right" value={tempProject.area || ''} onChange={e => setTempProject({...tempProject, area: parseFloat(e.target.value) || 0})}/>} 
                  />
                  <DetailRow label="開始日" isEditing={isEditingProject} value={originalProject.projectStartDate || '未設定'} 
                    editNode={<input type="date" className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1" value={tempProject.projectStartDate || ''} onChange={e => setTempProject({...tempProject, projectStartDate: e.target.value})}/>} 
                  />
                  <DetailRow label="担当者" isEditing={isEditingProject} value={originalProject.staff || '--'} 
                    editNode={<input type="text" className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1" value={tempProject.staff || ''} onChange={e => setTempProject({...tempProject, staff: e.target.value})}/>} 
                  />
                  <DetailRow label="金額" isEditing={isEditingProject} value={originalProject.amount !== undefined ? `¥ ${originalProject.amount.toLocaleString()}` : '--'} 
                    editNode={<input type="number" className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-right" value={tempProject.amount || ''} onChange={e => setTempProject({...tempProject, amount: parseFloat(e.target.value) || 0})}/>} 
                  />
                </div>
                <div>
                  <StatBox label="最終期限" value={projectDeadline || '未設定'} highlight={!!projectDeadline} />
                  <div className="mt-8">
                    <div className="flex justify-between items-end mb-2">
                      <StatBox label="全体進捗" value={`${totalProgress}%`} />
                      <div className="text-[10px] font-bold text-gray-300 mb-1">{formatMinutes(projectStats.act).split(' (')[0]} / {formatMinutes(projectStats.est).split(' (')[0]}</div>
                    </div>
                    <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-50">
                      <div className="h-full bg-[#53BEE8] transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50/50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              タスク構成
              {isEditingTasksMode && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full animate-pulse">編集モード</span>}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditingTasksMode(!isEditingTasksMode)} 
                className={`p-1.5 rounded-lg transition border-2 ${isEditingTasksMode ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                title="タスクを編集"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              </button>
              <button onClick={() => { setEditingTaskForDialog({}); setShowTaskDialog(true); }} className="bg-[#53BEE8] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-100 active:scale-95 transition">+ 追加</button>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {topLevelTasks.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </div>
      </main>

      {showTaskDialog && (
        <TaskEditDialog 
          project={originalProject} 
          task={editingTaskForDialog?.task || { parentTaskId: editingTaskForDialog?.parentId }}
          methodTags={methodTags}
          onClose={() => setShowTaskDialog(false)}
          onSave={async (t: Task) => { if (t.id && projectTasks.some(pt => pt.id === t.id)) await updateTask(t); else await addTask(t); setShowTaskDialog(false); }}
          onDelete={async (tid: string) => { setTaskToDeleteId(tid); setShowTaskDialog(false); }}
        />
      )}

      <TimePickerDialog 
        isOpen={!!showTimePicker} 
        onClose={() => setShowTimePicker(null)} 
        initialMinutes={0}
        showCompletionToggle={true}
        onSave={(mins, isCompleted) => {
          if (showTimePicker) {
            addTimeEntry({ id: crypto.randomUUID(), projectId: originalProject.id, taskId: showTimePicker.taskId, date: new Date().toISOString().split('T')[0], actualMin: mins, isCompleted });
          }
        }} 
        title="実績時間を入力" 
      />

      <ConfirmDialog isOpen={showDeleteConfirm} title="削除の確認" message="このプロジェクトとすべてのタスクを削除しますか？" onConfirm={async () => { await deleteProject(originalProject.id); navigate('/'); }} onCancel={() => setShowDeleteConfirm(false)} isDestructive />
      <ConfirmDialog isOpen={!!taskToDeleteId} title="タスク削除" message="このタスクを削除しますか？子タスクも削除されます。" onConfirm={async () => { if(taskToDeleteId) await deleteTask(taskToDeleteId); setTaskToDeleteId(null); refreshData(); }} onCancel={() => setTaskToDeleteId(null)} isDestructive />
    </div>
  );
};

const DetailRow = ({ label, value, isEditing, editNode }: any) => (
  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">{label}</span>
    {isEditing ? (
      <div className="flex-1 max-w-[200px] ml-4">{editNode}</div>
    ) : (
      <span className="font-bold text-gray-800">{value}</span>
    )}
  </div>
);

const StatBox = ({ label, value, highlight = false }: any) => (
  <div className="p-1">
    <div className="text-[9px] font-black text-gray-300 uppercase mb-1 tracking-wider">{label}</div>
    <div className={`text-xl font-black truncate ${highlight ? 'text-gray-800' : 'text-gray-600'}`}>{value}</div>
  </div>
);

export default ProjectDetailPage;
