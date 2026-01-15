
import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import { formatMinutes } from '../utils/time';
import { calculateTaskMedians } from '../services/estimateService';

const StatsPage: React.FC = () => {
  const { projects, tasks, timeEntries, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');

  const taskStats = useMemo(() => {
    return calculateTaskMedians(tasks, timeEntries);
  }, [tasks, timeEntries]);

  const projectStats = useMemo(() => {
    return projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const pEntries = timeEntries.filter(e => e.projectId === p.id);
      const est = pTasks.filter(t => !t.parentTaskId).reduce((s, t) => s + t.estimatedMin, 0);
      const act = pEntries.reduce((s, e) => s + e.actualMin, 0);
      
      // リーフタスクのみをカウント
      const taskCount = pTasks.filter(t => 
        !pTasks.some(st => st.parentTaskId === t.id)
      ).length;

      return { 
        id: p.id,
        name: p.name, 
        est, 
        act, 
        taskCount,
        diff: act - est 
      };
    });
  }, [projects, tasks, timeEntries]);

  return (
    <div>
      <HeaderBar />
      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'projects' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            プロジェクト集計
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'tasks' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            タスク予測分析
          </button>
        </div>

        {activeTab === 'projects' ? (
          <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">プロジェクト名</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">実績時間</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">予定との差</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">タスク数</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projectStats.map(ps => (
                  <tr key={ps.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{ps.name}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{formatMinutes(ps.act, settings.standardDailyMin)}</td>
                    <td className={`px-6 py-4 text-right font-medium ${ps.diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {ps.diff > 0 ? '+' : ''}{formatMinutes(ps.diff, settings.standardDailyMin)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">{ps.taskCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskStats.map(ts => (
              <div key={ts.taskName} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between transition hover:shadow-md">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 truncate pr-2">{ts.taskName}</h4>
                    {ts.isSmallSample && (
                      <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100 font-bold whitespace-nowrap">サンプル不足</span>
                    )}
                  </div>
                  <div className="text-3xl font-black text-blue-600 mb-1">
                    {formatMinutes(ts.medianMin, settings.standardDailyMin).split(' ')[0]}
                  </div>
                  <div className="text-xs text-gray-400">実績中央値（予測）</div>
                </div>
                <div className="mt-6 flex justify-between items-center pt-4 border-t text-xs">
                  <span className="text-gray-500">サンプル数: <b className="text-gray-800">{ts.count}</b> 件</span>
                  <button className="text-blue-600 hover:underline">履歴を表示</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StatsPage;
