
import { CalendarSettings, CalendarOverride, CalendarOverrideType } from '../types';
import { toISODateString } from '../utils/time';

/**
 * 日本の祝日データを外部APIから取得する
 * API: https://holidays-jp.github.io/
 */
export const fetchJapanHolidays = async (): Promise<string[]> => {
  try {
    const response = await fetch('https://holidays-jp.github.io/api/v1/date.json');
    if (!response.ok) throw new Error('祝日データの取得に失敗しました');
    const data = await response.json();
    return Object.keys(data); // "YYYY-MM-DD" 形式のキー配列を返す
  } catch (error) {
    console.error('Holiday fetch error:', error);
    return [];
  }
};

export const isHoliday = (date: Date, settings: CalendarSettings): boolean => {
  if (!settings.useJapanHolidays || !settings.holidayCache) return false;
  const dateStr = toISODateString(date);
  return settings.holidayCache.dates.includes(dateStr);
};

export const getAvailableMinutesForDate = (
  date: Date, 
  settings: CalendarSettings, 
  overrides: CalendarOverride[]
): number => {
  const dateStr = toISODateString(date);
  const override = overrides.find(o => o.date === dateStr);
  
  if (override) return override.availableMin;

  const dayOfWeek = date.getDay();
  const isWeekend = !settings.workDays.includes(dayOfWeek);
  const isPH = isHoliday(date, settings);

  if (isWeekend || isPH) return 0;
  
  return settings.standardDailyMin;
};

export const calculateCompletionDate = (
  remainingMin: number,
  settings: CalendarSettings,
  overrides: CalendarOverride[]
): string => {
  if (remainingMin <= 0) return '完了';
  
  let currentRemaining = remainingMin;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  let safetyCounter = 0;
  while (currentRemaining > 0 && safetyCounter < 1000) {
    const dailyAvailable = getAvailableMinutesForDate(currentDate, settings, overrides);
    if (dailyAvailable > 0) {
      currentRemaining -= dailyAvailable;
    }
    if (currentRemaining > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    safetyCounter++;
  }
  
  return toISODateString(currentDate);
};
