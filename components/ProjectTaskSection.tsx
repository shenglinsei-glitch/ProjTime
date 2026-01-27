
import React, { useState, useEffect } from 'react';
import { Task, TimeEntry, CalendarSettings } from '../types';
import { getTaskCalculatedStats } from '../services/progressService';
import { formatMinutes } from '../utils/time';

interface ProjectTaskSectionProps {
  projectId: string;
  projectTasks: Task[];
  projectEntries: TimeEntry[];
  topLevelTasks: Task[];
  settings: CalendarSettings;
  isEditingTasksMode: boolean;
  setIsEditingTasksMode: (val: boolean) => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onAddSubTask: (parentId: string) => void;
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  onRequestStopTimer: (taskId: string) => void;
  onOpenLogs: (task: Task) => void;
}

const TaskRow: React.FC<{ 
  task: Task; 
  depth?: number;
  projectTasks: Task[];
  projectEntries: TimeEntry[];
  settings: CalendarSettings;
  isEditingTasksMode: boolean;
  onEditTask: (task: Task) => void;
  onAddSubTask: (parentId: string) => void;
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  onRequestStopTimer: (taskId: string) => void;
  onOpenLogs: (task: Task) => void;
}> = ({ 
  task, 
  depth = 0, 
  projectTasks, 
  projectEntries, 
  settings, 
  isEditingTasksMode, 
  onEditTask, 
  onAddSubTask,
  startTimer,
  pauseTimer,
  onRequestStopTimer,
  onOpenLogs
}) => {
  const stats = getTaskCalculatedStats(task.id, projectTasks, projectEntries);
  const subtasks = projectTasks.filter(st => st.parentTaskId === task.id);
  const [expanded, setExpanded] = useState(true);
  const isContainer = subtasks.length > 0;
  const isParent = depth === 0;

  const timer = task.timer;
  const isRunning = timer?.isRunning;
  
  let displayElapsedMs = timer?.accumulatedMs || 0;
  if (isRunning && timer?.startedAt) {
    displayElapsedMs += (Date.now() - timer.startedAt);
  }
  const displayElapsedMin = Math.floor(displayElapsedMs / 60000);

  return (
    <div className="border-b last:border-0">
      <div 
        className={`flex flex-col py-3 px-4 transition group ${isEditingTasksMode ? 'bg-blue-50/20 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}`}
        onClick={() => isEditingTasksMode && onEditTask(task)}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            {isContainer && (
              <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-1 -ml-1 text-gray-400 text-xs shrink-0">
                {expanded ? '▼' : '▶'}
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <span className={`truncate font-bold tracking-tight ${isParent ? 'text-[15px]' : 'text-[13px]'} ${stats.isCompleted ? 'text-gray-400 line-through font-medium' : 'text-gray-900'}`}>
                {task.name}
              </span>
              {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {!isContainer && !isEditingTasksMode && (
              <div className="flex items-center gap-1 bg-white/50 p-0.5 rounded-xl border border-gray-100 shadow-sm mr-2">
                {isRunning ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); pauseTimer(task.id); }}
                    className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  </button>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); startTimer(task.id); }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                )}
                {(isRunning || (timer?.accumulatedMs || 0) > 0) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRequestStopTimer(task.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col items-end min-w-[3rem]">
              <span className={`font-black text-xs ${stats.isCompleted ? 'text-[#2AC69E]' : 'text-[#53BEE8]'}`}>
                {stats.progressPercent}%
              </span>
              {!stats.isCompleted && stats.overrunMin > 0 && (
                <span className="text-[9px] font-black text-[#F7893F] leading-none mt-0.5">
                  超過 +{formatMinutes(stats.overrunMin, settings.standardDailyMin)}
                </span>
              )}
            </div>
            
            {!isEditingTasksMode && (
              <div className="flex gap-1 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); onOpenLogs(task); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50/50 text-gray-300 hover:text-blue-500 hover:bg-blue-50 border border-gray-100/50 transition-all active:scale-90"
                  title="記録を表示"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddSubTask(task.id); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50/50 text-gray-300 hover:text-[#53BEE8] hover:bg-blue-50 border border-gray-100/50 transition-all active:scale-90"
                  title={isParent ? "子タスクを追加" : "同階層にタスクを追加"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <div className="text-[10px] font-bold text-gray-400 tracking-tight leading-none uppercase flex items-center gap-2">
            <span>Pln {formatMinutes(stats.estimatedMin, settings.standardDailyMin)}</span>
            <span className="text-gray-200">|</span>
            <span className={isRunning ? 'text-red-500' : ''}>Act {formatMinutes(stats.actualMin, settings.standardDailyMin)}</span>
            {task.manualActualMin !== undefined && <span className="text-[8px] bg-blue-100 text-blue-500 px-1 py-0.5 rounded ml-0.5">手動</span>}
            {displayElapsedMin > 0 && (
              <span className="text-red-400 font-black ml-1 animate-pulse">+{displayElapsedMin}m</span>
            )}
          </div>
          {task.deadline && (
            <div className="text-[9px] font-bold text-gray-300 ml-1">
              期限: {task.deadline}
            </div>
          )}
        </div>
      </div>
      
      {expanded && subtasks.map(st => (
        <TaskRow 
          key={st.id} 
          task={st} 
          depth={depth + 1} 
          projectTasks={projectTasks} 
          projectEntries={projectEntries} 
          settings={settings} 
          isEditingTasksMode={isEditingTasksMode} 
          onEditTask={onEditTask} 
          onAddSubTask={onAddSubTask} 
          startTimer={startTimer} 
          pauseTimer={pauseTimer} 
          onRequestStopTimer={onRequestStopTimer} 
          onOpenLogs={onOpenLogs} 
        />
      ))}
    </div>
  );
};

const ProjectTaskSection: React.FC<ProjectTaskSectionProps> = ({
  projectId,
  projectTasks,
  projectEntries,
  topLevelTasks,
  settings,
  isEditingTasksMode,
  setIsEditingTasksMode,
  onCreateTask,
  onEditTask,
  onAddSubTask,
  startTimer,
  pauseTimer,
  onRequestStopTimer,
  onOpenLogs
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-4 bg-gray-50/50 border-b flex justify-between items-center">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          タスク構成{isEditingTasksMode && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full animate-pulse">編集モード</span>}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditingTasksMode(!isEditingTasksMode)} 
            className={`p-1.5 rounded-lg transition border-2 ${isEditingTasksMode ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`} 
            title="タスクを編集"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button 
            onClick={onCreateTask} 
            className="bg-[#53BEE8] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-100 active:scale-95 transition"
          >
            + 追加
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {topLevelTasks.map(task => (
          <TaskRow 
            key={task.id} 
            task={task} 
            projectTasks={projectTasks} 
            projectEntries={projectEntries} 
            settings={settings} 
            isEditingTasksMode={isEditingTasksMode} 
            onEditTask={onEditTask} 
            onAddSubTask={onAddSubTask} 
            startTimer={startTimer} 
            pauseTimer={pauseTimer} 
            onRequestStopTimer={onRequestStopTimer} 
            onOpenLogs={onOpenLogs} 
          />
        ))}
        {topLevelTasks.length === 0 && (
          <div className="p-12 text-center text-gray-400 italic text-sm">タスクが登録されていません</div>
        )}
      </div>
    </div>
  );
};

export default ProjectTaskSection;
