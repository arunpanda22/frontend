import React from 'react';
import { RotateCcw, RefreshCw } from 'lucide-react';
import { useReturnReplacementRates } from '@/lib/hooks/queries/use-dashboard';
import { useDateRange } from '@/lib/context/DateRangeContext';

const ReturnReplacementCards = () => {
  const { dateRange } = useDateRange();
  
  // Fetch current period data
  const {
    data: currentData,
    isLoading,
    error,
    isError
  } = useReturnReplacementRates({
    start_date: dateRange.startDate || '',
    end_date: dateRange.endDate || ''
  }, !!(dateRange.startDate && dateRange.endDate));

  // Calculate previous period dates for comparison
  const getPreviousPeriodDates = () => {
    if (!dateRange.startDate || !dateRange.endDate) return null;
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const periodLength = end.getTime() - start.getTime();
    
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodLength);
    
    return {
      start_date: prevStart.toISOString().split('T')[0],
      end_date: prevEnd.toISOString().split('T')[0]
    };
  };

  const previousPeriodDates = getPreviousPeriodDates();
  
  // Fetch previous period data for comparison
  const {
    data: previousData
  } = useReturnReplacementRates({
    start_date: previousPeriodDates?.start_date || '',
    end_date: previousPeriodDates?.end_date || ''
  }, !!(previousPeriodDates?.start_date && previousPeriodDates?.end_date));

  // Helper functions
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatChange = (change: number, suffix: string = "%") => {
    const absChange = Math.abs(change);
    const sign = change >= 0 ? "↑" : "↓";
    return `${sign} ${absChange.toFixed(1)}${suffix}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-sm transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-base font-semibold text-gray-900">
            Lowlights
          </h6>
        </div>
        
        <div className="p-4 flex-1 grid grid-cols-2 gap-4">
          {/* Loading skeletons */}
          <div className="flex flex-col items-center justify-center p-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-200 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-200 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-sm transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-base font-semibold text-gray-900">
            Lowlights
          </h6>
        </div>
        
        <div className="p-4 flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm">Unable to load return/replacement data</p>
            <p className="text-xs mt-1">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate changes from previous period
  const currentMetrics = currentData?.metrics;
  const previousMetrics = previousData?.metrics;
  
  const returnRateChange = previousMetrics 
    ? calculateChange(currentMetrics?.return_rate || 0, previousMetrics.return_rate || 0)
    : 0;
    
  const replacementRateChange = previousMetrics
    ? calculateChange(currentMetrics?.replacement_rate || 0, previousMetrics.replacement_rate || 0)
    : 0;

  return (
    <div className="h-full rounded-2xl bg-white shadow-sm transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <h6 className="text-base font-semibold text-gray-900">
          Lowlights
        </h6>
      </div>
      
      <div className="p-4 flex-1 grid grid-cols-2 gap-4">
        {/* Return Rate Card */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
            <RotateCcw className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Return Rate
          </p>
          <h4 className="text-xl font-bold text-gray-900 mb-1">
            {currentMetrics ? formatPercentage(currentMetrics.return_rate) : '0.0%'}
          </h4>
          <p className="text-xs text-gray-400">
            {currentMetrics ? `${formatNumber(currentMetrics.total_returns)} returns` : '0 returns'}
          </p>
        </div>

        {/* Replacement Rate Card */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Replacement Rate
          </p>
          <h4 className="text-xl font-bold text-gray-900 mb-1">
            {currentMetrics ? formatPercentage(currentMetrics.replacement_rate) : '0.0%'}
          </h4>
          <p className="text-xs text-gray-400">
            {currentMetrics ? `${formatNumber(currentMetrics.total_replacements)} replacements` : '0 replacements'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReturnReplacementCards;