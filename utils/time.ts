
export const formatMinutes = (totalMin: number, dailyStandardMin: number = 480): string => {
  const isNegative = totalMin < 0;
  const absMin = Math.abs(totalMin);
  
  const hours = Math.floor(absMin / 60);
  const minutes = absMin % 60;
  const days = (absMin / dailyStandardMin).toFixed(1);

  let result = `${isNegative ? '-' : ''}${hours}時間 ${minutes}分`;
  if (absMin > 0) {
    result += ` (≈${isNegative ? '-' : ''}${days}日)`;
  }
  return result;
};

export const parseDuration = (d: number, h: number, m: number): number => {
  return (d * 8 * 60) + (h * 60) + m;
};

export const getRelativeDays = (dateStr: string): number => {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDateShort = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
};
