"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, ChevronDown } from "lucide-react";

interface PeriodSelectorProps {
  currentStart: Date;
  currentEnd: Date;
  comparisonStart: Date;
  comparisonEnd: Date;
  onPeriodChange: (current: { start: Date; end: Date }, comparison: { start: Date; end: Date }) => void;
  className?: string;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

type SelectionMode = 'current' | 'comparison';

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  currentStart,
  currentEnd,
  comparisonStart,
  comparisonEnd,
  onPeriodChange,
  className = "",
}) => {
  const [tempCurrentStart, setTempCurrentStart] = useState<Date | null>(currentStart);
  const [tempCurrentEnd, setTempCurrentEnd] = useState<Date | null>(currentEnd);
  const [tempCompStart, setTempCompStart] = useState<Date | null>(comparisonStart);
  const [tempCompEnd, setTempCompEnd] = useState<Date | null>(comparisonEnd);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [activeMode, setActiveMode] = useState<SelectionMode>('current');
  const [pickerOpen, setPickerOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempCurrentStart(currentStart);
    setTempCurrentEnd(currentEnd);
    setTempCompStart(comparisonStart);
    setTempCompEnd(comparisonEnd);
  }, [currentStart, currentEnd, comparisonStart, comparisonEnd]);

  useEffect(() => {
    if (!pickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  const currentPeriodDays = tempCurrentStart && tempCurrentEnd 
    ? Math.floor((tempCurrentEnd.getTime() - tempCurrentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  
  const comparisonPeriodDays = tempCompStart && tempCompEnd
    ? Math.floor((tempCompEnd.getTime() - tempCompStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const periodsMatch = currentPeriodDays > 0 && currentPeriodDays === comparisonPeriodDays;

  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  }, []);

  const isFutureDate = useCallback((date: Date): boolean => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(23, 59, 59, 999);
    return date > twoDaysAgo;
  }, []);

  const isTooOld = useCallback((date: Date): boolean => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date < oneYearAgo;
  }, []);

  const generateCalendarDays = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 35; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, []);

  const handleDateClick = useCallback((date: Date, mode: SelectionMode) => {
    if (isFutureDate(date) || isTooOld(date)) return;

    if (mode === 'current') {
      if (!tempCurrentStart || (tempCurrentStart && tempCurrentEnd)) {
        setTempCurrentStart(date);
        setTempCurrentEnd(null);
      } else {
        if (date >= tempCurrentStart) {
          setTempCurrentEnd(date);
        } else {
          setTempCurrentEnd(tempCurrentStart);
          setTempCurrentStart(date);
        }
      }
    } else {
      if (!tempCompStart || (tempCompStart && tempCompEnd)) {
        setTempCompStart(date);
        setTempCompEnd(null);
      } else {
        if (date >= tempCompStart) {
          setTempCompEnd(date);
        } else {
          setTempCompEnd(tempCompStart);
          setTempCompStart(date);
        }
      }
    }
  }, [tempCurrentStart, tempCurrentEnd, tempCompStart, tempCompEnd, isFutureDate, isTooOld]);

  const isInRange = useCallback((date: Date, mode: SelectionMode) => {
    if (mode === 'current') {
      if (!tempCurrentStart) return false;
      let endDate = tempCurrentEnd;
      if (!endDate && hoverDate && activeMode === 'current') {
        endDate = hoverDate >= tempCurrentStart ? hoverDate : tempCurrentStart;
      }
      if (!endDate) return false;
      const rangeStart = tempCurrentStart <= endDate ? tempCurrentStart : endDate;
      const rangeEnd = tempCurrentStart <= endDate ? endDate : tempCurrentStart;
      return date >= rangeStart && date <= rangeEnd;
    } else {
      if (!tempCompStart) return false;
      let endDate = tempCompEnd;
      if (!endDate && hoverDate && activeMode === 'comparison') {
        endDate = hoverDate >= tempCompStart ? hoverDate : tempCompStart;
      }
      if (!endDate) return false;
      const rangeStart = tempCompStart <= endDate ? tempCompStart : endDate;
      const rangeEnd = tempCompStart <= endDate ? endDate : tempCompStart;
      return date >= rangeStart && date <= rangeEnd;
    }
  }, [tempCurrentStart, tempCurrentEnd, tempCompStart, tempCompEnd, hoverDate, activeMode]);

  const isRangeStart = useCallback((date: Date, mode: SelectionMode) => {
    if (mode === 'current') {
      return tempCurrentStart && date.toDateString() === tempCurrentStart.toDateString();
    }
    return tempCompStart && date.toDateString() === tempCompStart.toDateString();
  }, [tempCurrentStart, tempCompStart]);

  const isRangeEnd = useCallback((date: Date, mode: SelectionMode) => {
    if (mode === 'current') {
      return tempCurrentEnd && date.toDateString() === tempCurrentEnd.toDateString();
    }
    return tempCompEnd && date.toDateString() === tempCompEnd.toDateString();
  }, [tempCurrentEnd, tempCompEnd]);

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + (direction === "prev" ? -1 : 1));
      return newMonth;
    });
  }, []);

  const handleApply = useCallback(() => {
    if (tempCurrentStart && tempCurrentEnd && tempCompStart && tempCompEnd && periodsMatch) {
      onPeriodChange(
        { start: tempCurrentStart, end: tempCurrentEnd },
        { start: tempCompStart, end: tempCompEnd }
      );
      setPickerOpen(false);
    }
  }, [tempCurrentStart, tempCurrentEnd, tempCompStart, tempCompEnd, periodsMatch, onPeriodChange]);

  const handleReset = useCallback(() => {
    const today = new Date();
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() - 2);
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultStart.getDate() - 6);
    const defaultCompEnd = new Date(defaultStart);
    defaultCompEnd.setDate(defaultCompEnd.getDate() - 1);
    const defaultCompStart = new Date(defaultCompEnd);
    defaultCompStart.setDate(defaultCompStart.getDate() - 6);
    
    setTempCurrentStart(defaultStart);
    setTempCurrentEnd(defaultEnd);
    setTempCompStart(defaultCompStart);
    setTempCompEnd(defaultCompEnd);
  }, []);

  const renderMiniCalendar = (monthDate: Date, mode: SelectionMode) => {
    const days = generateCalendarDays(monthDate);
    const isCurrentMonth = (date: Date) => date.getMonth() === monthDate.getMonth();

    return (
      <div className="w-64">
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-1 hover:bg-gray-200 rounded"
              type="button"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span className="text-xs font-semibold text-gray-700">
              {MONTHS_SHORT[monthDate.getMonth()]} {monthDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth("next")}
              className="p-1 hover:bg-gray-200 rounded"
              type="button"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="h-3 w-3" />
            <span className="truncate">
              {mode === 'current' && tempCurrentStart && tempCurrentEnd
                ? `${formatDate(tempCurrentStart)} - ${formatDate(tempCurrentEnd)}`
                : mode === 'comparison' && tempCompStart && tempCompEnd
                ? `${formatDate(tempCompStart)} - ${formatDate(tempCompEnd)}`
                : "Select range"}
            </span>
          </div>
        </div>

        <div className="p-2">
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((day, idx) => (
              <div key={`day-${idx}`} className="h-6 flex items-center justify-center text-[10px] font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((date, index) => {
              const isCurrentMonthDate = isCurrentMonth(date);
              const isDisabled = isFutureDate(date) || isTooOld(date);
              const inRange = isInRange(date, mode);
              const rangeStart = isRangeStart(date, mode);
              const rangeEnd = isRangeEnd(date, mode);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date, mode)}
                  onMouseEnter={() => {
                    if (!isDisabled) {
                      setHoverDate(date);
                      setActiveMode(mode);
                    }
                  }}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={isDisabled}
                  type="button"
                  className={`
                    h-6 w-6 text-[10px] rounded transition-all
                    ${!isCurrentMonthDate ? "text-gray-300" : "text-gray-700"}
                    ${isDisabled ? "text-gray-200 cursor-not-allowed" : "hover:bg-powder-blue-100 cursor-pointer"}
                    ${rangeStart || rangeEnd ? "bg-powder-blue-600 text-white font-bold" : ""}
                    ${inRange && !rangeStart && !rangeEnd ? "bg-powder-blue-100 text-powder-blue-700" : ""}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Period Info Card with Dropdown Trigger */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Current Period</h3>
            <p className="text-xs text-slate-600">
              {formatDate(currentStart)} to {formatDate(currentEnd)} ({currentPeriodDays} days)
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-slate-700">Compared To</h3>
            <p className="text-xs text-slate-600">
              {formatDate(comparisonStart)} to {formatDate(comparisonEnd)}
            </p>
          </div>
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="border border-slate-300 rounded-lg px-4 py-2 text-slate-700 bg-white shadow-sm flex items-center gap-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
            type="button"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Customize</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Inline Dropdown */}
      {pickerOpen && (
      <div 
        className="fixed bg-white rounded-lg border border-gray-200 shadow-lg p-4 z-[9999]" 
        style={{ 
          minWidth: '600px',
          right: '1rem',
          bottom: '1rem',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto'
        }}
      >       
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Select Comparison Periods</h3>
            <button
              onClick={handleReset}
              className="text-xs text-powder-blue-700 hover:text-powder-blue-800 flex items-center gap-1"
              type="button"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {periodsMatch && currentPeriodDays > 0 && (
            <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
              ✓ Periods matched ({currentPeriodDays} days each)
            </div>
          )}
          {!periodsMatch && currentPeriodDays > 0 && comparisonPeriodDays > 0 && (
            <div className="mb-3 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
              ⚠ Period lengths must match ({currentPeriodDays} vs {comparisonPeriodDays} days)
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Current Period</div>
              {renderMiniCalendar(currentMonth, 'current')}
            </div>

            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Comparison Period</div>
              {renderMiniCalendar(currentMonth, 'comparison')}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => setPickerOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!periodsMatch || !tempCurrentStart || !tempCurrentEnd || !tempCompStart || !tempCompEnd}
              className="px-4 py-2 text-sm font-medium text-white bg-powder-blue-600 rounded-lg hover:bg-powder-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};