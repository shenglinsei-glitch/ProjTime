
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import { formatMinutes, getRelativeDays } from '../utils/time';
import { getTaskCalculatedStats } from '../services/progressService';
import { Project, Task } from '../types';

const ProjectListPage: React.FC = () => {
  const { projects, tasks, timeEntries, settings, refreshData } = useApp();
  const navigate = useNavigate();

  // Group active phases by project
  const projectGroups = useMemo(() => {
    const groups: Map<string, { project: Project; phases: any[] }> = new Map();

    tasks
      .filter(t => !t.parentTaskId) // Top-level tasks (Phases)
      .forEach(task => {
        const stats = getTaskCalculatedStats(task.id, tasks, timeEntries);
        if (!stats.isCompleted) {
          const project = projects.find(p => p.id === task.projectId);
          if (project) {
            if (!groups.has(project.id)) {
              groups.set(project.id, { project, phases: [] });
            }
            groups.get(project.id)!.phases.push({ task, stats });
          }
        }
      });

    return Array.from(groups.values()).sort((a, b) => b.project.createdAt - a.project.createdAt);
  }, [projects, tasks, timeEntries]);

  return (
    <div className="pb-20">
      <HeaderBar onRefresh={refreshData} />
      <main className="p-3 md:p-6 max-w-4xl mx-auto">
        <div className="flex justify-end items-center mb-4">
          {/* New Project button changed to icon-only */}
          <button 
            onClick={() => navigate('/new')}
            className="w-11 h-11 flex items-center justify-center bg-[#53BEE8] text-white rounded-full shadow-lg shadow-blue-100 font-bold hover:opacity-90 transition active:scale-95 shrink-0"
            title="新規プロジェクト"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {projectGroups.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium mb-4">現在、進行中のメインタスクはありません</p>
            <button onClick={() => navigate('/new')} className="text-[#53BEE8] font-bold">プロジェクトを作成して開始</button>
          </div>
        ) : (
          <div className="space-y-3">
            {projectGroups.map(({ project, phases }) => (
              <div 
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.99] overflow-hidden"
              >
                {/* Project Header - Enlarged & Compact */}
                <div className="px-4 pt-4 pb-1">
                  <h2 className="text-xl font-black text-gray-900 truncate tracking-tight">
                    {project.name}
                  </h2>
                </div>

                {/* Phase list within project card - Compact spacing */}
                <div className="px-4 pb-4 space-y-3 mt-1">
                  {phases.map(({ task, stats }, idx) => {
                    const daysLeft = task.deadline ? getRelativeDays(task.deadline) : null;
                    const remainingMin = stats.estimatedMin - stats.actualMin;

                    return (
                      <div key={task.id} className={`${idx > 0 ? 'pt-3 border-t border-gray-50' : ''}`}>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-sm font-bold text-[#53BEE8] truncate flex-1">
                            {task.name}
                          </h3>
                          {task.deadline && (
                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">期限</span>
                              <span className={`text-[11px] font-black ${daysLeft !== null && daysLeft < 3 ? 'text-red-500' : 'text-gray-500'}`}>
                                {task.deadline}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar - Reduced height & vertical margins */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-50 rounded-full h-1.5 overflow-hidden border border-gray-50">
                            <div 
                              className="h-full bg-[#53BEE8] transition-all duration-700 ease-out"
                              style={{ width: `${stats.progressPercent}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-black text-gray-400 w-7 text-right leading-none">{stats.progressPercent}%</span>
                        </div>

                        {/* Bottom stats - Compact horizontal line format */}
                        <div className="mt-2 flex items-center text-[10px] font-bold text-gray-400 gap-1.5 whitespace-nowrap overflow-hidden">
                          <span>子タスク {stats.childCount}件</span>
                          <span className="text-gray-200">｜</span>
                          <span className={remainingMin < 0 ? 'text-red-400' : ''}>
                            見積差 {remainingMin < 0 ? '' : '+'}{formatMinutes(remainingMin, settings.standardDailyMin).split(' ')[0]}h
                          </span>
                          <span className="text-gray-200">｜</span>
                          <span className={daysLeft !== null && daysLeft < 0 ? 'text-red-500' : ''}>
                            残 {daysLeft !== null ? (daysLeft === 0 ? '本日' : `${daysLeft}日`) : '--'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectListPage;
