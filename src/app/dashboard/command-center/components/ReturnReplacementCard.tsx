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
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Lowlights
          </h6>
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex flex-col gap-4">
          {/* Loading skeletons */}
          <div className="rounded-lg bg-gray-50 p-4 flex flex-col animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 flex flex-col animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Lowlights
          </h6>
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
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
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          Lowlights
        </h6>
      </div>
      
      <div className="p-4 md:p-6 flex-1 flex flex-col gap-4">
        {/* Return Rate Card */}
        <div className="rounded-lg bg-gray-50 p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
              <RotateCcw className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                Return Rate
              </p>
              <h4 className="text-2xl font-bold text-gray-900">
                {currentMetrics ? formatPercentage(currentMetrics.return_rate) : '0.0%'}
              </h4>
            </div>
          </div>
          <div className="mt-auto">
            {/* <div className="flex items-center gap-1 text-sm">
              <span className={`font-medium ${
                returnRateChange <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {previousMetrics ? formatChange(returnRateChange) : 'N/A'}
              </span>
              <span className="text-gray-500">vs last period</span>
            </div> */}
            <p className="text-xs text-gray-400 mt-1">
              {currentMetrics ? `${formatNumber(currentMetrics.total_returns)} returns` : '0 returns'}
            </p>
          </div>
        </div>

        {/* Replacement Rate Card */}
        <div className="rounded-lg bg-gray-50 p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                Replacement Rate
              </p>
              <h4 className="text-2xl font-bold text-gray-900">
                {currentMetrics ? formatPercentage(currentMetrics.replacement_rate) : '0.0%'}
              </h4>
            </div>
          </div>
          <div className="mt-auto">
            {/* <div className="flex items-center gap-1 text-sm">
              <span className={`font-medium ${
                replacementRateChange <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {previousMetrics ? formatChange(replacementRateChange) : 'N/A'}
              </span>
              <span className="text-gray-500">vs last period</span>
            </div> */}
            <p className="text-xs text-gray-400 mt-1">
              {currentMetrics ? `${formatNumber(currentMetrics.total_replacements)} replacements` : '0 replacements'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnReplacementCards;