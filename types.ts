
export interface Project {
  id: string;
  name: string;
  deadline?: string;
  createdAt: number;
  area?: number;
  constructionMethods?: string[];
  tags?: string[];
  startDate?: string;
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
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  date: string;
  actualMin: number;
  note?: string;
  isExcludedFromStats?: boolean;
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
  source: string; // "holidays-jp" 等
  years: number[]; // キャッシュされている年度のリスト
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
