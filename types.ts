
export type ProjectStatus = '未開始' | '進行中' | '作業完了' | '計上済み';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  area?: number;
  constructionMethods?: string[]; // IDs of MethodTag
  tags?: string[];
  projectStartDate?: string;
  staff?: string;
  amount?: number;
  status?: ProjectStatus;
}

export interface MethodTag {
  id: string;
  name: string;
  multiplier?: number;
}

export interface TaskFolder {
  id: string;
  name: string;
  order: number;
}

export interface TaskType {
  id: string;
  name: string;
  folderId?: string;
  order: number;
  isDisabled: boolean;
}

export interface Part {
  id: string;
  name: string;
  difficultyMultiplier: number;
  order: number;
  isDisabled: boolean;
}

export interface TaskTimer {
  isRunning: boolean;
  startedAt?: number;
  accumulatedMs: number;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  taskTypeId?: string;
  partId?: string;
  labels: string[];
  estimatedMin: number;
  isManualEstimate: boolean;
  parentTaskId?: string;
  startDate?: string;
  deadline?: string;
  isFreeTask?: boolean;
  // Timer State
  timer?: TaskTimer;
  // Manual Actual Time Override
  manualActualMin?: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  date: string;
  actualMin: number;
  note?: string;
  isExcludedFromStats?: boolean;
  isCompleted?: boolean;
  // Timer metadata
  startAt?: number;
  endAt?: number;
}

export enum CalendarOverrideType {
  HOLIDAY = 'HOLIDAY',
  HALF_DAY = 'HALF_DAY',
  OVERTIME = 'OVERTIME',
  WORKDAY_ADJUST = 'WORKDAY_ADJUST'
}

export interface CalendarOverride {
  id: string;
  date: string;
  availableMin: number;
  type: CalendarOverrideType;
  note?: string;
}

export interface HolidayCache {
  dates: string[];
  lastUpdated: number;
  source: string;
  years: number[];
}

export interface CalendarSettings {
  id?: string;
  standardDailyMin: number;
  workDays: number[];
  useJapanHolidays: boolean;
  holidayCache?: HolidayCache;
}

export interface TaskStats {
  taskName: string;
  taskTypeId?: string;
  count: number;
  medianMin: number;
  isSmallSample: boolean;
}
