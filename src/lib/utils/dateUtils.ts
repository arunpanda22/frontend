import { DateRange, DateRangePreset } from "../api/types";

export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDateRangeFromPreset = (preset: DateRangePreset): Omit<DateRange, 'preset'> => {
  const today = new Date();
  
  // Always end 2 days before today
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 2);
  
  const startDate = new Date(endDate);

  switch (preset) {
    case '7d':
      startDate.setDate(endDate.getDate() - 6);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 29);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 89);
      break;
    case 'this week':
      // Start from Sunday of the week that endDate is in
      startDate.setDate(endDate.getDate() - endDate.getDay());
      break;
    case 'last week':
      // Previous week: Sunday to Saturday
      const lastWeekEnd = new Date(endDate);
      lastWeekEnd.setDate(endDate.getDate() - endDate.getDay() - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      return {
        startDate: formatDateToISO(lastWeekStart),
        endDate: formatDateToISO(lastWeekEnd)
      };
    case 'this month':
      // First day of the month that endDate is in
      startDate.setDate(1);
      startDate.setMonth(endDate.getMonth());
      startDate.setFullYear(endDate.getFullYear());
      break;
    case 'last month':
      // First day to last day of previous month
      const lastMonthStart = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
      const lastMonthEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      return {
        startDate: formatDateToISO(lastMonthStart),
        endDate: formatDateToISO(lastMonthEnd)
      };
    case 'custom':
      // For custom, return last 30 days as default
      startDate.setDate(endDate.getDate() - 29);
      break;
    default:
      startDate.setDate(endDate.getDate() - 29);
  }

  return {
    startDate: formatDateToISO(startDate),
    endDate: formatDateToISO(endDate)
  };
};

export const isPresetValid = (preset: DateRangePreset): boolean => {
  if (preset === 'custom') return true; // Custom is always valid
  
  const range = getDateRangeFromPreset(preset);
  const startDate = new Date(range.startDate);
  const endDate = new Date(range.endDate);
  
  // A preset is valid if it has at least one day of data
  // (start date is on or before end date)
  return startDate <= endDate;
};

export const getValidPresets = (): DateRangePreset[] => {
  const allPresets: DateRangePreset[] = [
    '7d',
    'this week',
    'last week',
    '30d',
    'this month',
    'last month',
    '90d'
  ];
  
  return allPresets.filter(preset => isPresetValid(preset));
};

export const getDefaultPreset = (): DateRangePreset => {
  // Try presets in order of preference
  const preferredOrder: DateRangePreset[] = [
    'this month',
    'this week',
    '30d',
    '7d',
    'last month',
    'last week',
    '90d'
  ];
  
  for (const preset of preferredOrder) {
    if (isPresetValid(preset)) {
      return preset;
    }
  }
  
  // Fallback to 30d (should always be valid)
  return '30d';
};

export const getPreviousPeriodRange = (startDate: string, endDate: string): { startDate: string; endDate: string } => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff);
  
  return {
    startDate: formatDateToISO(prevStart),
    endDate: formatDateToISO(prevEnd)
  };
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const formatOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
  };
  
  return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
};

// Helper to get the maximum selectable date (2 days before today)
export const getMaxSelectableDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  return date;
};

// Helper to check if a date is within the valid range
export const isDateInValidRange = (date: Date): boolean => {
  const maxDate = getMaxSelectableDate();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  return date <= maxDate && date >= oneYearAgo;
};

// Helper to get preset label for display
export const getPresetLabel = (preset: DateRangePreset): string => {
  const labels: Record<DateRangePreset, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    'this week': 'This week',
    'last week': 'Last week',
    'this month': 'This month',
    'last month': 'Last month',
    'custom': 'Custom'
  };
  
  return labels[preset] || preset;
};