
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import { formatMinutes, getRelativeDays } from '../utils/time';
import { getTaskCalculatedStats } from '../services/progressService';
import { Project, Task, ProjectStatus } from '../types';

const StatusFilterDialog = ({ 
  selected, 
  onToggle, 
  onClose 
}: { 
  selected: ProjectStatus[], 
  onToggle: (s: ProjectStatus) => void, 
  onClose: () => void 
}) => {
  const options: ProjectStatus[] = ['未開始', '進行中', '作業完了', '計上済み'];
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-6 w-full max-w-xs animate-in zoom-in-95 duration-200">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">ステータスで絞り込み</h3>
        <div className="space-y-3">
          {options.map(opt => (
            <label key={opt} className="flex items-center justify-between cursor-pointer group">
              <span className={`text-sm font-bold transition ${selected.includes(opt) ? 'text-gray-900' : 'text-gray-400'}`}>{opt}</span>
              <div 
                onClick={(e) => { e.preventDefault(); onToggle(opt); }}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  selected.includes(opt) ? 'bg-[#53BEE8] border-[#53BEE8]' : 'border-gray-200 bg-white'
                }`}
              >
                {selected.includes(opt) && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </label>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition">閉じる</button>
      </div>
    </div>
  );
};

const ProjectListPage: React.FC = () => {
  const { projects, tasks, timeEntries, settings, refreshData } = useApp();
  const navigate = useNavigate();

  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>(['未開始', '進行中', '作業完了', '計上済み']);
  const [showFilter, setShowFilter] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleStatus = (s: ProjectStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const toggleExpand = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Group phases by project
  const projectGroups = useMemo(() => {
    // Filter projects based on status
    const filteredProjects = projects.filter(p => {
      const status = p.status || '進行中';
      return selectedStatuses.includes(status);
    });

    const sortedProjects = [...filteredProjects].sort((a, b) => b.createdAt - a.createdAt);
    
    return sortedProjects.map(project => {
      const projectPhases = tasks
        .filter(t => t.projectId === project.id && !t.parentTaskId)
        .map(task => ({
          task,
          stats: getTaskCalculatedStats(task.id, tasks, timeEntries)
        }));

      // Sort phases: uncompleted first, then by name
      projectPhases.sort((a, b) => {
        if (a.stats.isCompleted !== b.stats.isCompleted) {
          return a.stats.isCompleted ? 1 : -1;
        }
        return a.task.name.localeCompare(b.task.name);
      });

      // Calculate project level summary
      const totalEst = projectPhases.reduce((sum, p) => sum + p.stats.estimatedMin, 0);
      const totalAct = projectPhases.reduce((sum, p) => sum + p.stats.actualMin, 0);
      const remainingMin = Math.max(0, totalEst - totalAct);
      
      const leafTasks = tasks.filter(t => t.projectId === project.id && !tasks.some(child => child.parentTaskId === t.id));
      const completedLeafTasks = leafTasks.filter(t => {
        const stats = getTaskCalculatedStats(t.id, tasks, timeEntries);
        return stats.isCompleted;
      });
      const progressPercent = leafTasks.length > 0 ? Math.round((completedLeafTasks.length / leafTasks.length) * 100) : 0;

      const deadline = projectPhases.reduce((max, p) => {
        if (!p.task.deadline) return max;
        return !max || p.task.deadline > max ? p.task.deadline : max;
      }, '');

      return {
        project,
        phases: projectPhases,
        summary: {
          totalEst,
          totalAct,
          remainingMin,
          progressPercent,
          deadline,
          taskCount: projectPhases.length
        }
      };
    });
  }, [projects, tasks, timeEntries, selectedStatuses]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      <HeaderBar onRefresh={refreshData} hasFab />
      
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 pb-32">
        {/* Header Layout: Title Left, Filter Button Right */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">プロジェクト一覧</h2>
          <button 
            onClick={() => setShowFilter(true)}
            className={`p-2.5 rounded-xl transition-all shadow-sm ${
              selectedStatuses.length < 4 ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {projectGroups.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-400 font-bold mb-2 uppercase tracking-widest text-xs">表示できるプロジェクトがありません</p>
            <p className="text-[10px] text-gray-300 font-medium mb-4">フィルタ条件を変更するか、新規作成してください</p>
            <button 
              onClick={() => navigate('/new')} 
              className="text-[#53BEE8] font-black hover:underline px-6 py-2 bg-blue-50 rounded-xl transition"
            >
              新規作成
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-8">
            {projectGroups.map(({ project, phases, summary }) => {
              const isExpanded = !!expandedProjects[project.id];
              return (
                <div 
                  key={project.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm transition-all overflow-hidden flex flex-col"
                >
                  {/* Project Header - Toggle area */}
                  <div 
                    className="px-6 py-5 cursor-pointer hover:bg-gray-50/50 transition-colors group"
                    onClick={() => toggleExpand(project.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-lg font-black text-gray-900 truncate tracking-tight">
                            {project.name}
                          </h2>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`); }}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="プロジェクト詳細"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black text-blue-500 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter shrink-0">
                            {project.status || '進行中'}
                          </span>
                          {project.area && (
                            <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 uppercase tracking-tighter shrink-0">
                              {project.area}㎡
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className={`text-base font-black leading-none ${summary.progressPercent === 100 ? 'text-[#2AC69E]' : 'text-[#53BEE8]'}`}>
                            {summary.progressPercent}%
                          </span>
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-0.5">Progress</span>
                        </div>
                        <div 
                          className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Collapsed Summary Info - Hidden when expanded to avoid redundancy */}
                    {!isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-5 overflow-x-auto no-scrollbar animate-in fade-in duration-300">
                        <div className="flex flex-col shrink-0">
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter leading-none mb-1">Tasks</span>
                          <span className="text-[11px] font-bold text-gray-700">{summary.taskCount}件</span>
                        </div>
                        <div className="flex flex-col shrink-0">
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter leading-none mb-1">Time</span>
                          <span className="text-[11px] font-bold text-gray-700">{formatMinutes(summary.totalAct, settings.standardDailyMin)} / {formatMinutes(summary.totalEst, settings.standardDailyMin)}</span>
                        </div>
                        {summary.deadline && (
                          <div className="flex flex-col shrink-0">
                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter leading-none mb-1">Deadline</span>
                            <span className={`text-[11px] font-bold ${getRelativeDays(summary.deadline) < 3 && summary.progressPercent < 100 ? 'text-[#F7893F]' : 'text-gray-700'}`}>
                              {summary.deadline}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col shrink-0">
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter leading-none mb-1">Remaining</span>
                          <span className={`text-[11px] font-bold ${summary.remainingMin < 0 ? 'text-[#F7893F]' : 'text-[#53BEE8]'}`}>
                            {formatMinutes(summary.remainingMin, settings.standardDailyMin)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content: Phase/Task List */}
                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-gray-50">
                      {phases.length > 0 ? (
                        phases.map(({ task, stats }, idx) => {
                          const daysLeft = task.deadline ? getRelativeDays(task.deadline) : null;
                          const remainingMin = stats.estimatedMin - stats.actualMin;

                          return (
                            <div key={task.id} className="pt-4 first:pt-4 border-t first:border-t-0 border-gray-50">
                              <div className="flex justify-between items-baseline mb-2">
                                <div className="flex items-baseline min-w-0 flex-1 gap-2">
                                  <h3 className={`text-sm font-bold truncate ${stats.isCompleted ? 'text-gray-400 line-through' : 'text-[#53BEE8]'}`}>
                                    {task.name}
                                  </h3>
                                  {stats.isCompleted && (
                                    <span className="text-[10px] font-black text-[#2AC69E] shrink-0">100%</span>
                                  )}
                                </div>
                                {task.deadline && (
                                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">期限</span>
                                    <span className={`text-[10px] font-black ${daysLeft !== null && daysLeft < 3 && !stats.isCompleted ? 'text-[#F7893F]' : 'text-gray-400'}`}>
                                      {task.deadline}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {!stats.isCompleted && (
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-50 rounded-full h-1.5 overflow-hidden border border-gray-50">
                                    <div 
                                      className="h-full transition-all duration-700 ease-out bg-[#53BEE8]"
                                      style={{ width: `${stats.progressPercent}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] font-black w-8 text-right leading-none text-gray-400">
                                    {stats.progressPercent}%
                                  </span>
                                </div>
                              )}

                              <div className={`mt-2.5 flex items-center text-[10px] font-bold text-gray-400 gap-2 whitespace-nowrap overflow-hidden ${stats.isCompleted ? 'opacity-60' : ''}`}>
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                  <span>{stats.childCount}件</span>
                                </div>
                                <span className="text-gray-200">｜</span>
                                <div className={`flex items-center gap-1 ${remainingMin < 0 && !stats.isCompleted ? 'text-[#F7893F]' : ''}`}>
                                  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  <span>{formatMinutes(remainingMin, settings.standardDailyMin)}</span>
                                </div>
                                <span className="text-gray-200">｜</span>
                                <div className={`flex items-center gap-1 ${daysLeft !== null && daysLeft < 0 && !stats.isCompleted ? 'text-[#F7893F]' : ''}`}>
                                  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  <span>{daysLeft !== null ? (daysLeft === 0 ? '本日' : `${daysLeft}d`) : '--'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">タスク未設定</p>
                        </div>
                      )}
                      
                      {/* Deep Link Button when expanded */}
                      <button 
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="w-full mt-2 py-3 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-transparent hover:border-blue-100"
                      >
                        プロジェクト詳細を表示
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showFilter && (
        <StatusFilterDialog 
          selected={selectedStatuses} 
          onToggle={toggleStatus} 
          onClose={() => setShowFilter(false)} 
        />
      )}

      {/* Floating Action Button (FAB) for New Project */}
      <button 
        onClick={() => navigate('/new')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center bg-blue-400 text-white rounded-full shadow-[0_8px_48px_rgba(83,190,232,0.4)] font-bold hover:bg-blue-500 transition-all active:scale-90 animate-in fade-in zoom-in duration-300 border border-white/20"
        title="新規プロジェクト"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default ProjectListPage;
