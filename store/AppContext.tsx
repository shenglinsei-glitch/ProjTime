
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Task, TimeEntry, CalendarSettings, CalendarOverride, MethodTag, TaskType, Part, HolidayCache, TaskFolder } from '../types';
import { dbStore } from './db';
import { fetchJapanHolidays } from '../services/calendarService';

interface ExportData {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  settings: CalendarSettings[];
  overrides: CalendarOverride[];
  methodTags: MethodTag[];
  taskTypes: TaskType[];
  parts: Part[];
  taskFolders: TaskFolder[];
}

interface AppContextType {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  settings: CalendarSettings;
  overrides: CalendarOverride[];
  methodTags: MethodTag[];
  taskTypes: TaskType[];
  parts: Part[];
  taskFolders: TaskFolder[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addProject: (p: Project) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (t: Task) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addTimeEntry: (e: TimeEntry) => Promise<void>;
  updateTimeEntry: (e: TimeEntry) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;
  saveSettings: (s: CalendarSettings) => Promise<void>;
  addOverride: (o: CalendarOverride) => Promise<void>;
  deleteOverride: (id: string) => Promise<void>;
  addMethodTag: (tag: MethodTag) => Promise<void>;
  updateMethodTag: (tag: MethodTag) => Promise<void>;
  deleteMethodTag: (id: string) => Promise<void>;
  addTaskType: (item: TaskType) => Promise<void>;
  updateTaskType: (item: TaskType) => Promise<void>;
  deleteTaskType: (id: string) => Promise<void>;
  addPart: (item: Part) => Promise<void>;
  updatePart: (item: Part) => Promise<void>;
  deletePart: (id: string) => Promise<void>;
  addTaskFolder: (item: TaskFolder) => Promise<void>;
  updateTaskFolder: (item: TaskFolder) => Promise<void>;
  deleteTaskFolder: (id: string) => Promise<void>;
  exportAllData: () => Promise<ExportData>;
  importAllData: (data: ExportData) => Promise<void>;
  refreshHolidays: (force?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [methodTags, setMethodTags] = useState<MethodTag[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [taskFolders, setTaskFolders] = useState<TaskFolder[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>({
    standardDailyMin: 480,
    workDays: [1, 2, 3, 4, 5],
    useJapanHolidays: true,
    holidayCache: { dates: [], lastUpdated: 0, source: 'holidays-jp', years: [] }
  });
  const [overrides, setOverrides] = useState<CalendarOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const [p, t, e, s, ov, mt, tt, pt, tf] = await Promise.all([
      dbStore.getAll<Project>('projects'),
      dbStore.getAll<Task>('tasks'),
      dbStore.getAll<TimeEntry>('timeEntries'),
      dbStore.getAll<CalendarSettings>('settings'),
      dbStore.getAll<CalendarOverride>('overrides'),
      dbStore.getAll<MethodTag>('methodTags'),
      dbStore.getAll<TaskType>('taskTypes'),
      dbStore.getAll<Part>('parts'),
      dbStore.getAll<TaskFolder>('taskFolders')
    ]);
    setProjects(p);
    setTasks(t);
    setTimeEntries(e);
    if (s.length > 0) setSettings(s[0]);
    setOverrides(ov);
    setMethodTags(mt);
    setTaskTypes(tt.sort((a,b) => a.order - b.order));
    setParts(pt.sort((a,b) => a.order - b.order));
    setTaskFolders(tf.sort((a, b) => a.order - b.order));
    setIsLoading(false);
  }, []);

  const refreshHolidays = useCallback(async (force: boolean = false) => {
    if (!force && !settings.useJapanHolidays) return;
    const dates = await fetchJapanHolidays();
    if (dates.length > 0) {
      const yearsSet = new Set<number>();
      dates.forEach(d => {
        const year = parseInt(d.split('-')[0]);
        if (!isNaN(year)) yearsSet.add(year);
      });
      const years = Array.from(yearsSet).sort((a, b) => a - b);
      setSettings(prev => {
        const newSettings = {
          ...prev,
          holidayCache: { dates, lastUpdated: Date.now(), source: 'holidays-jp', years }
        };
        dbStore.put('settings', { ...newSettings, id: 'global' });
        return newSettings;
      });
    }
  }, [settings.useJapanHolidays]);

  const checkHolidayRefreshNeeded = useCallback((s: CalendarSettings) => {
    if (!s.useJapanHolidays) return false;
    const cache = s.holidayCache;
    if (!cache || cache.dates.length === 0 || !cache.years) return true;
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    if (!cache.years.includes(currentYear) || !cache.years.includes(nextYear)) return true;
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - cache.lastUpdated > ONE_WEEK) return true;
    return false;
  }, []);

  useEffect(() => {
    dbStore.init().then(async () => {
      await refreshData();
      const data = await dbStore.getAll<CalendarSettings>('settings');
      const latestSettings = data.length > 0 ? data[0] : settings;
      if (checkHolidayRefreshNeeded(latestSettings)) refreshHolidays();
    });
  }, [refreshData, refreshHolidays, checkHolidayRefreshNeeded]);

  const addProject = async (p: Project) => { await dbStore.put('projects', p); await refreshData(); };
  const updateProject = async (p: Project) => { await dbStore.put('projects', p); await refreshData(); };
  const deleteProject = async (id: string) => { 
    await dbStore.delete('projects', id);
    const projectTasks = tasks.filter(t => t.projectId === id);
    for (const t of projectTasks) {
      await dbStore.delete('tasks', t.id);
      const entries = timeEntries.filter(e => e.taskId === t.id);
      for (const e of entries) await dbStore.delete('timeEntries', e.id);
    }
    await refreshData();
  };

  const addTask = async (t: Task) => { await dbStore.put('tasks', t); await refreshData(); };
  const updateTask = async (t: Task) => { await dbStore.put('tasks', t); await refreshData(); };
  const deleteTask = async (id: string) => { 
    await dbStore.delete('tasks', id);
    const entries = timeEntries.filter(e => e.taskId === id);
    for (const e of entries) await dbStore.delete('timeEntries', e.id);
    await refreshData();
  };

  const addTimeEntry = async (e: TimeEntry) => { await dbStore.put('timeEntries', e); await refreshData(); };
  const updateTimeEntry = async (e: TimeEntry) => { await dbStore.put('timeEntries', e); await refreshData(); };
  const deleteTimeEntry = async (id: string) => { await dbStore.delete('timeEntries', id); await refreshData(); };
  const saveSettings = async (s: CalendarSettings) => { await dbStore.put('settings', { ...s, id: 'global' }); await refreshData(); };
  const addOverride = async (o: CalendarOverride) => { await dbStore.put('overrides', o); await refreshData(); };
  const deleteOverride = async (id: string) => { await dbStore.delete('overrides', id); await refreshData(); };
  const addMethodTag = async (tag: MethodTag) => { await dbStore.put('methodTags', tag); await refreshData(); };
  const updateMethodTag = async (tag: MethodTag) => { await dbStore.put('methodTags', tag); await refreshData(); };
  const deleteMethodTag = async (id: string) => { await dbStore.delete('methodTags', id); await refreshData(); };

  const addTaskType = async (item: TaskType) => { await dbStore.put('taskTypes', item); await refreshData(); };
  const updateTaskType = async (item: TaskType) => { await dbStore.put('taskTypes', item); await refreshData(); };
  const deleteTaskType = async (id: string) => { await dbStore.delete('taskTypes', id); await refreshData(); };

  const addPart = async (item: Part) => { await dbStore.put('parts', item); await refreshData(); };
  const updatePart = async (item: Part) => { await dbStore.put('parts', item); await refreshData(); };
  const deletePart = async (id: string) => { await dbStore.delete('parts', id); await refreshData(); };

  const addTaskFolder = async (item: TaskFolder) => { await dbStore.put('taskFolders', item); await refreshData(); };
  const updateTaskFolder = async (item: TaskFolder) => { await dbStore.put('taskFolders', item); await refreshData(); };
  const deleteTaskFolder = async (id: string) => { await dbStore.delete('taskFolders', id); await refreshData(); };

  const exportAllData = async (): Promise<ExportData> => {
    const [p, t, e, s, ov, mt, tt, pt, tf] = await Promise.all([
      dbStore.getAll<Project>('projects'),
      dbStore.getAll<Task>('tasks'),
      dbStore.getAll<TimeEntry>('timeEntries'),
      dbStore.getAll<CalendarSettings>('settings'),
      dbStore.getAll<CalendarOverride>('overrides'),
      dbStore.getAll<MethodTag>('methodTags'),
      dbStore.getAll<TaskType>('taskTypes'),
      dbStore.getAll<Part>('parts'),
      dbStore.getAll<TaskFolder>('taskFolders')
    ]);
    return { projects: p, tasks: t, timeEntries: e, settings: s, overrides: ov, methodTags: mt, taskTypes: tt, parts: pt, taskFolders: tf };
  };

  const importAllData = async (data: ExportData) => {
    await dbStore.clearAllStores();
    const promises: Promise<void>[] = [];
    Object.keys(data).forEach(key => {
      const items = (data as any)[key];
      if (Array.isArray(items)) items.forEach(item => promises.push(dbStore.put(key, item)));
    });
    await Promise.all(promises);
    await refreshData();
    const importedSettings = (data.settings && data.settings.length > 0) ? data.settings[0] : null;
    if (importedSettings && checkHolidayRefreshNeeded(importedSettings)) refreshHolidays();
  };

  return (
    <AppContext.Provider value={{
      projects, tasks, timeEntries, settings, overrides, methodTags, taskTypes, parts, taskFolders, isLoading,
      refreshData, addProject, updateProject, deleteProject,
      addTask, updateTask, deleteTask, addTimeEntry, updateTimeEntry, deleteTimeEntry,
      saveSettings, addOverride, deleteOverride, addMethodTag, updateMethodTag, deleteMethodTag,
      addTaskType, updateTaskType, deleteTaskType, addPart, updatePart, deletePart,
      addTaskFolder, updateTaskFolder, deleteTaskFolder,
      exportAllData, importAllData, refreshHolidays
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
