
export const parseISODate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split(/[-/]/).map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const toISODateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatMinutes = (totalMin: number, dailyStandardMin: number = 480): string => {
  const isNegative = totalMin < 0;
  const absMin = Math.abs(totalMin);
  const sign = isNegative ? '-' : '';

  if (!absMin || absMin === 0) return '0m';
  
  if (absMin < 60) {
    return `${sign}${absMin}m`;
  }
  
  if (absMin < dailyStandardMin * 2) {
    const hours = absMin / 60;
    const formatted = parseFloat(hours.toFixed(1));
    return `${sign}${formatted}h`;
  }
  
  const days = absMin / dailyStandardMin;
  const formatted = parseFloat(days.toFixed(1));
  return `${sign}${formatted}d`;
};

/**
 * m < 60 -> "${m}m"
 * m >= 60 -> h = m/60. If integer -> "${h}h", else -> "${round(h*10)/10}h"
 */
export const formatTimerMinutes = (m: number): string => {
  if (m < 60) return `${m}m`;
  const h = m / 60;
  if (m % 60 === 0) return `${h}h`;
  return `${Math.round(h * 10) / 10}h`;
};

export const parseDuration = (d: number, h: number, m: number): number => {
  return (d * 8 * 60) + (h * 60) + m;
};

export const getRelativeDays = (dateStr: string): number => {
  const target = parseISODate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDateShort = (dateStr: string): string => {
  return parseISODate(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
};

export const formatDateTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}`;
};
