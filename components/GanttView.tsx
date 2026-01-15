
import React from 'react';
import { ProjectCalculatedStats } from '../utils/project';
import GanttBar from './GanttBar';

interface GanttViewProps {
  projectsWithStats: { project: any, stats: ProjectCalculatedStats }[];
}

const GanttView: React.FC<GanttViewProps> = ({ projectsWithStats }) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const timelineStart = new Date(today);
  timelineStart.setDate(today.getDate() - 7);
  
  const timelineEnd = new Date(today);
  timelineEnd.setDate(today.getDate() + 30);

  const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
  const ticks = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(timelineStart.getTime() + (totalDuration / 6) * i);
    return d;
  });

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
      <div className="flex border-b bg-gray-50">
        <div className="w-48 px-4 py-2 shrink-0 text-[10px] font-bold text-gray-400 uppercase">プロジェクト</div>
        <div className="flex-1 flex justify-between px-2">
          {ticks.map(tick => (
            <div key={tick.toISOString()} className="text-[10px] font-bold text-gray-400 py-2 border-l pl-2">
              {tick.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto max-h-[500px]">
        {projectsWithStats.map(p => (
          <GanttBar 
            key={p.project.id} 
            project={p.project} 
            stats={p.stats} 
            timelineStart={timelineStart.getTime()} 
            timelineEnd={timelineEnd.getTime()} 
          />
        ))}
        {projectsWithStats.length === 0 && (
          <div className="p-12 text-center text-gray-400 italic">表示するプロジェクトがありません</div>
        )}
      </div>
    </div>
  );
};

export default GanttView;
