
import { TimeEntry, TaskStats, Task } from '../types';

export const calculateTaskMedians = (
  allTasks: Task[],
  allEntries: TimeEntry[]
): TaskStats[] => {
  const groupedEntries: Record<string, { name: string, times: number[] }> = {};
  
  // Aggregate actual times by taskTypeId (standardized) or name (legacy)
  allEntries.forEach(entry => {
    if (entry.isExcludedFromStats) return;
    const task = allTasks.find(t => t.id === entry.taskId);
    // 自由タスク（isFreeTask）は統計から除外する
    if (!task || task.isFreeTask) return;
    
    // Preference taskTypeId for stability
    const key = task.taskTypeId || task.name;
    if (!groupedEntries[key]) groupedEntries[key] = { name: task.name, times: [] };
    groupedEntries[key].times.push(entry.actualMin);
  });

  return Object.entries(groupedEntries).map(([key, data]) => {
    data.times.sort((a, b) => a - b);
    const mid = Math.floor(data.times.length / 2);
    const median = data.times.length % 2 !== 0 ? data.times[mid] : (data.times[mid - 1] + data.times[mid]) / 2;
    
    return {
      taskName: data.name,
      taskTypeId: key.length > 20 ? key : undefined, // Heuristic to detect UUIDs
      count: data.times.length,
      medianMin: median,
      isSmallSample: data.times.length < 3
    };
  });
};
