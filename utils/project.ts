
import { Project, Task, TimeEntry, CalendarSettings, CalendarOverride } from '../types';
import { calculateCompletionDate } from '../services/calendarService';
import { getRelativeDays } from './time';

export interface ProjectCalculatedStats {
  estimatedMin: number;
  actualMin: number;
  remainingMin: number;
  taskCount: number;
  progressPercent: number;
  expectedCompletionDate: string; // YYYY-MM-DD
  status: 'normal' | 'tense' | 'overdue';
  isCompleted: boolean;
}

export const getProjectCalculatedStats = (
  project: Project,
  allTasks: Task[],
  allEntries: TimeEntry[],
  settings: CalendarSettings,
  overrides: CalendarOverride[]
): ProjectCalculatedStats => {
  const projectTasks = allTasks.filter(t => t.projectId === project.id);
  const projectEntries = allEntries.filter(e => e.projectId === project.id);
  
  const rootTasks = projectTasks.filter(t => !t.parentTaskId);
  const estimatedMin = rootTasks.reduce((sum, t) => sum + t.estimatedMin, 0);
  const actualMin = projectEntries.reduce((sum, e) => sum + e.actualMin, 0);
  const remainingMin = Math.max(0, estimatedMin - actualMin);
  const taskCount = projectTasks.length;

  const leafTasks = projectTasks.filter(t => !projectTasks.some(st => st.parentTaskId === t.id));
  const completedTasksIds = new Set(projectEntries.map(e => e.taskId));
  
  const totalLeafEst = leafTasks.reduce((sum, t) => sum + t.estimatedMin, 0);
  const completedLeafEst = leafTasks
    .filter(t => completedTasksIds.has(t.id))
    .reduce((sum, t) => sum + t.estimatedMin, 0);
  
  const progressPercent = totalLeafEst > 0 ? Math.round((completedLeafEst / totalLeafEst) * 100) : 0;
  const isCompleted = progressPercent === 100;

  // Expected completion date logic
  let expectedCompletionDate = '';
  if (isCompleted && projectEntries.length > 0) {
    const dates = projectEntries.map(e => new Date(e.date).getTime());
    expectedCompletionDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
  } else {
    // Format the date returned by service into YYYY-MM-DD if possible
    const dateStr = calculateCompletionDate(remainingMin, settings, overrides);
    if (dateStr === '完了') {
       expectedCompletionDate = new Date().toISOString().split('T')[0];
    } else {
       // Service returns ja-JP locale string. Let's normalize it.
       const [y, m, d] = dateStr.split('/').map(s => s.padStart(2, '0'));
       expectedCompletionDate = `${y}-${m}-${d}`;
    }
  }

  // Calculate project deadline as the latest deadline among root tasks
  // Fix: Derive project deadline from root tasks to avoid property access error on Project type
  const projectDeadline = rootTasks.reduce((max, t) => {
    if (!t.deadline) return max;
    return !max || t.deadline > max ? t.deadline : max;
  }, '');

  // Status logic
  let status: 'normal' | 'tense' | 'overdue' = 'normal';
  if (projectDeadline) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (expectedCompletionDate > projectDeadline || (!isCompleted && todayStr > projectDeadline)) {
      status = 'overdue';
    } else {
      const diff = (new Date(projectDeadline).getTime() - new Date(expectedCompletionDate).getTime()) / (1000 * 60 * 60 * 24);
      if (diff >= 0 && diff < 3) {
        status = 'tense';
      }
    }
  }

  return {
    estimatedMin,
    actualMin,
    remainingMin,
    taskCount,
    progressPercent,
    expectedCompletionDate,
    status,
    isCompleted
  };
};
