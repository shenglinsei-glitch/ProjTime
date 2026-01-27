
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import ProjectInfoCard from '../components/ProjectInfoCard';
import ProjectTaskSection from '../components/ProjectTaskSection';
import ProjectDetailDialogs from '../components/ProjectDetailDialogs';
import { getTaskCalculatedStats } from '../services/progressService';
import { Project, Task, ProjectStatus } from '../types';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    projects, tasks, timeEntries, settings, methodTags, taskTypes, parts, taskFolders,
    addTask, updateTask, deleteTask, deleteProject, updateProject, refreshData,
    startTimer, pauseTimer, stopTimer, deleteTimeEntry, updateTimeEntry
  } = useApp();
  
  const originalProject = projects.find(p => p.id === id);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isEditingTasksMode, setIsEditingTasksMode] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [tempProject, setTempProject] = useState<Project | null>(null);

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTaskForDialog, setEditingTaskForDialog] = useState<{task?: Task, parentId?: string, mode?: 'standard' | 'free'} | null>(null);

  const [showStopTimerConfirm, setShowStopTimerConfirm] = useState<string | null>(null);
  const [activeLogTask, setActiveLogTask] = useState<Task | null>(null);

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (originalProject) setTempProject(JSON.parse(JSON.stringify(originalProject)));
  }, [originalProject, isEditingProject]);

  if (!originalProject || !tempProject) return <div className="p-10 text-center text-gray-500">プロジェクトが見つかりません</div>;

  const projectTasks = tasks.filter(t => t.projectId === id);
  const projectEntries = timeEntries.filter(e => e.projectId === id);
  const topLevelTasks = projectTasks.filter(t => !t.parentTaskId);

  const projectStats = topLevelTasks.reduce((acc, t) => {
    const s = getTaskCalculatedStats(t.id, projectTasks, projectEntries);
    acc.est += s.estimatedMin;
    acc.act += s.actualMin;
    acc.completedEst += (s.estimatedMin * (s.progressPercent / 100));
    return acc;
  }, { est: 0, act: 0, completedEst: 0 });

  const totalProgress = projectStats.est > 0 ? Math.round((projectStats.completedEst / projectStats.est) * 100) : 0;
  const projectDeadline = topLevelTasks.reduce((max, t) => {
    if (!t.deadline) return max;
    return !max || t.deadline > max ? t.deadline : max;
  }, '');

  const toggleMethod = (methodId: string) => {
    const current = tempProject.constructionMethods || [];
    const next = current.includes(methodId) ? current.filter(i => i !== methodId) : [...current, methodId];
    setTempProject({ ...tempProject, constructionMethods: next });
  };

  const statusOptions: ProjectStatus[] = ['未開始', '進行中', '作業完了', '計上済み'];

  return (
    <div className="pb-24">
      <HeaderBar onRefresh={refreshData} />
      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">プロジェクト</div>
            {isEditingProject ? (
              <input 
                className="text-2xl font-black text-gray-900 w-full bg-white border-b-2 border-[#53BEE8] outline-none" 
                value={tempProject.name} 
                onChange={e => setTempProject({ ...tempProject, name: e.target.value })} 
              />
            ) : (
              <h2 className="text-2xl font-black text-gray-900">{originalProject.name}</h2>
            )}
          </div>
          <div className="flex gap-2 relative" ref={menuRef}>
            <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMoreMenu && (
              <div className="absolute top-10 right-0 w-40 bg-white border rounded shadow-lg z-[60] py-1">
                <button 
                  onClick={() => { setIsEditingProject(true); setShowMoreMenu(false); }} 
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b"
                >
                  基本情報を編集
                </button>
                <button 
                  onClick={() => { setShowDeleteConfirm(true); setShowMoreMenu(false); }} 
                  className="w-full text-left px-4 py-2 text-sm text-[#F7893F] hover:bg-[#F7893F]/10 font-bold"
                >
                  プロジェクト削除
                </button>
              </div>
            )}
            {isEditingProject && (
              <button 
                onClick={async () => { await updateProject(tempProject); setIsEditingProject(false); }} 
                className="bg-[#53BEE8] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition"
              >
                保存
              </button>
            )}
          </div>
        </div>

        <ProjectInfoCard 
          originalProject={originalProject}
          tempProject={tempProject}
          isEditingProject={isEditingProject}
          isInfoExpanded={isInfoExpanded}
          setIsInfoExpanded={setIsInfoExpanded}
          settings={settings}
          methodTags={methodTags}
          toggleMethod={toggleMethod}
          projectStats={projectStats}
          totalProgress={totalProgress}
          projectDeadline={projectDeadline}
          statusOptions={statusOptions}
          setTempProject={setTempProject}
        />

        <ProjectTaskSection 
          projectId={originalProject.id}
          projectTasks={projectTasks}
          projectEntries={projectEntries}
          topLevelTasks={topLevelTasks}
          settings={settings}
          isEditingTasksMode={isEditingTasksMode}
          setIsEditingTasksMode={setIsEditingTasksMode}
          onCreateTask={() => {
            setEditingTaskForDialog({});
            setShowTypeSelector(true);
          }}
          onEditTask={(task) => {
            setEditingTaskForDialog({ task });
            setShowTaskDialog(true);
          }}
          onAddSubTask={(parentId) => {
            setEditingTaskForDialog({ parentId });
            setShowTypeSelector(true);
          }}
          startTimer={startTimer}
          pauseTimer={pauseTimer}
          onRequestStopTimer={setShowStopTimerConfirm}
          onOpenLogs={setActiveLogTask}
        />

        <ProjectDetailDialogs 
          originalProject={originalProject}
          settings={settings}
          taskTypes={taskTypes}
          parts={parts}
          methodTags={methodTags}
          tasks={tasks}
          timeEntries={timeEntries}
          taskFolders={taskFolders}
          
          showTypeSelector={showTypeSelector}
          setShowTypeSelector={setShowTypeSelector}
          showTaskDialog={showTaskDialog}
          setShowTaskDialog={setShowTaskDialog}
          editingTaskForDialog={editingTaskForDialog}
          setEditingTaskForDialog={setEditingTaskForDialog}
          showStopTimerConfirm={showStopTimerConfirm}
          setShowStopTimerConfirm={setShowStopTimerConfirm}
          activeLogTask={activeLogTask}
          setActiveLogTask={setActiveLogTask}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          taskToDeleteId={taskToDeleteId}
          setTaskToDeleteId={setTaskToDeleteId}

          addTask={addTask}
          updateTask={updateTask}
          deleteTask={deleteTask}
          updateTimeEntry={updateTimeEntry}
          deleteTimeEntry={deleteTimeEntry}
          stopTimer={stopTimer}
          deleteProject={deleteProject}
          navigate={navigate}
          refreshData={refreshData}
        />
      </main>
    </div>
  );
};

export default ProjectDetailPage;
