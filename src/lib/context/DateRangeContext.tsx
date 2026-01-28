// contexts/DateRangeContext.tsx
"use client";
import React, { createContext, useContext, useState } from 'react';
import { DateRange, DateRangeContextType, DateRangePreset } from '../api/types';
import { getDateRangeFromPreset, getDefaultPreset, isPresetValid } from '../utils/dateUtils'; 

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

interface DateRangeProviderProps {
  children: React.ReactNode;
  defaultPreset?: DateRangePreset;
}

export const DateRangeProvider: React.FC<DateRangeProviderProps> = ({ 
  children, 
  defaultPreset 
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    // Use provided preset only if it's valid, otherwise get a valid default
    const preset = defaultPreset && isPresetValid(defaultPreset) 
      ? defaultPreset 
      : getDefaultPreset();
    
    const initialRange = getDateRangeFromPreset(preset);
    return {
      ...initialRange,
      preset
    };
  });

  const updatePreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setDateRange(prev => ({ ...prev, preset }));
    } else {
      // Validate preset before applying
      if (!isPresetValid(preset)) {
        console.warn(`Preset "${preset}" is not valid for current date range`);
        return;
      }
      
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