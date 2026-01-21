
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  area?: number;
  constructionMethods?: string[]; // IDs of MethodTag
  tags?: string[];
  // 新規フィールド
  projectStartDate?: string;
  staff?: string;
  amount?: number;
}

export interface MethodTag {
  id: string;
  name: string;
  multiplier?: number; // Added for prediction
}

// 新設: 文件夹管理
export interface TaskFolder {
  id: string;
  name: string;
  order: number;
}

// 新設: 任务名称管理
export interface TaskType {
  id: string;
  name: string;
  folderId?: string; // Optional folder association
  order: number;
  isDisabled: boolean;
}

// 新設: 部位管理
export interface Part {
  id: string;
  name: string;
  difficultyMultiplier: number;
  order: number;
  isDisabled: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  name: string; // Keep for display/backward compatibility, but taskTypeId is source of truth
  taskTypeId?: string; // Standardized ID
  partId?: string; // Standardized Part ID
  labels: string[];
  estimatedMin: number;
  isManualEstimate: boolean;
  parentTaskId?: string;
  startDate?: string;
  deadline?: string;
  // method field removed - now inherited from project
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
