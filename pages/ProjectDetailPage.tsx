
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import TimePickerDialog from '../components/TimePickerDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatMinutes } from '../utils/time';
import { calculateCompletionDate } from '../services/calendarService';
import { Task, Project } from '../types';

// 任务编辑对话框组件 - 提升层级并确保独立性
const TaskEditDialog = ({ project, task, onClose, onSave, onDelete }: any) => {
  const [name, setName] = useState(task?.name || '');
  const [est, setEst] = useState(task?.estimatedMin || 0);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-6 text-gray-800">{task ? 'タスク設定' : '新規タスク'}</h3>
        <form onSubmit={e => { 
          e.preventDefault(); 
          if(!name.trim()) return;
          onSave({ 
            id: task?.id || crypto.randomUUID(), 
            projectId: project.id, 
            name: name.trim(), 
            estimatedMin: est, 
            labels: [], 
            isManualEstimate: true 
          }); 
        }} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">タスク名</label>
            <input 
              required 
              autoFocus
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none transition-colors font-medium focus:border-[#53BEE8]" 
              placeholder="タスクの名前を入力"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">予定時間</label>
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold text-gray-600 text-sm">
                {formatMinutes(est)}
              </div>
              <button 
                type="button" 
                onClick={() => setShowPicker(true)} 
                className="px-4 bg-white border-2 border-blue-100 text-blue-500 rounded-xl text-xs font-bold transition hover:bg-blue-50"
              >
                変更
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center pt-6">
            {task && <button type="button" onClick={() => onDelete(task.id)} className="text-red-500 text-sm font-bold px-3 py-2 hover:bg-red-50 rounded-lg">削除</button>}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">キャンセル</button>
              <button type="submit" className="px-6 py-2 bg-[#53BEE8] text-white rounded-xl font-bold shadow shadow-blue-100 transition hover:opacity-90 active:scale-95">適用</button>
            </div>
          </div>
        </form>
        {/* 内嵌的时间选择器层级需更高 */}
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
    addTask, updateTask, deleteTask, addTimeEntry, deleteProject, updateProject, refreshData, addMethodTag, deleteTimeEntry
  } = useApp();
  
  const originalProject = projects.find(p => p.id === id);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [tempProject, setTempProject] = useState<Project | null>(null);
  const [editedTaskData, setEditedTaskData] = useState<Record<string, { name: string, est: number, act: number }>>({});
  
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTaskForDialog, setEditingTaskForDialog] = useState<Task | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<{taskId: string, type: 'est' | 'act'} | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [newMethodInput, setNewMethodInput] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    if (originalProject) {
      setTempProject(JSON.parse(JSON.stringify(originalProject)));
    }
  }, [originalProject, isEditingProject]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!originalProject || !tempProject) return <div className="p-10 text-center text-gray-500">プロジェクトが見つかりません</div>;

  const projectTasks = tasks.filter(t => t.projectId === id);
  const projectEntries = timeEntries.filter(e => e.projectId === id);

  const getTaskStats = (taskId: string) => {
    const subTasks = projectTasks.filter(st => st.parentTaskId === taskId);
    const entries = projectEntries.filter(e => e.taskId === taskId);
    const actual = entries.reduce((s, e) => s + e.actualMin, 0);
    let subActual = actual;
    let subEstimated = projectTasks.find(t => t.id === taskId)?.estimatedMin || 0;
    subTasks.forEach(st => {
      const stats = getTaskStats(st.id);
      subActual += stats.actual;
      subEstimated += stats.estimated;
    });
    return { actual: subActual, estimated: subEstimated, selfActual: actual };
  };

  const projectSummary = projectTasks.filter(t => !t.parentTaskId).reduce((acc, t) => {
    const stats = getTaskStats(t.id);
    acc.est += stats.estimated;
    acc.act += stats.actual;
    return acc;
  }, { est: 0, act: 0 });

  const remainingMin = projectSummary.est - projectSummary.act;
  const completionDate = calculateCompletionDate(remainingMin, settings, overrides);

  const handleSaveProject = async () => {
    if (tempProject) await updateProject(tempProject);
    setIsEditingProject(false);
  };

  const handleSaveTasks = async () => {
    for (const taskId in editedTaskData) {
      const { name, est, act } = editedTaskData[taskId];
      const originalTask = projectTasks.find(t => t.id === taskId);
      if (originalTask) {
        await updateTask({ ...originalTask, name, estimatedMin: est });
        const currentAct = getTaskStats(taskId).selfActual;
        if (act !== currentAct) {
          const taskEntries = projectEntries.filter(e => e.taskId === taskId);
          for (const ent of taskEntries) await deleteTimeEntry(ent.id);
          await addTimeEntry({
            id: crypto.randomUUID(),
            projectId: originalProject.id,
            taskId,
            date: new Date().toISOString().split('T')[0],
            actualMin: act,
            note: '一括修正による調整'
          });
        }
      }
    }
    setEditedTaskData({});
    setIsEditingTasks(false);
    refreshData();
  };

  const toggleMethod = (name: string) => {
    if (!tempProject) return;
    const current = tempProject.constructionMethods || [];
    if (current.includes(name)) {
      setTempProject({ ...tempProject, constructionMethods: current.filter(m => m !== name) });
    } else {
      setTempProject({ ...tempProject, constructionMethods: [...current, name] });
    }
  };

  const handleAddManualMethod = async () => {
    if (!newMethodInput.trim() || !tempProject) return;
    const name = newMethodInput.trim();
    if (!methodTags.some(t => t.name === name)) {
      await addMethodTag({ id: crypto.randomUUID(), name });
    }
    toggleMethod(name);
    setNewMethodInput('');
  };

  const handleLongPressStart = (taskId: string) => {
    if (!isEditingTasks) return;
    longPressTimer.current = window.setTimeout(() => {
      setTaskToDeleteId(taskId);
      navigator.vibrate?.(50);
    }, 800);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const TaskRow: React.FC<{ task: Task, depth?: number }> = ({ task, depth = 0 }) => {
    const stats = getTaskStats(task.id);
    const subtasks = projectTasks.filter(st => st.parentTaskId === task.id);
    const [expanded, setExpanded] = useState(true);
    const editState = editedTaskData[task.id] || { name: task.name, est: task.estimatedMin, act: stats.selfActual };
    const updateEdit = (key: string, val: any) => {
      setEditedTaskData(prev => ({ ...prev, [task.id]: { ...editState, [key]: val } }));
    };

    return (
      <div className="border-b last:border-0">
        <div 
          className={`flex items-start py-3 px-2 transition select-none ${isEditingTasks ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
          onPointerDown={() => handleLongPressStart(task.id)}
          onPointerUp={handleLongPressEnd}
          onPointerLeave={handleLongPressEnd}
        >
          <div style={{ width: `${depth * 20}px` }}></div>
          <div className="flex-1 flex flex-col gap-1 overflow-hidden">
            <div className="flex items-center gap-2">
              {subtasks.length > 0 && <button onClick={() => setExpanded(!expanded)} className="p-1 text-gray-400">{expanded ? '▼' : '▶'}</button>}
              {isEditingTasks ? (
                <input 
                  className="flex-1 bg-white border border-blue-200 rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-[#53BEE8]"
                  value={editState.name}
                  onChange={(e) => updateEdit('name', e.target.value)}
                />
              ) : (
                <div 
                  className="truncate font-medium text-gray-800 cursor-pointer"
                  onClick={() => !isBatchMode && (setEditingTaskForDialog(task), setShowTaskDialog(true))}
                >
                  {task.name}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {isEditingTasks ? (
              <div className="flex gap-2 ml-4">
                <button onClick={() => setShowTimePicker({ taskId: task.id, type: 'est' })} className="w-24 text-right px-2 py-1 bg-white border rounded text-xs font-bold text-gray-600 truncate">{formatMinutes(editState.est).split(' ')[0]}h</button>
                <button onClick={() => setShowTimePicker({ taskId: task.id, type: 'act' })} className="w-24 text-right px-2 py-1 bg-white border rounded text-xs font-bold text-blue-600 truncate">{formatMinutes(editState.act).split(' ')[0]}h</button>
              </div>
            ) : (
              <>
                {!isBatchMode && (
                  <div className="w-24 text-right text-xs text-gray-400 truncate">{formatMinutes(task.estimatedMin, settings.standardDailyMin).split(' ')[0]}h</div>
                )}
                <div 
                  className={`w-24 text-sm text-right cursor-pointer font-bold truncate ${stats.actual > 0 ? 'text-gray-900' : 'text-gray-300'}`}
                  onClick={() => !isBatchMode && setShowTimePicker({ taskId: task.id, type: 'act' })}
                >
                  {stats.actual > 0 ? formatMinutes(stats.actual, settings.standardDailyMin).split(' ')[0] + 'h' : '--'}
                </div>
                {isBatchMode && (
                  <button onClick={() => setShowTimePicker({ taskId: task.id, type: 'act' })} className="bg-[#53BEE8] text-white px-3 py-1 rounded text-[10px] ml-4 font-bold active:scale-95">输入</button>
                )}
              </>
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
            {isEditingProject ? (
              <input 
                className="text-3xl font-bold text-gray-900 w-full bg-white border-b-2 border-[#53BEE8] outline-none"
                value={tempProject.name}
                onChange={(e) => setTempProject({ ...tempProject, name: e.target.value })}
              />
            ) : (
              <h2 className="text-3xl font-bold text-gray-900">{originalProject.name}</h2>
            )}
          </div>
          <div className="flex items-center gap-2 relative" ref={menuRef}>
            {!isEditingProject ? (
              <>
                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition active:bg-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>
                {showMoreMenu && (
                  <div className="absolute top-10 right-0 w-32 bg-white border rounded shadow-lg z-[60] overflow-hidden py-1">
                    <button onClick={() => { setIsEditingProject(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b font-bold">修正</button>
                    <button onClick={() => { setShowDeleteConfirm(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-bold">削除</button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingProject(false)} className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-bold">中止</button>
                <button onClick={handleSaveProject} className="bg-[#53BEE8] text-white px-6 py-2 rounded-lg font-bold shadow hover:opacity-90 active:scale-95 transition">保存</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <DetailRow label="面積" isEditing={isEditingProject} value={originalProject.area || '--'} 
                editNode={<input type="number" className="w-24 text-right font-bold border-b outline-none focus:border-[#53BEE8]" value={tempProject.area || ''} onChange={e => setTempProject({...tempProject, area: parseFloat(e.target.value) || 0})}/>} 
              />
              <DetailRow label="開始日" isEditing={isEditingProject} value={originalProject.startDate || '未設定'} 
                editNode={<input type="date" className="border-b outline-none font-bold focus:border-[#53BEE8]" value={tempProject.startDate || ''} onChange={e => setTempProject({...tempProject, startDate: e.target.value})}/>} 
              />
              <DetailRow label="期限" isEditing={isEditingProject} value={originalProject.deadline || '未設定'} 
                editNode={<input type="date" className="border-b outline-none font-bold focus:border-[#53BEE8]" value={tempProject.deadline || ''} onChange={e => setTempProject({...tempProject, deadline: e.target.value})}/>} 
              />
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">工法タグ</span>
              <div className="flex flex-wrap gap-2">
                {(isEditingProject ? tempProject.constructionMethods : originalProject.constructionMethods)?.map(m => (
                  <span key={m} onClick={() => isEditingProject && toggleMethod(m)} className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${isEditingProject ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {m} {isEditingProject && '×'}
                  </span>
                )) || <span className="text-gray-300 italic text-xs">未登録</span>}
              </div>
              {isEditingProject && (
                <div className="mt-4 pt-4 border-t border-dashed space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {methodTags.filter(t => !tempProject.constructionMethods?.includes(t.name)).map(tag => (
                      <button key={tag.id} onClick={() => toggleMethod(tag.name)} className="px-2 py-1 border rounded-lg text-[10px] hover:bg-blue-50 transition">+ {tag.name}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="flex-1 border rounded-lg px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-[#53BEE8]" placeholder="新規工法を追加" value={newMethodInput} onChange={e => setNewMethodInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddManualMethod()} />
                    <button onClick={handleAddManualMethod} className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-bold active:scale-95">追加</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
            <StatBox label="予定合計" value={formatMinutes(projectSummary.est, settings.standardDailyMin)} />
            <StatBox label="実績合計" value={formatMinutes(projectSummary.act, settings.standardDailyMin)} />
            <StatBox label="残り" value={formatMinutes(remainingMin, settings.standardDailyMin)} highlight={remainingMin < 0} />
            <StatBox label="完了予測" value={completionDate} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              タスク
              {isEditingTasks && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full animate-pulse">修正中</span>}
            </h3>
            <div className="flex gap-2">
              {!isEditingTasks ? (
                <>
                  <button onClick={() => { setIsBatchMode(!isBatchMode); setIsEditingTasks(false); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition active:scale-95 ${isBatchMode ? 'bg-blue-600 border-blue-600 text-white shadow' : 'bg-white border-gray-200 text-gray-500 shadow-sm'}`}>
                    一括実績
                  </button>
                  <button onClick={() => { setIsEditingTasks(true); setIsBatchMode(false); }} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm active:scale-95">
                    タスク修正
                  </button>
                  <button onClick={() => { setEditingTaskForDialog(null); setShowTaskDialog(true); }} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#53BEE8] text-white shadow active:scale-95 hover:opacity-90 transition">+ 追加</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setIsEditingTasks(false); setEditedTaskData({}); }} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-500 active:scale-95">中止</button>
                  <button onClick={handleSaveTasks} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow active:scale-95 hover:opacity-90">一括保存</button>
                </>
              )}
            </div>
          </div>
          {isEditingTasks && (
            <div className="bg-blue-50 px-4 py-2 text-[10px] text-blue-500 font-bold text-center">
              💡 修正モード: 名称/予定/実績を直接編集できます。长押しでタスクを削除。
            </div>
          )}
          <div className="divide-y">
            {projectTasks.filter(t => !t.parentTaskId).map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </div>
      </main>

      {/* 对话框挂载点 */}
      {showTaskDialog && (
        <TaskEditDialog 
          project={originalProject} 
          task={editingTaskForDialog} 
          onClose={() => setShowTaskDialog(false)}
          onSave={async (t: Task) => { 
            if (editingTaskForDialog) await updateTask(t); 
            else await addTask(t); 
            setShowTaskDialog(false); 
          }}
          onDelete={async (tid: string) => { 
            setTaskToDeleteId(tid); 
            setShowTaskDialog(false); 
          }}
        />
      )}

      <TimePickerDialog 
        isOpen={!!showTimePicker} 
        onClose={() => setShowTimePicker(null)} 
        initialMinutes={showTimePicker ? (isEditingTasks ? (showTimePicker.type === 'est' ? (editedTaskData[showTimePicker.taskId]?.est ?? 0) : (editedTaskData[showTimePicker.taskId]?.act ?? 0)) : 0) : 0}
        onSave={mins => {
          if (!showTimePicker) return;
          if (isEditingTasks) {
            const current = editedTaskData[showTimePicker.taskId] || { name: '', est: 0, act: 0 };
            setEditedTaskData(prev => ({ 
              ...prev, 
              [showTimePicker.taskId]: { 
                ...current, 
                [showTimePicker.type]: mins,
                name: current.name || projectTasks.find(t => t.id === showTimePicker.taskId)?.name || ''
              } 
            }));
          } else if (showTimePicker.type === 'act') {
            addTimeEntry({ id: crypto.randomUUID(), projectId: originalProject.id, taskId: showTimePicker.taskId, date: new Date().toISOString().split('T')[0], actualMin: mins });
          }
        }} 
        title={showTimePicker?.type === 'est' ? '予定時間の修正' : '実績時間の入力'} 
      />

      <ConfirmDialog 
        isOpen={showDeleteConfirm}
        title="プロジェクトの削除"
        message="このプロジェクトを削除しますか？実績データもすべて失われます。"
        confirmText="削除する"
        onConfirm={async () => { await deleteProject(originalProject.id); navigate('/'); }}
        onCancel={() => setShowDeleteConfirm(false)}
        isDestructive
      />

      <ConfirmDialog 
        isOpen={!!taskToDeleteId}
        title="タスクの削除"
        message="このタスクを削除しますか？紐付いた実績も削除されます。"
        confirmText="削除"
        onConfirm={async () => { if(taskToDeleteId) await deleteTask(taskToDeleteId); setTaskToDeleteId(null); refreshData(); }}
        onCancel={() => setTaskToDeleteId(null)}
        isDestructive
      />
    </div>
  );
};

const DetailRow = ({ label, value, isEditing, editNode }: any) => (
  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">{label}</span>
    {isEditing ? editNode : <span className="font-bold text-gray-800">{value}</span>}
  </div>
);

const StatBox = ({ label, value, highlight = false }: any) => (
  <div className="p-2 border-r last:border-0 border-gray-50">
    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</div>
    <div className={`text-sm font-black truncate ${highlight ? 'text-red-500' : 'text-gray-900'}`}>{value}</div>
  </div>
);

export default ProjectDetailPage;
