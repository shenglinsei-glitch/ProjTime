
import React from 'react';
import { Project, MethodTag, ProjectStatus, CalendarSettings } from '../types';
import { formatMinutes } from '../utils/time';

interface ProjectInfoCardProps {
  originalProject: Project;
  tempProject: Project;
  isEditingProject: boolean;
  isInfoExpanded: boolean;
  setIsInfoExpanded: (val: boolean) => void;
  settings: CalendarSettings;
  methodTags: MethodTag[];
  toggleMethod: (id: string) => void;
  projectStats: { est: number; act: number };
  totalProgress: number;
  projectDeadline: string;
  statusOptions: ProjectStatus[];
  setTempProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const DetailRow = ({ label, value, isEditing, editNode }: any) => {
  const isEmpty = !value || value === '未設定' || value === '--';
  const displayValue = isEmpty ? '未設定' : value;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">{label}</span>
      {isEditing ? <div className="mt-0.5">{editNode}</div> : <span className={`text-[13px] tracking-tight truncate ${isEmpty ? 'text-gray-300 font-normal text-xs' : 'text-gray-800 font-bold'}`}>{displayValue}</span>}
    </div>
  );
};

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({
  originalProject,
  tempProject,
  isEditingProject,
  isInfoExpanded,
  setIsInfoExpanded,
  settings,
  methodTags,
  toggleMethod,
  projectStats,
  totalProgress,
  projectDeadline,
  statusOptions,
  setTempProject
}) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 mb-8 shadow-sm overflow-hidden">
      <div 
        className="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center cursor-pointer hover:bg-gray-50 transition border-b border-gray-50" 
        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">基本情報</h3>
          {!isInfoExpanded && (
            <div className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
              進捗 {totalProgress}% <span className="mx-1 text-blue-200">|</span> {originalProject.status || '進行中'}
            </div>
          )}
        </div>
        <svg className={`w-5 h-5 text-gray-300 transition-transform duration-300 ml-auto sm:ml-0 ${isInfoExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
        </svg>
      </div>
      {isInfoExpanded && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <DetailRow 
              label="ステータス" 
              isEditing={isEditingProject} 
              value={originalProject.status || '進行中'} 
              editNode={
                <select 
                  className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-sm bg-white" 
                  value={tempProject.status || '進行中'} 
                  onChange={e => setTempProject({...tempProject, status: e.target.value as ProjectStatus})}
                >
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              } 
            />
            <DetailRow 
              label="面積" 
              isEditing={isEditingProject} 
              value={originalProject.area ? `${originalProject.area} ㎡` : ''} 
              editNode={
                <input 
                  type="number" 
                  className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-right text-sm" 
                  value={tempProject.area || ''} 
                  onChange={e => setTempProject({...tempProject, area: parseFloat(e.target.value) || 0})}
                />
              } 
            />
            <DetailRow 
              label="開始日" 
              isEditing={isEditingProject} 
              value={originalProject.projectStartDate || ''} 
              editNode={
                <input 
                  type="date" 
                  className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-sm" 
                  value={tempProject.projectStartDate || ''} 
                  onChange={e => setTempProject({...tempProject, projectStartDate: e.target.value})}
                />
              } 
            />
            <DetailRow 
              label="担当者" 
              isEditing={isEditingProject} 
              value={originalProject.staff || ''} 
              editNode={
                <input 
                  type="text" 
                  className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-sm" 
                  value={tempProject.staff || ''} 
                  onChange={e => setTempProject({...tempProject, staff: e.target.value})}
                />
              } 
            />
            <DetailRow 
              label="金額" 
              isEditing={isEditingProject} 
              value={originalProject.amount ? `¥${originalProject.amount.toLocaleString()}` : ''} 
              editNode={
                <input 
                  type="number" 
                  className="w-full border-b outline-none font-bold focus:border-[#53BEE8] py-1 text-right text-sm" 
                  value={tempProject.amount || ''} 
                  onChange={e => setTempProject({...tempProject, amount: parseInt(e.target.value) || 0})}
                />
              } 
            />
            <div className="col-span-1 pt-1">
              <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider block mb-1.5">適用工法</span>
              {isEditingProject ? (
                <div className="flex flex-wrap gap-1.5">
                  {methodTags.map(tag => (
                    <button 
                      key={tag.id} 
                      onClick={() => toggleMethod(tag.id)} 
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition border ${tempProject.constructionMethods?.includes(tag.id) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-400'}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(originalProject.constructionMethods || []).length > 0 ? originalProject.constructionMethods?.map(mid => {
                    const tag = methodTags.find(t => t.id === mid);
                    return tag ? <span key={tag.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">{tag.name}</span> : null;
                  }) : <span className="text-gray-300 text-[11px] italic">設定なし</span>}
                </div>
              )}
            </div>
          </div>
          <div className="pt-5 border-t border-gray-50 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">全体進捗</span>
                <div className="text-[11px] font-bold text-gray-400 leading-none">
                  <span className="text-gray-800 text-sm font-black">{totalProgress}%</span> 
                  <span className="ml-1 text-[9px] uppercase">(Act {formatMinutes(projectStats.act, settings.standardDailyMin)} / Pln {formatMinutes(projectStats.est, settings.standardDailyMin)})</span>
                </div>
              </div>
              <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden border border-gray-50">
                <div className="h-full bg-[#53BEE8] transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
              </div>
            </div>
            <div className="sm:w-32 shrink-0">
               <div className="text-[10px] font-black text-gray-400 uppercase mb-0.5 tracking-widest">最終期限</div>
               <div className={`text-sm font-black truncate ${projectDeadline ? 'text-gray-900' : 'text-gray-300 font-normal'}`}>{projectDeadline || '未設定'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectInfoCard;
