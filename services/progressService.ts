
import { Task, TimeEntry } from '../types';

export interface TaskCalculatedStats {
  estimatedMin: number;
  actualMin: number;
  progressPercent: number;
  isCompleted: boolean;
  childCount: number;
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
    // 叶子任务
    const isCompleted = entries.some(e => e.isCompleted);
    const actualMin = entries.reduce((s, e) => s + e.actualMin, 0);
    return {
      estimatedMin: task?.estimatedMin || 0,
      actualMin,
      progressPercent: isCompleted ? 100 : 0,
      isCompleted,
      childCount: 0
    };
  }

  // 容器任务
  let totalEst = 0;
  let completedEst = 0;
  let totalAct = 0;

  children.forEach(child => {
    const childStats = getTaskCalculatedStats(child.id, allTasks, allEntries);
    totalEst += childStats.estimatedMin;
    totalAct += childStats.actualMin;
    if (childStats.isCompleted) {
      completedEst += childStats.estimatedMin;
    } else {
      // 部分完成的任务按比例加权（可选，这里采用严格的已完成子项预计值合计）
      completedEst += (childStats.estimatedMin * (childStats.progressPercent / 100));
    }
  });

  const progressPercent = totalEst > 0 ? Math.round((completedEst / totalEst) * 100) : 0;
  const isCompleted = progressPercent === 100;

  return {
    estimatedMin: totalEst,
    actualMin: totalAct,
    progressPercent,
    isCompleted,
    childCount: children.length
  };
};
