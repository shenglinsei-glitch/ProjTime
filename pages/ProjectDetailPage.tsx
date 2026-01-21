
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import TimePickerDialog from '../components/TimePickerDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { getTaskCalculatedStats } from '../services/progressService';
import { calculateTaskMedians } from '../services/estimateService';
import { Task, Project, TaskType, Part, MethodTag, TaskFolder } from '../types';

// Helper for the specific mobile time format: only letters (m, h, d).
const formatMobileTime = (mins: number): string => {
  if (mins === 0 || !mins) return '0m';
  return `${mins}m`;
};

const TaskEditDialog = ({ project, task, onClose, onSave, onDelete, taskTypes, parts, methodTags, tasks, timeEntries, taskFolders }: any) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [taskTypeId, setTaskTypeId] = useState(task?.taskTypeId || '');
  const [partId, setPartId] = useState(task?.partId || '');
  const [est, setEst] = useState(task?.estimatedMin || 0);
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (task?.taskTypeId) {
      const tt = taskTypes.find((t: TaskType) => t.id === task.taskTypeId);
      if (tt) setSelectedFolderId(tt.folderId || 'uncategorized');
    }
  }, [task, taskTypes]);

  const filteredTaskTypes = taskTypes.filter((tt: TaskType) => {
    if (!tt.id) return false;
    if (tt.isDisabled && tt.id !== task?.taskTypeId) return false;
    if (selectedFolderId === 'uncategorized') return !tt.folderId;
    if (selectedFolderId) return tt.folderId === selectedFolderId;
    return true;
  });

  useEffect(() => {
    if (!task?.id && taskTypeId) {
      const stats = calculateTaskMedians(tasks, timeEntries);
      const tt = taskTypes.find((t: TaskType) => t.id === taskTypeId);
      const stat = stats.find(s => s.taskTypeId === taskTypeId || s.taskName === tt?.name);
      const baseMedian = stat?.medianMin || 120;
      const part = parts.find((p: Part) => p.id === partId);
      const partMultiplier = part?.difficultyMultiplier || 1.0;
      let methodMultiplier = 1.0;
      if (project.constructionMethods && project.constructionMethods.length > 0) {
        project.constructionMethods.forEach((mid: string) => {
          const mTag = methodTags.find((mt: MethodTag) => mt.id === mid);
          if (mTag && mTag.multiplier) methodMultiplier *= mTag.multiplier;
        });
      }
      setEst(Math.round(baseMedian * partMultiplier * methodMultiplier));
    }
  }, [taskTypeId, partId, project.constructionMethods, methodTags, tasks, timeEntries, taskTypes, parts, task?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTypeId) return;
    const selectedType = taskTypes.find((t: any) => t.id === taskTypeId);
    const selectedPart = parts.find((p: any) => p.id === partId);
    const displayName = selectedPart ? `${selectedType?.name} (${selectedPart?.name})` : (selectedType?.name || '');
    onSave({ 
      ...task,
      id: task?.id || crypto.randomUUID(), 
      projectId: project.id, 
      name: displayName,
      taskTypeId,
      partId: partId || undefined,
      estimatedMin: est, 
      startDate: startDate || undefined,
      deadline: deadline || undefined,
      labels: task?.labels || [], 
      isManualEstimate: true 
    }); 
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]">
        <h3 className="text-xl font-bold mb-6 text-gray-800 tracking-tight">{task?.id ? 'タスク設定' : '新規タスク'}</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">フォルダー</label>
              <select value={selectedFolderId} onChange={e => { setSelectedFolderId(e.target.value); setTaskTypeId(''); }} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-[#53BEE8] bg-white font-bold">
                <option value="">選択してください</option>
                <option value="uncategorized">未分類</option>
                {taskFolders.map((f: TaskFolder) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">タスク種別</label>
              <select required disabled={!selectedFolderId} value={taskTypeId} onChange={e => setTaskTypeId(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-[#53BEE8] bg-white font-bold disabled:bg-gray-50 disabled:text-gray-300">
                <option value="">タスクを選択</option>
                {filteredTaskTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">部位 (任意)</label>
              <select value={partId} onChange={e => setPartId(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-[#53BEE8] bg-white font-bold">
                <option value="">選択なし (1.0)</option>
                {parts.filter((p: any) => !p.isDisabled || p.id === task?.partId).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">予定時間</label>
            <button type="button" onClick={() => setShowPicker(true)} className="w-full text-left border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-700 bg-gray-50/50 truncate">
              {formatMobileTime(est)}
              <span className="text-[10px] text-gray-300 ml-2 font-normal">(実績と倍率に基づき自動計算)</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">開始日</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-xs outline-none font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">完了期限</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-xs outline-none font-bold" />
            </div>
          </div>
          <div className="flex justify-between items-center pt-6 border-t">
            {task?.id && <button type="button" onClick={() => onDelete(task.id)} className="text-red-500 text-xs font-bold px-3 py-2 hover:bg-red-50 rounded-lg transition">タスクを削除</button>}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-gray-50 rounded-xl text-sm transition">中止</button>
              <button type="submit" className="px-7 py-2.5 bg-[#53BEE8] text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition hover:opacity-90 text-sm active:scale-95">保存する</button>
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
    projects, tasks, timeEntries, settings, overrides, methodTags, taskTypes, parts, taskFolders,
    addTask, updateTask, deleteTask, addTimeEntry, deleteProject, updateProject, refreshData
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

  const projectStats = topLevelTasks.reduce((acc, t) => {
    const s = getTaskCalculatedStats(t.id, projectTasks, projectEntries);
    acc.est += s.estimatedMin;
    acc.act += s.actualMin;
    acc.completedEst += (s.estimatedMin * (s.progressPercent / 100));
    return acc;
  }, { est: 0, act: 0, completedEst: 0 });

  const totalProgress = projectStats.est > 0 ? Math.round((projectStats.completedEst / projectStats.est) * 100) : 0;
  const projectDeadline = topLevelTasks.reduce((max, t) => {
    if (!t.deadline) return max;
    return !max || t.deadline > max ? t.deadline : max;
  }, '');

  const toggleMethod = (methodId: string) => {
    const current = tempProject.constructionMethods || [];
    const next = current.includes(methodId) ? current.filter(i => i !== methodId) : [...current, methodId];
    setTempProject({ ...tempProject, constructionMethods: next });
  };

  const TaskRow: React.FC<{ task: Task, depth?: number }> = ({ task, depth = 0 }) => {
    const stats = getTaskCalculatedStats(task.id, projectTasks, projectEntries);
    const subtasks = projectTasks.filter(st => st.parentTaskId === task.id);
    const [expanded, setExpanded] = useState(true);
    const isContainer = subtasks.length > 0;
    const isParent = depth === 0;

    const handleAddAction = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isParent) {
        setEditingTaskForDialog({ parentId: task.id });
      } else {
        setEditingTaskForDialog({ parentId: task.parentTaskId });
      }
      setShowTaskDialog(true);
    };

    const handleRowClick = () => {
      if (isEditingTasksMode) {
        setEditingTaskForDialog({ task });
        setShowTaskDialog(true);
      } else if (!isContainer) {
        setShowTimePicker({ taskId: task.id, type: 'act' });
      }
    };

    return (
      <div className="border-b last:border-0">
        <div 
          className={`flex flex-col py-3 px-4 transition group ${isEditingTasksMode ? 'bg-blue-50/20 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}`}
          onClick={handleRowClick}
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          {/* Row 1: Main Info (Task Name -> Progress % -> + Button) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              {isContainer && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
                  className="p-1 -ml-1 text-gray-400 text-xs shrink-0"
                >
                  {expanded ? '▼' : '▶'}
                </button>
              )}
              <span className={`truncate font-bold tracking-tight ${isParent ? 'text-[15px]' : 'text-[13px]'} ${stats.isCompleted ? 'text-gray-400 line-through font-medium' : 'text-gray-900'}`}>
                {task.name}
              </span>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className={`font-black text-xs ${stats.isCompleted ? 'text-green-500' : 'text-[#53BEE8]'}`}>
                {stats.progressPercent}%
              </span>
              
              {!isEditingTasksMode && (
                <button 
                  onClick={handleAddAction}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50/50 text-gray-300 hover:text-[#53BEE8] hover:bg-white border border-gray-100/50 hover:border-blue-100 transition-all active:scale-90"
                  title={isParent ? "子タスクを追加" : "同階層にタスクを追加"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Time Info (Compact) */}
          <div className="mt-1 flex items-center gap-2">
            {isParent ? (
              <div className="text-[11px] font-bold text-gray-400 tracking-tight leading-none uppercase">
                Pln {formatMobileTime(stats.estimatedMin)} <span className="text-gray-200 mx-0.5">|</span> Act {formatMobileTime(stats.actualMin)}
              </div>
            ) : (
              <div className="text-[10px] font-bold text-gray-400 tracking-tight leading-none uppercase">
                Act {formatMobileTime(stats.actualMin)}
              </div>
            )}
            {task.deadline && (
              <div className="text-[9px] font-bold text-gray-300 ml-1">
                期限: {task.deadline}
              </div>
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
            {isEditingProject && <button onClick={async () => { await updateProject(tempProject); setIsEditingProject(false); }} className="bg-[#53BEE8] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition">保存</button>}
          </div>
        </div>

        {/* 摘要型基本情報パネル */}
        <div className="bg-white rounded-3xl border border-gray-100 mb-8 shadow-sm overflow-hidden">
          <div 
            className="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center cursor-pointer hover:bg-gray-50 transition border-b border-gray-50" 
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          >
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">基本情報</h3>
              {!isInfoExpanded && (
                <div className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  進捗 {totalProgress}% <span className="mx-1 text-blue-200">|</span> 期限 {projectDeadline || '未設定'}
                </div>
              )}
            </div>
            <svg className={`w-5 h-5 text-gray-300 transition-transform duration-300 ml-auto sm:ml-0 ${isInfoExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
          </div>
          
          {isInfoExpanded && (
            <div className="p-5 space-y-6">
              {/* 两列紧凑网格 */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <DetailRow label="面積" isEditing={isEditingProject} value={originalProject.area ? `${originalProject.area} ㎡` : ''} editNode={<input type="number" className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-right text-sm" value={tempProject.area || ''} onChange={e => setTempProject({...tempProject, area: parseFloat(e.target.value) || 0})}/>} />
                <DetailRow label="開始日" isEditing={isEditingProject} value={originalProject.projectStartDate || ''} editNode={<input type="date" className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-sm" value={tempProject.projectStartDate || ''} onChange={e => setTempProject({...tempProject, projectStartDate: e.target.value})}/>} />
                <DetailRow label="担当者" isEditing={isEditingProject} value={originalProject.staff || ''} editNode={<input type="text" className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-sm" value={tempProject.staff || ''} onChange={e => setTempProject({...tempProject, staff: e.target.value})}/>} />
                <DetailRow label="金額" isEditing={isEditingProject} value={originalProject.amount ? `¥${originalProject.amount.toLocaleString()}` : ''} editNode={<input type="number" className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-right text-sm" value={tempProject.amount || ''} onChange={e => setTempProject({...tempProject, amount: parseInt(e.target.value) || 0})}/>} />
                
                {/* 適用工法 (Span full width if needed or stay in grid) */}
                <div className="col-span-2 pt-1">
                  <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider block mb-1.5">適用工法</span>
                  {isEditingProject ? (
                    <div className="flex flex-wrap gap-1.5">
                      {methodTags.map(tag => (
                        <button key={tag.id} onClick={() => toggleMethod(tag.id)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition border ${tempProject.constructionMethods?.includes(tag.id) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-400'}`}>
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(originalProject.constructionMethods || []).length > 0 ? (
                        originalProject.constructionMethods?.map(mid => {
                          const tag = methodTags.find(t => t.id === mid);
                          return tag ? <span key={tag.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">{tag.name}</span> : null;
                        })
                      ) : (
                        <span className="text-gray-300 text-[11px] italic">設定なし</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 独立状态区 */}
              <div className="pt-5 border-t border-gray-50 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">全体進捗</span>
                    <div className="text-[11px] font-bold text-gray-400 leading-none">
                      <span className="text-gray-800 text-sm font-black">{totalProgress}%</span> 
                      <span className="ml-1 text-[9px] uppercase">(Act {formatMobileTime(projectStats.act)} / Pln {formatMobileTime(projectStats.est)})</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden border border-gray-50">
                    <div className="h-full bg-[#53BEE8] transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
                  </div>
                </div>
                <div className="sm:w-32 shrink-0">
                   <div className="text-[10px] font-black text-gray-400 uppercase mb-0.5 tracking-widest">最終期限</div>
                   <div className={`text-sm font-black truncate ${projectDeadline ? 'text-gray-900' : 'text-gray-300 font-normal'}`}>{projectDeadline || '未設定'}</div>
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
              <button onClick={() => setIsEditingTasksMode(!isEditingTasksMode)} className={`p-1.5 rounded-lg transition border-2 ${isEditingTasksMode ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`} title="タスクを編集">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              </button>
              <button onClick={() => { setEditingTaskForDialog({}); setShowTaskDialog(true); }} className="bg-[#53BEE8] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-100 active:scale-95 transition">+ 追加</button>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {topLevelTasks.map(task => <TaskRow key={task.id} task={task} />)}
            {topLevelTasks.length === 0 && (
              <div className="p-12 text-center text-gray-400 italic text-sm">タスクが登録されていません</div>
            )}
          </div>
        </div>
      </main>

      {showTaskDialog && (
        <TaskEditDialog project={originalProject} task={editingTaskForDialog?.task || { parentTaskId: editingTaskForDialog?.parentId }} taskTypes={taskTypes} parts={parts} methodTags={methodTags} tasks={tasks} timeEntries={timeEntries} taskFolders={taskFolders} onClose={() => setShowTaskDialog(false)} onSave={async (t: Task) => { if (t.id && projectTasks.some(pt => pt.id === t.id)) await updateTask(t); else await addTask(t); setShowTaskDialog(false); }} onDelete={async (tid: string) => { setTaskToDeleteId(tid); setShowTaskDialog(false); }} />
      )}

      <TimePickerDialog isOpen={!!showTimePicker} onClose={() => setShowTimePicker(null)} initialMinutes={0} showCompletionToggle={true} onSave={(mins, isCompleted) => { if (showTimePicker) { addTimeEntry({ id: crypto.randomUUID(), projectId: originalProject.id, taskId: showTimePicker.taskId, date: new Date().toISOString().split('T')[0], actualMin: mins, isCompleted }); } }} title="実績時間を入力" />

      <ConfirmDialog isOpen={showDeleteConfirm} title="プロジェクト削除" message="このプロジェクトとすべての実績記録を削除します。この操作は取り消せません。" onConfirm={async () => { await deleteProject(originalProject.id); navigate('/'); }} onCancel={() => setShowDeleteConfirm(false)} isDestructive />
      <ConfirmDialog isOpen={!!taskToDeleteId} title="タスク削除" message="このタスクを削除しますか？子タスクがある場合、それらもすべて削除されます。" onConfirm={async () => { if(taskToDeleteId) await deleteTask(taskToDeleteId); setTaskToDeleteId(null); refreshData(); }} onCancel={() => setTaskToDeleteId(null)} isDestructive />
    </div>
  );
};

const DetailRow = ({ label, value, isEditing, editNode }: any) => {
  const isEmpty = !value || value === '未設定' || value === '--';
  const displayValue = isEmpty ? '未設定' : value;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">{label}</span>
      {isEditing ? (
        <div className="mt-0.5">{editNode}</div>
      ) : (
        <span className={`text-[13px] tracking-tight truncate ${isEmpty ? 'text-gray-300 font-normal text-xs' : 'text-gray-800 font-bold'}`}>
          {displayValue}
        </span>
      )}
    </div>
  );
};

export default ProjectDetailPage;
