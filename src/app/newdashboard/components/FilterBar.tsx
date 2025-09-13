// components/FilterBar.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Filter } from 'lucide-react';
import type { Range } from 'react-date-range';
import { AdvancedDatePicker } from '@/components/ui/date-picker/advanced-date-picker';

interface FilterBarProps {
  className?: string;
  // Date range props - keeping original Range type for compatibility
  dateRange?: Range;
  onDateRangeChange?: (dateRange: Range) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  className = '',
  dateRange: externalDateRange,
  onDateRangeChange
}) => {
  // Internal date range state if not controlled externally
  const [internalDateRange, setInternalDateRange] = useState<Range>({
    startDate: undefined,
    endDate: undefined,
    key: 'selection',
  });

  // Use external date range if provided, otherwise use internal
  const dateRange = externalDateRange || internalDateRange;
  const setDateRange = onDateRangeChange || setInternalDateRange;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Constants for picker dimensions
  const PICKER_WIDTH = 820;
  const PICKER_HEIGHT = 540;
  const MARGIN = 16;

  // Calculate and update picker position with smart positioning
  const updatePickerPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      let top = buttonRect.bottom + scrollY + 8;
      let left = buttonRect.right + scrollX - PICKER_WIDTH;

      // Ensure picker doesn't go off the right edge of the screen
      if (left + PICKER_WIDTH > viewportWidth + scrollX - MARGIN) {
        left = viewportWidth + scrollX - PICKER_WIDTH - MARGIN;
      }

      // Ensure picker doesn't go off the left edge of the screen
      if (left < scrollX + MARGIN) {
        left = scrollX + MARGIN;
      }

      // Check if picker would go below the viewport
      const spaceBelow = viewportHeight - (buttonRect.bottom + 8);
      const spaceAbove = buttonRect.top - 8;

      // If there's not enough space below and more space above, show above
      if (spaceBelow < PICKER_HEIGHT && spaceAbove > spaceBelow) {
        top = buttonRect.top + scrollY - PICKER_HEIGHT - 8;
      }

      // Ensure picker doesn't go above the document
      if (top < scrollY + MARGIN) {
        top = scrollY + MARGIN;
      }

      // Final check: if picker would still go below viewport, adjust to fit
      if (top + PICKER_HEIGHT > scrollY + viewportHeight - MARGIN) {
        top = Math.max(scrollY + MARGIN, scrollY + viewportHeight - PICKER_HEIGHT - MARGIN);
      }
      
      setPickerPosition({ top, left });
    }
  };

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    
    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updatePickerPosition();
      
      // Update position on scroll
      const handleScroll = () => updatePickerPosition();
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [pickerOpen]);

  // Update position on window resize
  useEffect(() => {
    if (pickerOpen) {
      const handleResize = () => updatePickerPosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [pickerOpen]);

  // Convert Range format to AdvancedDatePicker format
  const convertToAdvancedDatePickerFormat = (range: Range) => {
    return {
      startDate: range.startDate || null,
      endDate: range.endDate || null,
    };
  };

  // Convert AdvancedDatePicker format back to Range format
  const convertFromAdvancedDatePickerFormat = (advancedRange: { startDate: Date | null; endDate: Date | null }) => {
    return {
      startDate: advancedRange.startDate || undefined,
      endDate: advancedRange.endDate || undefined,
      key: 'selection' as const,
    };
  };

  // Handle date range changes from AdvancedDatePicker
  const handleDateRangeChange = (range: { startDate: Date | null; endDate: Date | null }, formattedRange: { start: string; end: string }) => {
    const convertedRange = convertFromAdvancedDatePickerFormat(range);
    setDateRange(convertedRange);
  };

  // Handle apply button from AdvancedDatePicker
  const handleApply = (range: { startDate: Date | null; endDate: Date | null }, formattedRange: { start: string; end: string }) => {
    const convertedRange = convertFromAdvancedDatePickerFormat(range);
    setDateRange(convertedRange);
    setPickerOpen(false); // Close the picker when applied
  };

  // Handle clear selection
  const handleClear = () => {
    setDateRange({
      startDate: undefined,
      endDate: undefined,
      key: 'selection',
    });
  };

  const togglePicker = () => {
    setPickerOpen(prev => !prev);
  };

  return (
    <>
      <div className={`bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-visible ${className}`}>
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center">
            {/* Add any other filter controls here */}
          </div>
        </div>
        
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
                ? `${dateRange.startDate.toLocaleDateString('en-GB')} - ${dateRange.endDate.toLocaleDateString('en-GB')}`
                : 'Select date range'}
              <svg 
                className={`w-4 h-4 ml-1 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} 
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
      </div>

      {/* Picker Portal - Fixed positioning with smart placement */}
      {pickerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            style={{ backdropFilter: 'blur(2px)' }}
          />
          
          {/* Picker */}
          <div 
            ref={pickerRef}
            className="fixed z-50"
            style={{ 
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
              width: `${PICKER_WIDTH}px`,
              height: `${PICKER_HEIGHT}px`,
              maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
              maxHeight: `calc(100vh - ${MARGIN * 2}px)`
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