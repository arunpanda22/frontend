"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "../../../ui/date-picker-button";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface PresetRange {
  label: string;
  getValue: () => DateRange;
}

interface AdvancedDatePickerProps {
  onDateChange?: (
    range: DateRange,
    formattedRange: { start: string; end: string },
  ) => void;
  onApply?: (
    range: DateRange,
    formattedRange: { start: string; end: string },
  ) => void;
  onClear?: () => void;
  className?: string;
  defaultRange?: DateRange;
  isOpen?: boolean;
}

const PRESET_RANGES: PresetRange[] = [
  {
    label: "Last 7 days",
    getValue: () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() - 2);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: "This week",
    getValue: () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() - 2);
      const start = new Date(end);
      start.setDate(end.getDate() - end.getDay());
      return { startDate: start, endDate: end };
    },
  },
  {
    label: "Last week",
    getValue: () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() - 2);

      // Get to previous week's Saturday
      const lastWeekEnd = new Date(end);
      lastWeekEnd.setDate(end.getDate() - end.getDay() - 1);

      // Get to previous week's Sunday
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);

      return { startDate: lastWeekStart, endDate: lastWeekEnd };
    },
  },
  {
    label: "Last 14 days",
    getValue: () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() - 2);
      const start = new Date(end);
      start.setDate(end.getDate() - 13);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: "Last 30 days",
    getValue: () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() - 2);
      const start = new Date(end);
      start.setDate(end.getDate() - 29);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: "This month",
    getValue: () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() - 2); // 2 days before today
      const start = new Date(end.getFullYear(), end.getMonth(), 1); // 1st of that month
      return { startDate: start, endDate: end };
    },
  },
  {
    label: "Last month",
    getValue: () => {
      const today = new Date();
      const lastMonthStart = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: lastMonthStart, endDate: lastMonthEnd };
    },
  },
  {
    label: "Last 90 days",
    getValue: () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() - 2);
      const start = new Date(end);
      start.setDate(end.getDate() - 89);
      return { startDate: start, endDate: end };
    },
  },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function AdvancedDatePicker({
  onDateChange,
  onApply,
  onClear,
  className,
  defaultRange,
  isOpen,
}: AdvancedDatePickerProps) {
  // Initialize with proper preset detection
  const getInitialPreset = (range?: DateRange) => {
    if (!range?.startDate || !range?.endDate) return "Last 30 days";

    // Check if the range matches any preset
    for (const preset of PRESET_RANGES) {
      const presetRange = preset.getValue();
      if (
        presetRange.startDate?.toDateString() ===
          range.startDate.toDateString() &&
        presetRange.endDate?.toDateString() === range.endDate.toDateString()
      ) {
        return preset.label;
      }
    }
    return ""; // Custom range
  };

  const [selectedRange, setSelectedRange] = useState<DateRange>(
    defaultRange || PRESET_RANGES[6].getValue(), // Default to "Last 30 days"
  );
  const [tempRange, setTempRange] = useState<DateRange>(selectedRange);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(
    getInitialPreset(defaultRange),
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Update temp range when selected range changes (like when component reopens)
  useEffect(() => {
    setTempRange(selectedRange);
    setActivePreset(getInitialPreset(selectedRange));
  }, [selectedRange]);

  // Format date to DD/MM/YYYY
  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  // Check if date is in the future
  const isFutureDate = useCallback((date: Date): boolean => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(23, 59, 59, 999);
    return date > twoDaysAgo;
  }, []);

  // Check if date is more than 1 year ago
  const isTooOld = useCallback((date: Date): boolean => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date < oneYearAgo;
  }, []);

  // Generate calendar days for a month
  const generateCalendarDays = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, []);

  // Handle date selection with improved logic
  const handleDateClick = useCallback(
    (date: Date) => {
      if (isFutureDate(date) || isTooOld(date)) return;

      if (
        !tempRange.startDate ||
        (tempRange.startDate && tempRange.endDate && !isSelectingEnd)
      ) {
        // Start new selection
        setTempRange({ startDate: date, endDate: null });
        setIsSelectingEnd(true);
        setActivePreset("");
      } else if (isSelectingEnd) {
        // Complete selection
        if (date >= tempRange.startDate!) {
          setTempRange({ ...tempRange, endDate: date });
        } else {
          setTempRange({ startDate: date, endDate: tempRange.startDate });
        }
        setIsSelectingEnd(false);
      }
    },
    [tempRange, isSelectingEnd, isFutureDate, isTooOld],
  );

  // Handle preset selection
  const handlePresetClick = useCallback((preset: PresetRange) => {
    const range = preset.getValue();
    setTempRange(range);
    setActivePreset(preset.label);
    setIsSelectingEnd(false);
  }, []);

  // Handle apply button
  const handleApply = useCallback(() => {
    if (tempRange.startDate && tempRange.endDate) {
      setSelectedRange(tempRange);
      const formattedRange = {
        start: formatDate(tempRange.startDate),
        end: formatDate(tempRange.endDate),
      };
      onApply?.(tempRange, formattedRange);
      onDateChange?.(tempRange, formattedRange);
    }
  }, [tempRange, onApply, onDateChange, formatDate]);

  // Handle cancel button
  const handleCancel = useCallback(() => {
    setTempRange(selectedRange);
    setIsSelectingEnd(false);
    setActivePreset(getInitialPreset(selectedRange));
  }, [selectedRange]);

  // Handle clear button
  const handleClear = useCallback(() => {
    const emptyRange = { startDate: null, endDate: null };
    setTempRange(emptyRange);
    setSelectedRange(emptyRange);
    setActivePreset("");
    setIsSelectingEnd(false);
    onClear?.();
  }, [onClear]);

  // Prevent body scroll when picker is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Check if date is in selected range (including hover preview)
  const isInRange = useCallback(
    (date: Date) => {
      if (!tempRange.startDate) return false;

      let endDate = tempRange.endDate;

      // If selecting end date and hovering, use hover date for preview
      if (isSelectingEnd && hoverDate && !tempRange.endDate) {
        endDate =
          hoverDate >= tempRange.startDate ? hoverDate : tempRange.startDate;
      }

      if (!endDate) return false;

      const rangeStart =
        tempRange.startDate <= endDate ? tempRange.startDate : endDate;
      const rangeEnd =
        tempRange.startDate <= endDate ? endDate : tempRange.startDate;

      return date >= rangeStart && date <= rangeEnd;
    },
    [tempRange, hoverDate, isSelectingEnd],
  ); 

  // Check if date is start or end of range
  const isRangeStart = useCallback(
    (date: Date) => {
      return (
        tempRange.startDate &&
        date.toDateString() === tempRange.startDate.toDateString()
      );
    },
    [tempRange.startDate],
  );

  const isRangeEnd = useCallback(
    (date: Date) => {
      return (
        tempRange.endDate &&
        date.toDateString() === tempRange.endDate.toDateString()
      );
    },
    [tempRange.endDate],
  );

  // Navigate months
  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);

  // Get next month for dual view
  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const renderCalendar = (monthDate: Date) => {
    const days = generateCalendarDays(monthDate);
    const isCurrentMonth = (date: Date) =>
      date.getMonth() === monthDate.getMonth();

    // Helper to get max selectable date (2 days before today)
    const getMaxSelectableDate = () => {
      const date = new Date();
      date.setDate(date.getDate() - 2);
      return date.toDateString();
    };

    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-700">
            {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const isCurrentMonthDate = isCurrentMonth(date);
            const isDisabled = isFutureDate(date) || isTooOld(date);
            const inRange = isInRange(date);
            const rangeStart = isRangeStart(date);
            const rangeEnd = isRangeEnd(date);
            const isLatestAvailable =
              date.toDateString() === getMaxSelectableDate(); // Latest data available

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() =>
                  isSelectingEnd && !isDisabled && setHoverDate(date)
                }
                onMouseLeave={() => setHoverDate(null)}
                disabled={isDisabled}
                className={`
                h-10 w-10 text-sm rounded-lg transition-all duration-200 relative
                ${!isCurrentMonthDate ? "text-gray-400" : "text-gray-700"}
                ${isDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-powder-blue-100 cursor-pointer"}
                ${rangeStart || rangeEnd ? "bg-powder-blue-600 text-white font-semibold hover:bg-powder-blue-700" : ""}
                ${inRange && !rangeStart && !rangeEnd ? "bg-powder-blue-100 text-powder-blue-700" : ""}
                ${isLatestAvailable && !rangeStart && !rangeEnd && !inRange ? "bg-powder-blue-50 font-semibold ring-2 ring-powder-blue-400" : ""}
                focus:outline-none focus:ring-2 focus:ring-powder-blue-500 focus:ring-offset-2
              `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-powder-blue-200 rounded-xl shadow-xl overflow-hidden max-w-4xl w-full">
      <div className="flex">
        {/* Preset Ranges Sidebar */}
        <div className="w-56 border-r border-powder-blue-200 bg-powder-blue-50 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Quick Select
            </h3>
          </div>
          <div className="space-y-1">
            {PRESET_RANGES.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={`
                  w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-200
                  ${
                    activePreset === preset.label
                      ? "bg-powder-blue-200 text-powder-blue-800 font-medium border border-powder-blue-300"
                      : "text-gray-600 hover:bg-powder-blue-100"
                  }
                `}
              >
                {preset.label}
              </button>
            ))}

            {/* Clear Selection Button */}
            <button
              onClick={handleClear}
              className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-200 text-red-600 hover:bg-red-50 border-t border-powder-blue-200 mt-4 pt-4"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="flex-1 p-4">
          {/* Header with navigation and selected range */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-powder-blue-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3 px-4 py-2 bg-powder-blue-100 rounded-lg border border-powder-blue-200">
              <Calendar className="h-4 w-4 text-powder-blue-600" />
              <span className="text-sm font-medium text-powder-blue-800">
                {tempRange.startDate && tempRange.endDate
                  ? `${formatDate(tempRange.startDate)} - ${formatDate(tempRange.endDate)}`
                  : tempRange.startDate
                    ? `${formatDate(tempRange.startDate)} - Select end date`
                    : "Select date range"}
              </span>
            </div>

            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-powder-blue-50 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Dual Calendar View */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {renderCalendar(currentMonth)}
            {renderCalendar(nextMonth)}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-powder-blue-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-powder-blue-300 rounded-lg hover:bg-powder-blue-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!tempRange.startDate || !tempRange.endDate}
              className="px-4 py-2 text-sm font-medium text-white bg-powder-blue-600 rounded-lg hover:bg-powder-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
