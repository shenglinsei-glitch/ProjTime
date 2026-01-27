
import React, { useState, useEffect } from 'react';
import TimePickerDialog from './TimePickerDialog';
import ConfirmDialog from './ConfirmDialog';
import { Task, Project, TaskType, Part, MethodTag, TaskFolder, TimeEntry, CalendarSettings } from '../types';
import { formatTimerMinutes, formatDateTime, toISODateString, formatMinutes } from '../utils/time';
import { calculateTaskMedians } from '../services/estimateService';

const TaskTypeSelectionDialog = ({ onSelect, onClose }: { onSelect: (type: 'standard' | 'free') => void, onClose: () => void }) => (
  <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
    <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in slide-in-from-bottom duration-300 overflow-x-hidden">
      <h3 className="text-lg font-black text-gray-800 mb-6 text-center">タスク形式を選択</h3>
      <div className="grid grid-cols-1 gap-3">
        <button 
          onClick={() => onSelect('standard')}
          className="flex flex-col items-start p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-2xl transition group active:scale-[0.98] text-left"
        >
          <span className="text-sm font-black text-blue-600">標準タスク</span>
          <span className="text-[10px] font-bold text-blue-400/70 mt-1">過去の実績に基づき時間を自動予測します</span>
        </button>
        <button 
          onClick={() => onSelect('free')}
          className="flex flex-col items-start p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl transition active:scale-[0.98] text-left"
        >
          <span className="text-sm font-black text-gray-700">自由タスク</span>
          <span className="text-[10px] font-bold text-gray-400 mt-1">統計・予測の対象外となる単発のタスクです</span>
        </button>
      </div>
      <button onClick={onClose} className="w-full mt-4 py-3 text-gray-400 font-bold text-sm">キャンセル</button>
    </div>
  </div>
);

