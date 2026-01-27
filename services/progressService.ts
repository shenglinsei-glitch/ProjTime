
import { Task, TimeEntry } from '../types';

export interface TaskCalculatedStats {
  estimatedMin: number;
  actualMin: number;
  progressPercent: number;
  isCompleted: boolean;
  childCount: number;
  // Amount by which actual minutes exceed estimated minutes
  overrunMin: number;
}

export const getTaskCalculatedStats = (
  taskId: string,
  allTasks: Task[],
  allEntries: TimeEntry[]
): TaskCalculatedStats => {
  const task = allTasks.find(t => t.id === taskId);
  const children = allTasks.filter(t => t.parentTaskId === taskId);
  const entries = allEntries.filter(e => e.taskId === taskId);

  if (children.length === 0) {
    // Leaf Task
    // Current task is completed if any time entry for it is marked as completed
    const isCompleted = entries.some(e => e.isCompleted);
    
    // Priority: Manual Input > Sum of Entries
    const autoActualMin = entries.reduce((s, e) => s + e.actualMin, 0);
    const actualMin = task?.manualActualMin !== undefined ? task.manualActualMin : autoActualMin;
    const estimatedMin = task?.estimatedMin || 0;
    
    const overrunMin = Math.max(0, actualMin - estimatedMin);

    let progressPercent = 0;
    if (isCompleted) {
      progressPercent = 100;
    } else if (estimatedMin > 0) {
      // Progress based on time ratio, capped at 99% if not marked as completed
      const rawProgress = Math.round((actualMin / estimatedMin) * 100);
      progressPercent = Math.min(99, Math.max(0, rawProgress));
    }

    return {
      estimatedMin,
      actualMin,
      progressPercent,
      isCompleted,
      childCount: 0,
      overrunMin
    };
  }

  // Container Task (Folder/Phase)
  let totalEst = 0;
  let totalAct = 0;
  let totalCompletedWeight = 0;

  children.forEach(child => {
    const childStats = getTaskCalculatedStats(child.id, allTasks, allEntries);
    totalEst += childStats.estimatedMin;
    totalAct += childStats.actualMin;
    // Weighted progress aggregation
    totalCompletedWeight += (childStats.estimatedMin * (childStats.progressPercent / 100));
  });

  const progressPercent = totalEst > 0 ? Math.round((totalCompletedWeight / totalEst) * 100) : 0;
  const isCompleted = progressPercent === 100;
  const overrunMin = Math.max(0, totalAct - totalEst);

  return {
    estimatedMin: totalEst,
    actualMin: totalAct,
    progressPercent,
    isCompleted,
    childCount: children.length,
    overrunMin
  };
};
