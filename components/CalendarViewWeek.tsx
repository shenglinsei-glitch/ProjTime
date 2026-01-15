
import React from 'react';
import { ProjectCalculatedStats } from '../utils/project';
import ProjectDot from './ProjectDot';

interface CalendarViewWeekProps {
  projectsWithStats: { project: any, stats: ProjectCalculatedStats }[];
}

const CalendarViewWeek: React.FC<CalendarViewWeekProps> = ({ projectsWithStats }) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const getDayProjects = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return projectsWithStats.filter(p => p.stats.expectedCompletionDate === dateStr);
  };

  const overdueCount = projectsWithStats.filter(p => p.stats.status === 'overdue').length;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex-1">
          <div className="text-[10px] font-bold text-blue-400 uppercase">今週のプロジェクト数</div>
          <div className="text-2xl font-black text-blue-600">{projectsWithStats.length}</div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold text-red-400 uppercase">期限切れ/リスク</div>
          <div className="text-2xl font-black text-red-600">{overdueCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 h-[400px]">
        {weekDays.map(date => {
          const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
          const projects = getDayProjects(date);
          
          return (
            <div key={date.toISOString()} className={`flex flex-col border rounded-xl overflow-hidden bg-white shadow-sm ${isToday ? 'ring-2 ring-blue-400' : ''}`}>
              <div className={`p-2 text-center border-b text-xs font-bold ${isToday ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                {date.toLocaleDateString('ja-JP', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar">
                {projects.map(p => (
                  <ProjectDot key={p.project.id} id={p.project.id} name={p.project.name} status={p.stats.status} />
                ))}
                {projects.length === 0 && <div className="h-full flex items-center justify-center opacity-10"><div className="w-1 h-1 bg-gray-400 rounded-full"></div></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarViewWeek;
