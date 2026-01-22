
import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import CalendarViewWeek from '../components/CalendarViewWeek';
import CalendarViewMonth from '../components/CalendarViewMonth';
import GanttView from '../components/GanttView';
import { getProjectCalculatedStats } from '../utils/project';

const CalendarPage: React.FC = () => {
  const { projects, tasks, timeEntries, settings, overrides, refreshData } = useApp();
  const [view, setView] = useState<'week' | 'month' | 'gantt'>('week');
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue'>('all');

  const projectsWithStats = useMemo(() => {
    return projects.map(project => ({
      project,
      stats: getProjectCalculatedStats(project, tasks, timeEntries, settings, overrides)
    })).filter(p => {
      if (filter === 'active') return !p.stats.isCompleted;
      if (filter === 'overdue') return p.stats.status === 'overdue';
      return true;
    });
  }, [projects, tasks, timeEntries, settings, overrides, filter]);

  return (
    <div className="pb-12">
      <HeaderBar onRefresh={refreshData} />
      <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">日帰り・予定</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setView('week')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === 'week' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
              >
                週
              </button>
              <button 
                onClick={() => setView('month')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === 'month' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
              >
                月
              </button>
              <button 
                onClick={() => setView('gantt')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === 'gantt' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
              >
                甘特
              </button>
            </div>
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs border rounded-lg p-2 outline-blue-600 bg-white shadow-sm font-bold text-gray-600"
          >
            <option value="all">すべてのプロジェクト</option>
            <option value="active">進行中のみ</option>
            <option value="overdue">超期/リスクのみ</option>
          </select>
        </div>

        <div className="transition-all duration-300">
          {view === 'week' && <CalendarViewWeek projectsWithStats={projectsWithStats} />}
          {view === 'month' && <CalendarViewMonth projectsWithStats={projectsWithStats} />}
          {view === 'gantt' && <GanttView projectsWithStats={projectsWithStats} />}
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
