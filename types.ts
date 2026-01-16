
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  area?: number;
  constructionMethods?: string[];
  tags?: string[];
  // 新規フィールド
  projectStartDate?: string;
  staff?: string;
  amount?: number;
}

export interface MethodTag {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  labels: string[];
  estimatedMin: number;
  isManualEstimate: boolean;
  parentTaskId?: string;
  // 新增字段
  startDate?: string;
  deadline?: string;
  method?: string; // 预测影响因子
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  date: string;
  actualMin: number;
  note?: string;
  isExcludedFromStats?: boolean;
  isCompleted?: boolean; // 本次录入是否导致任务完成
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
  count: number;
  medianMin: number;
  isSmallSample: boolean;
}
