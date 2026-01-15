
import React from 'react';
import { ProjectCalculatedStats } from '../utils/project';
import { useNavigate } from 'react-router-dom';

interface GanttBarProps {
  project: any;
  stats: ProjectCalculatedStats;
  timelineStart: number;
  timelineEnd: number;
}

const GanttBar: React.FC<GanttBarProps> = ({ project, stats, timelineStart, timelineEnd }) => {
  const navigate = useNavigate();
  const totalDuration = timelineEnd - timelineStart;
  
  const start = new Date(project.startDate || project.createdAt).getTime();
  const end = new Date(stats.expectedCompletionDate).getTime();
  
  const left = Math.max(0, ((start - timelineStart) / totalDuration) * 100);
  const width = Math.min(100 - left, ((end - start) / totalDuration) * 100);
  
  let deadlineMarker = null;
  if (project.deadline) {
    const dTime = new Date(project.deadline).getTime();
    if (dTime >= timelineStart && dTime <= timelineEnd) {
      const dLeft = ((dTime - timelineStart) / totalDuration) * 100;
      deadlineMarker = (
        <div 
          className="absolute top-0 bottom-0 w-px bg-red-400 z-10 opacity-50 pointer-events-none"
          style={{ left: `${dLeft}%` }}
        >
          <div className="text-[8px] bg-red-400 text-white px-1 -ml-2 rounded-sm transform -rotate-90 origin-bottom-left">Deadline</div>
        </div>
      );
    }
  }

  return (
    <div className="relative h-12 flex items-center border-b group">
      <div className="w-48 px-4 shrink-0 truncate text-xs font-bold text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/project/${project.id}`)}>
        {project.name}
      </div>
      <div className="flex-1 h-full relative bg-gray-50/30">
        {deadlineMarker}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-md overflow-hidden shadow-sm transition-all bg-gray-200 border border-gray-300`}
          style={{ left: `${left}%`, width: `${Math.max(2, width)}%` }}
          title={`${project.name}: ${stats.progressPercent}%`}
        >
          <div 
            className="h-full bg-blue-400"
            style={{ width: `${stats.progressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GanttBar;
