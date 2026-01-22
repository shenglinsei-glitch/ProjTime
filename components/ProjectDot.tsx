import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ProjectDotProps {
  id: string;
  name: string;
  status: 'normal' | 'tense' | 'overdue';
  isGray?: boolean;
}

const ProjectDot: React.FC<ProjectDotProps> = ({ id, name, status, isGray = false }) => {
  const navigate = useNavigate();
  
  const colors = {
    normal: 'bg-[#2AC69E]',
    tense: 'bg-orange-500',
    overdue: 'bg-[#F7893F]'
  };

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); navigate(`/project/${id}`); }}
      className="flex items-center gap-1.5 p-1 hover:bg-gray-100 rounded cursor-pointer transition-colors max-w-full"
      title={name}
    >
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isGray ? 'bg-gray-300' : colors[status]}`}></div>
      <span className="text-[10px] font-medium text-gray-700 truncate">{name}</span>
    </div>
  );
};

export default ProjectDot;