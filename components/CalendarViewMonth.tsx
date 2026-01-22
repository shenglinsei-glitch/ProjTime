
import React, { useState } from 'react';
import { ProjectCalculatedStats } from '../utils/project';
import ProjectDot from './ProjectDot';
import { toISODateString } from '../utils/time';

interface CalendarViewMonthProps {
  projectsWithStats: { project: any, stats: ProjectCalculatedStats }[];
}

const CalendarViewMonth: React.FC<CalendarViewMonthProps> = ({ projectsWithStats }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust to Monday start
  const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonthDays = Array.from({ length: startPadding }).map(() => null);
  const currentMonthDays = Array.from({ length: daysInMonth }).map((_, i) => new Date(year, month, i + 1));
  const days = [...prevMonthDays, ...currentMonthDays];

  const getDayProjects = (date: Date) => {
    const dateStr = toISODateString(date);
    return projectsWithStats.filter(p => p.stats.expectedCompletionDate === dateStr);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-100 rounded">◀</button>
        <h3 className="font-bold text-lg">{year}年 {month + 1}月</h3>
        <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-100 rounded">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 border rounded-xl overflow-hidden shadow-sm">
        {['月', '火', '水', '木', '金', '土', '日'].map(d => (
          <div key={d} className="bg-gray-50 p-2 text-center text-[10px] font-bold text-gray-500 uppercase">{d}</div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="bg-gray-50 h-24"></div>;
          
          const isToday = toISODateString(date) === toISODateString(new Date());
          const projects = getDayProjects(date);

          return (
            <div key={date.toISOString()} className="bg-white h-24 p-1 flex flex-col gap-1 overflow-hidden relative">
              <div className={`text-[10px] font-bold ${isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-400'}`}>
                {date.getDate()}
              </div>
              <div className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar">
                {projects.slice(0, 3).map(p => (
                  <ProjectDot key={p.project.id} id={p.project.id} name={p.project.name} status={p.stats.status} />
                ))}
                {projects.length > 3 && (
                  <div className="text-[8px] text-gray-400 pl-1 font-bold">他 {projects.length - 3} 件...</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarViewMonth;