const TimeLogBottomSheet = ({ 
  isOpen, 
  task, 
  logs, 
  onClose, 
  onDeleteLog, 
  onUpdateLog,
  settings
}: { 
  isOpen: boolean, 
  task: Task, 
  logs: TimeEntry[], 
  onClose: () => void,
  onDeleteLog: (id: string) => void,
  onUpdateLog: (id: string, note: string) => void,
  settings: CalendarSettings
}) => {
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[800] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-t-[32px] shadow-2xl w-full max-w-lg h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center p-3 shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="px-6 pb-4 shrink-0 flex items-center justify-between border-b border-gray-50">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">計時記録</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{task.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-200">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">記録がありません</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-gray-50/50 rounded-2xl p-4 border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-gray-400">
                      {log.startAt ? `${formatDateTime(log.startAt)} – ${log.endAt ? formatDateTime(log.endAt).split(' ')[1] : ''}` : log.date}
                    </span>
                    <span className="text-lg font-black text-blue-600">
                      {formatTimerMinutes(log.actualMin)}
                      {log.isCompleted && <span className="ml-2 text-[9px] bg-[#2AC69E] text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter align-middle">完了</span>}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => { setEditingLogId(log.id); setEditNote(log.note || ''); }}
                      className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </button>
                    <button 
                      onClick={() => onDeleteLog(log.id)}
                      className="p-2 text-[#F7893F] hover:bg-[#F7893F]/10 rounded-xl transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                {editingLogId === log.id ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea 
                      value={editNote} 
                      onChange={e => setEditNote(e.target.value)} 
                      placeholder="備考を入力..."
                      className="w-full border-2 border-blue-100 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-400 bg-white"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingLogId(null)} className="px-4 py-2 text-gray-400 font-bold text-xs">キャンセル</button>
                      <button 
                        onClick={() => { onUpdateLog(log.id, editNote); setEditingLogId(null); }} 
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-xs shadow-sm"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {log.note || <span className="text-gray-300 font-medium italic">（備考なし）</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="p-6 bg-gray-50/50 border-t shrink-0">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">合計用時</span>
            <span className="text-xl font-black text-gray-900">{formatMinutes(logs.reduce((s, l) => s + l.actualMin, 0), settings.standardDailyMin)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StopTimerDialog = ({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (note: string, markCompleted: boolean) => void 
}) => {
  const [note, setNote] = useState('');
  const [markCompleted, setMarkCompleted] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight text-center">作業を終了しますか？</h3>
        
        <div className="space-y-3 mb-6">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">作業状況</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setMarkCompleted(false)}
              className={`py-3 rounded-2xl text-xs font-black border-2 transition ${!markCompleted ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-white border-gray-100 text-gray-400'}`}
            >
              未完了
            </button>
            <button 
              onClick={() => setMarkCompleted(true)}
              className={`py-3 rounded-2xl text-xs font-black border-2 transition ${markCompleted ? 'bg-[#2AC69E]/10 border-[#2AC69E] text-[#2AC69E]' : 'bg-white border-gray-100 text-gray-400'}`}
            >
              作業完了
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-6">
           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">備考</label>
           <textarea 
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="作業内容の備考（任意）"
            className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-400 bg-gray-50/30"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold hover:bg-gray-50 rounded-xl transition">キャンセル</button>
          <button 
            onClick={() => { onSave(note, markCompleted); setNote(''); setMarkCompleted(false); onClose(); }} 
            className="flex-1 py-3 bg-[#53BEE8] text-white rounded-xl font-black shadow-lg shadow-blue-100 active:scale-95 transition"
          >
            保存して終了
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskEditDialog = ({ project, task, onClose, onSave, onDelete, taskTypes, parts, methodTags, tasks, timeEntries, taskFolders, initialMode, settings }: any) => {
  const isFreeMode = task?.id ? task.isFreeTask : initialMode === 'free';
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [taskTypeId, setTaskTypeId] = useState(task?.taskTypeId || '');
  const [freeTaskName, setFreeTaskName] = useState(task?.name || '');
  const [partId, setPartId] = useState(task?.partId || '');
  const [est, setEst] = useState(task?.estimatedMin || 0);
  const [manualAct, setManualAct] = useState(task?.manualActualMin !== undefined ? task.manualActualMin : undefined);
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [showEstPicker, setShowEstPicker] = useState(false);
  const [showActPicker, setShowActPicker] = useState(false);

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
    if (!task?.id && !isFreeMode && taskTypeId) {
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
  }, [taskTypeId, partId, project.constructionMethods, methodTags, tasks, timeEntries, taskTypes, parts, task?.id, isFreeMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFreeMode && !taskTypeId) return;
    if (isFreeMode && !freeTaskName.trim()) return;

    let finalName = '';
    if (isFreeMode) {
      finalName = freeTaskName.trim();
    } else {
      const selectedType = taskTypes.find((t: any) => t.id === taskTypeId);
      const selectedPart = parts.find((p: any) => p.id === partId);
      finalName = selectedPart ? `${selectedType?.name} (${selectedPart?.name})` : (selectedType?.name || '');
    }

    onSave({ 
      ...task,
      id: task?.id || crypto.randomUUID(), 
      projectId: project.id, 
      name: finalName,
      taskTypeId: isFreeMode ? undefined : taskTypeId,
      partId: partId || undefined,
      estimatedMin: est, 
      manualActualMin: manualAct,
      startDate: startDate || undefined,
      deadline: deadline || undefined,
      labels: task?.labels || [], 
      isManualEstimate: true,
      isFreeTask: isFreeMode
    }); 
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 overflow-y-auto overflow-x-hidden max-h-[90vh]">
        <h3 className="text-xl font-bold mb-6 text-gray-800 tracking-tight">
          {task?.id ? 'タスク設定' : (isFreeMode ? '自由タスク作成' : '標準タスク作成')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {isFreeMode ? (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">タスク名</label>
                <input required value={freeTaskName} onChange={e => setFreeTaskName(e.target.value)} placeholder="タスク名を入力" className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-[#53BEE8] bg-white font-bold" />
              </div>
            ) : (
              <>
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
              </>
            )}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">部位 (任意)</label>
              <select value={partId} onChange={e => setPartId(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-[#53BEE8] bg-white font-bold">
                <option value="">選択なし (1.0)</option>
                {parts.filter((p: any) => !p.isDisabled || p.id === task?.partId).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">予定時間</label>
              <button type="button" onClick={() => setShowEstPicker(true)} className="w-full text-left border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-700 bg-gray-50/50 truncate">
                {formatMinutes(est, settings.standardDailyMin)}
                {!isFreeMode && <span className="text-[10px] text-gray-300 ml-2 font-normal">(予測)</span>}
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">実績時間 (手動)</label>
              <button type="button" onClick={() => setShowActPicker(true)} className={`w-full text-left border-2 rounded-xl p-3 text-sm font-bold truncate transition ${manualAct !== undefined ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50/50 border-gray-100 text-gray-400'}`}>
                {manualAct !== undefined ? formatMinutes(manualAct, settings.standardDailyMin) : '未入力'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-5">
            <div className="min-w-0">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">開始日</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-xs outline-none font-bold" />
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">完了期限</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-xs outline-none font-bold" />
            </div>
          </div>
          <div className="flex justify-between items-center pt-6 border-t">
            {task?.id && <button type="button" onClick={() => onDelete(task.id)} className="text-[#F7893F] text-xs font-bold px-3 py-2 hover:bg-[#F7893F]/10 rounded-lg transition">タスクを削除</button>}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-gray-50 rounded-xl text-sm transition">中止</button>
              <button type="submit" className="px-7 py-2.5 bg-[#53BEE8] text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition hover:opacity-90 text-sm active:scale-95">保存する</button>
            </div>
          </div>
        </form>
        <TimePickerDialog isOpen={showEstPicker} initialMinutes={est} onClose={() => setShowEstPicker(false)} onSave={(mins) => setEst(mins)} title="予定時間を選択" />
        <TimePickerDialog isOpen={showActPicker} initialMinutes={manualAct || 0} onClose={() => setShowActPicker(false)} onSave={(mins) => setManualAct(mins)} title="手動実績時間を入力" />
      </div>
    </div>
  );
};

interface ProjectDetailDialogsProps {
  originalProject: Project;
  settings: CalendarSettings;
  taskTypes: TaskType[];
  parts: Part[];
  methodTags: MethodTag[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  taskFolders: TaskFolder[];
  
  showTypeSelector: boolean;
  setShowTypeSelector: (val: boolean) => void;
  showTaskDialog: boolean;
  setShowTaskDialog: (val: boolean) => void;
  editingTaskForDialog: any;
  setEditingTaskForDialog: (val: any) => void;
  showStopTimerConfirm: string | null;
  setShowStopTimerConfirm: (val: string | null) => void;
  activeLogTask: Task | null;
  setActiveLogTask: (val: Task | null) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (val: boolean) => void;
  taskToDeleteId: string | null;
  setTaskToDeleteId: (val: string | null) => void;

  addTask: (t: Task) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTimeEntry: (e: TimeEntry) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;
  stopTimer: (taskId: string, note?: string, markCompleted?: boolean) => Promise<any>;
  deleteProject: (id: string) => Promise<void>;
  navigate: any;
  refreshData: () => Promise<void>;
}

const ProjectDetailDialogs: React.FC<ProjectDetailDialogsProps> = ({
  originalProject, settings, taskTypes, parts, methodTags, tasks, timeEntries, taskFolders,
  showTypeSelector, setShowTypeSelector,
  showTaskDialog, setShowTaskDialog,
  editingTaskForDialog, setEditingTaskForDialog,
  showStopTimerConfirm, setShowStopTimerConfirm,
  activeLogTask, setActiveLogTask,
  showDeleteConfirm, setShowDeleteConfirm,
  taskToDeleteId, setTaskToDeleteId,
  addTask, updateTask, deleteTask, updateTimeEntry, deleteTimeEntry, stopTimer, deleteProject, navigate, refreshData
}) => {
  return (
    <>
      {showTypeSelector && (
        <TaskTypeSelectionDialog 
          onSelect={(mode) => { setShowTypeSelector(false); setEditingTaskForDialog({ ...editingTaskForDialog, mode }); setShowTaskDialog(true); }}
          onClose={() => setShowTypeSelector(false)}
        />
      )}

      {showTaskDialog && (
        <TaskEditDialog 
          project={originalProject}
          task={editingTaskForDialog?.task || { parentTaskId: editingTaskForDialog?.parentId }}
          initialMode={editingTaskForDialog?.mode}
          taskTypes={taskTypes}
          parts={parts}
          methodTags={methodTags}
          tasks={tasks}
          timeEntries={timeEntries}
          taskFolders={taskFolders}
          settings={settings}
          onClose={() => setShowTaskDialog(false)}
          onSave={async (t: Task) => { 
            if (t.id && tasks.some(pt => pt.id === t.id)) await updateTask(t); 
            else await addTask(t); 
            setShowTaskDialog(false); 
          }}
          onDelete={async (tid: string) => { 
            setTaskToDeleteId(tid); 
            setShowTaskDialog(false); 
          }}
        />
      )}

      {activeLogTask && (
        <TimeLogBottomSheet 
          isOpen={!!activeLogTask} 
          task={activeLogTask} 
          logs={timeEntries.filter(e => e.taskId === activeLogTask.id).sort((a,b) => (b.startAt || 0) - (a.startAt || 0))} 
          onClose={() => setActiveLogTask(null)}
          onDeleteLog={deleteTimeEntry}
          onUpdateLog={(id, note) => {
            const entry = timeEntries.find(e => e.id === id);
            if (entry) updateTimeEntry({ ...entry, note });
          }}
          settings={settings}
        />
      )}

      <StopTimerDialog 
        isOpen={!!showStopTimerConfirm} 
        onClose={() => setShowStopTimerConfirm(null)} 
        onSave={async (note, markCompleted) => { 
          if (showStopTimerConfirm) {
            await stopTimer(showStopTimerConfirm, note, markCompleted);
            setShowStopTimerConfirm(null);
          }
        }} 
      />

      <ConfirmDialog 
        isOpen={showDeleteConfirm} 
        title="プロジェクト削除" 
        message="このプロジェクトとすべての実績記録を削除します。この操作は取り消せません。" 
        onConfirm={async () => { await deleteProject(originalProject.id); navigate('/'); }} 
        onCancel={() => setShowDeleteConfirm(false)} 
        isDestructive 
      />

      <ConfirmDialog 
        isOpen={!!taskToDeleteId} 
        title="タスク削除" 
        message="このタスクを削除しますか？子タスクがある場合、それらもすべて削除されます。" 
        onConfirm={async () => { 
          if(taskToDeleteId) await deleteTask(taskToDeleteId); 
          setTaskToDeleteId(null); 
          refreshData(); 
        }} 
        onCancel={() => setTaskToDeleteId(null)} 
        isDestructive 
      />
    </>
  );
};

export default ProjectDetailDialogs;
