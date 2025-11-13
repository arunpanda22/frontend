// components/FilterBar.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import type { Range } from "react-date-range";
import { AdvancedDatePicker } from "@/components/dashboard/ui/date-picker/advanced-date-picker";

interface FilterBarProps {
  className?: string;
  title?: string;
  subtitle?: string;
  dateRange?: Range;
  onDateRangeChange?: (dateRange: Range) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  className = "",
  title = "",
  subtitle = "",
  dateRange: externalDateRange,
  onDateRangeChange,
}) => {
  // Determine if date selector should be visible
  const showDateSelector = externalDateRange !== undefined && onDateRangeChange !== undefined;

  // Internal date range state if not controlled externally
  const [internalDateRange, setInternalDateRange] = useState<Range>({
    startDate: undefined,
    endDate: undefined,
    key: "selection",
  });

  // Use external date range if provided, otherwise internal
  const dateRange = externalDateRange || internalDateRange;
  const setDateRange = onDateRangeChange || setInternalDateRange;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const PICKER_WIDTH = 820;
  const PICKER_HEIGHT = 540;
  const MARGIN = 16;

  const updatePickerPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = buttonRect.bottom + scrollY + 8;
      let left = buttonRect.right + scrollX - PICKER_WIDTH;

      if (left + PICKER_WIDTH > viewportWidth + scrollX - MARGIN) {
        left = viewportWidth + scrollX - PICKER_WIDTH - MARGIN;
      }
      if (left < scrollX + MARGIN) {
        left = scrollX + MARGIN;
      }

      const spaceBelow = viewportHeight - (buttonRect.bottom + 8);
      const spaceAbove = buttonRect.top - 8;
      if (spaceBelow < PICKER_HEIGHT && spaceAbove > spaceBelow) {
        top = buttonRect.top + scrollY - PICKER_HEIGHT - 8;
      }
      if (top < scrollY + MARGIN) {
        top = scrollY + MARGIN;
      }
      if (top + PICKER_HEIGHT > scrollY + viewportHeight - MARGIN) {
        top = Math.max(scrollY + MARGIN, scrollY + viewportHeight - PICKER_HEIGHT - MARGIN);
      }

      setPickerPosition({ top, left });
    }
  };

  useEffect(() => {
    if (!pickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false);
      }
    };

    const handleScroll = () => updatePickerPosition();
    const handleResize = () => updatePickerPosition();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    updatePickerPosition();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [pickerOpen]);

  const convertToAdvancedDatePickerFormat = (range: Range) => ({
    startDate: range.startDate || null,
    endDate: range.endDate || null,
  });

  const convertFromAdvancedDatePickerFormat = (advancedRange: { startDate: Date | null; endDate: Date | null }) => ({
    startDate: advancedRange.startDate || undefined,
    endDate: advancedRange.endDate || undefined,
    key: "selection" as const,
  });

  const handleDateRangeChange = (
    range: { startDate: Date | null; endDate: Date | null },
  ) => {
    setDateRange(convertFromAdvancedDatePickerFormat(range));
  };

  const handleApply = (range: { startDate: Date | null; endDate: Date | null }) => {
    setDateRange(convertFromAdvancedDatePickerFormat(range));
    setPickerOpen(false);
  };

  const handleClear = () => {
    setDateRange({
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    });
  };

  const togglePicker = () => setPickerOpen((prev) => !prev);

  return (
    <>
      <div
        className={`bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-visible ${className}`}
      >
        {/* Left side - Title Section */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Right side - Only show if date selector enabled */}
        {showDateSelector && (
          <div className="flex items-center relative">
            <span className="text-sm font-medium text-slate-700 mr-3">Date Range:</span>
            <div className="relative">
              <button
                ref={buttonRef}
                className="border border-slate-300 rounded-lg px-4 py-2 text-slate-700 bg-white shadow-sm flex items-center gap-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 min-w-[180px] transition-colors"
                onClick={togglePicker}
                type="button"
              >
                {dateRange.startDate && dateRange.endDate
                  ? `${dateRange.startDate.toLocaleDateString("en-GB")} - ${dateRange.endDate.toLocaleDateString("en-GB")}`
                  : "Select date range"}
                <svg
                  className={`w-4 h-4 ml-1 transition-transform ${pickerOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Date Picker */}
      {pickerOpen && showDateSelector && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-20 z-40" style={{ backdropFilter: "blur(2px)" }} />
          <div
            ref={pickerRef}
            className="fixed z-50"
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
              width: `${PICKER_WIDTH}px`,
              height: `${PICKER_HEIGHT}px`,
              maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
              maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
            }}
          >
            <div className="w-full h-full overflow-auto">
              <AdvancedDatePicker
                onDateChange={handleDateRangeChange}
                onApply={handleApply}
                onClear={handleClear}
                defaultRange={convertToAdvancedDatePickerFormat(dateRange)}
                isOpen={pickerOpen}
                className="border-0 shadow-none p-0 bg-transparent"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FilterBar;
