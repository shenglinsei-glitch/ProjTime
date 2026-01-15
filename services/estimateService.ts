
import { TimeEntry, TaskStats } from '../types';

export const calculateTaskMedians = (
  allTasks: { name: string, id: string }[],
  allEntries: TimeEntry[]
): TaskStats[] => {
  const groupedEntries: Record<string, number[]> = {};
  
  // Aggregate actual times by task NAME
  allEntries.forEach(entry => {
    if (entry.isExcludedFromStats) return;
    const task = allTasks.find(t => t.id === entry.taskId);
    if (!task) return;
    
    if (!groupedEntries[task.name]) groupedEntries[task.name] = [];
    groupedEntries[task.name].push(entry.actualMin);
  });

  return Object.entries(groupedEntries).map(([name, times]) => {
    times.sort((a, b) => a - b);
    const mid = Math.floor(times.length / 2);
    const median = times.length % 2 !== 0 ? times[mid] : (times[mid - 1] + times[mid]) / 2;
    
    return {
      taskName: name,
      count: times.length,
      medianMin: median,
      isSmallSample: times.length < 3
    };
  });
};
