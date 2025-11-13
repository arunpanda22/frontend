// contexts/DateRangeContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DateRange, DateRangeContextType, DateRangePreset } from '../api/types';
import { getDateRangeFromPreset } from '../utils/dateUtils'; 

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

interface DateRangeProviderProps {
  children: React.ReactNode;
  defaultPreset?: DateRangePreset;
}

export const DateRangeProvider: React.FC<DateRangeProviderProps> = ({ 
  children, 
  defaultPreset = 'this month' 
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const initialRange = getDateRangeFromPreset(defaultPreset);
    return {
      ...initialRange,
      preset: defaultPreset
    };
  });

  const updatePreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      // Don't update dates for custom preset, just change the preset
      setDateRange(prev => ({ ...prev, preset }));
    } else {
      const newRange = getDateRangeFromPreset(preset);
      setDateRange({
        ...newRange,
        preset
      });
    }
  };

  const updateCustomDates = (startDate: string, endDate: string) => {
    setDateRange({
      startDate,
      endDate,
      preset: 'custom'
    });
  };

  const contextValue: DateRangeContextType = {
    dateRange,
    setDateRange,
    updatePreset,
    updateCustomDates
  };

    return (
        <DateRangeContext.Provider value={contextValue}>
        {children}
        </DateRangeContext.Provider>
  );
};

export const useDateRange = (): DateRangeContextType => {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};