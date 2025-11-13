import { DateRange, DateRangePreset } from "../api/types";

export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDateRangeFromPreset = (preset: DateRangePreset): Omit<DateRange, 'preset'> => {
  const endDate = new Date();
  const startDate = new Date();

  switch (preset) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'this month':
      startDate.setDate(1);
      break;
    case 'custom':
      // For custom, return last 30 days as default
      startDate.setDate(endDate.getDate() - 30);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return {
    startDate: formatDateToISO(startDate),
    endDate: formatDateToISO(endDate)
  };
};

export const getPreviousPeriodRange = (startDate: string, endDate: string): { startDate: string; endDate: string } => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff + 1);
  
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