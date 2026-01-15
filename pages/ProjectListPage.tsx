
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import { formatMinutes, getRelativeDays } from '../utils/time';
import { calculateCompletionDate } from '../services/calendarService';

const ProjectListPage: React.FC = () => {
  const { projects, tasks, timeEntries, settings, overrides, refreshData } = useApp();
  const navigate = useNavigate();

  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const projectEntries = timeEntries.filter(e => e.projectId === projectId);
    
    const rootTasks = projectTasks.filter(t => !t.parentTaskId);
    const estimatedMin = rootTasks.reduce((sum, t) => sum + t.estimatedMin, 0);
    const actualMin = projectEntries.reduce((sum, e) => sum + e.actualMin, 0);
    const remainingMin = estimatedMin - actualMin;
    
    // 子タスクを持つタスクを除外し、リーフタスク（末端のタスク）のみをカウント
    const taskCount = projectTasks.filter(t => 
      !projectTasks.some(st => st.parentTaskId === t.id)
    ).length;

    const leafTasks = projectTasks.filter(t => !projectTasks.some(st => st.parentTaskId === t.id));
    const completedTasksIds = new Set(projectEntries.map(e => e.taskId));
    
    const totalLeafEst = leafTasks.reduce((sum, t) => sum + t.estimatedMin, 0);
    const completedLeafEst = leafTasks
      .filter(t => completedTasksIds.has(t.id))
      .reduce((sum, t) => sum + t.estimatedMin, 0);
    
    const progressPercent = totalLeafEst > 0 ? Math.round((completedLeafEst / totalLeafEst) * 100) : 0;

    let actualCompletionDate = '';
    if (progressPercent === 100 && projectEntries.length > 0) {
      const dates = projectEntries.map(e => new Date(e.date).getTime());
      actualCompletionDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
    }
    
    return { estimatedMin, actualMin, remainingMin, taskCount, progressPercent, actualCompletionDate };
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const statsA = getProjectStats(a.id);
    const statsB = getProjectStats(b.id);
    const daysA = a.deadline ? getRelativeDays(a.deadline) : 9999;
    const daysB = b.deadline ? getRelativeDays(b.deadline) : 9999;

    if (daysA < 0 || daysB < 0) return daysA - daysB;
    if (daysA !== daysB) return daysA - daysB;
    return statsA.remainingMin - statsB.remainingMin;
  });

  return (
    <div className="pb-20">
      <HeaderBar onRefresh={refreshData} />
      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">プロジェクト一覧</h2>
          <button 
            onClick={() => navigate('/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            + 新規プロジェクト
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">プロジェクトがまだありません。新しく作成しましょう！</p>
            <button onClick={() => navigate('/new')} className="text-blue-600 font-semibold underline">最初のプロジェクトを作成</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProjects.map(project => {
              const { estimatedMin, actualMin, remainingMin, taskCount, progressPercent, actualCompletionDate } = getProjectStats(project.id);
              const daysLeft = project.deadline ? getRelativeDays(project.deadline) : null;
              
              const isCompleted = progressPercent === 100;
              const completionLabel = isCompleted ? '実際の完成日' : '予測完了日';
              const completionValue = isCompleted ? actualCompletionDate : calculateCompletionDate(remainingMin, settings, overrides);

              let deadlineColor = 'text-gray-500';
              if (daysLeft !== null && !isCompleted) {
                if (daysLeft < 0) deadlineColor = 'text-red-600 font-bold';
                else if (daysLeft < 3) deadlineColor = 'text-orange-500 font-semibold';
              }

              let completionDateColor = 'text-gray-800';
              if (isCompleted && project.deadline) {
                if (actualCompletionDate > project.deadline) {
                  completionDateColor = 'text-red-600 font-bold';
                } else if (actualCompletionDate < project.deadline) {
                  completionDateColor = 'text-blue-600 font-bold';
                } else {
                  completionDateColor = 'text-black font-bold';
                }
              }

              return (
                <div 
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900 truncate pr-2">{project.name}</h3>
                    <div className={`text-xs whitespace-nowrap ${deadlineColor}`}>
                      {project.deadline ? `期限: ${project.deadline}` : '期限なし'}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>進捗状況</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all bg-blue-600`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="text-gray-400">予定合計</div>
                    <div className="text-gray-800 font-medium">{formatMinutes(estimatedMin, settings.standardDailyMin)}</div>
                    
                    <div className="text-gray-400">タスク数</div>
                    <div className="text-gray-800 font-medium">{taskCount} 件</div>

                    {isCompleted ? (
                      <>
                        <div className="text-gray-400 font-bold">実績合計</div>
                        <div className="text-gray-900 font-bold">{formatMinutes(actualMin, settings.standardDailyMin)}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-gray-400">残り時間</div>
                        <div className={`font-semibold ${remainingMin < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {formatMinutes(remainingMin, settings.standardDailyMin)}
                        </div>
                      </>
                    )}

                    <div className="text-gray-400">{completionLabel}</div>
                    <div className={`font-medium ${completionDateColor}`}>{completionValue}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectListPage;
