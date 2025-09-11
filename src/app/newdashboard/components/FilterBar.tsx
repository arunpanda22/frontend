// components/FilterBar.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { DateRangePicker } from 'react-date-range';
import type { Range, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { subDays, startOfMonth, startOfYear } from 'date-fns';

interface FilterBarProps {
  // selectedCategory: string;
  // setSelectedCategory: (category: string) => void;
  // categories: string[];
  className?: string;
  // Date range props
  dateRange?: Range;
  onDateRangeChange?: (dateRange: Range) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  // selectedCategory, 
  // setSelectedCategory, 
  // categories,
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
  const [quick, setQuick] = useState<'lastWeek' | 'lastMonth' | 'lastYear' | 'custom' | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    
    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerOpen]);

  const handleQuickSelect = (quickType: 'lastWeek' | 'lastMonth' | 'lastYear') => {
    setQuick(quickType);
    let newDateRange: Range;
    
    switch (quickType) {
      case 'lastWeek':
        newDateRange = {
          startDate: subDays(new Date(), 7),
          endDate: new Date(),
          key: 'selection',
        };
        break;
      case 'lastMonth':
        newDateRange = {
          startDate: startOfMonth(subDays(new Date(), 30)),
          endDate: new Date(),
          key: 'selection',
        };
        break;
      case 'lastYear':
        newDateRange = {
          startDate: startOfYear(subDays(new Date(), 365)),
          endDate: new Date(),
          key: 'selection',
        };
        break;
      default:
        return;
    }
    
    setDateRange(newDateRange);
  };

  const handleDateRangeChange = (item: RangeKeyDict) => {
    setDateRange(item.selection);
    setQuick('custom');
  };

  const clearDateRange = () => {
    setDateRange({
      startDate: undefined,
      endDate: undefined,
      key: 'selection',
    });
    setQuick(null);
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
      <div className="flex items-center flex-wrap gap-4">
        <div className="flex items-center">
          {/* <Filter className="h-5 w-5 text-gray-500 mr-2" /> */}
          {/* <span className="text-sm font-medium text-gray-700 mr-3">Category:</span> */}
          {/* <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-gray-300 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
          >
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select> */}
        </div>
      </div>
      
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700 mr-3">Date Range:</span>
        <div className="relative" ref={pickerRef}>
          <button
            className="border border-slate-300 rounded px-4 py-2 text-slate-700 bg-white shadow-sm flex items-center gap-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[180px]"
            onClick={() => setPickerOpen((open) => !open)}
            type="button"
          >
            {dateRange.startDate && dateRange.endDate
              ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
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
          
          {pickerOpen && (
            <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 flex flex-row p-4" style={{ minWidth: 320 }}>
              {/* Quick selects */}
              <div className="flex flex-col pr-4 gap-2">
                <button 
                  className={`text-left px-3 py-2 rounded text-sm ${quick === 'lastWeek' ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`} 
                  onClick={() => handleQuickSelect('lastWeek')}
                  type="button"
                >
                  Last Week
                </button>
                <button 
                  className={`text-left px-3 py-2 rounded text-sm ${quick === 'lastMonth' ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`} 
                  onClick={() => handleQuickSelect('lastMonth')}
                  type="button"
                >
                  Last Month
                </button>
                <button 
                  className={`text-left px-3 py-2 rounded text-sm ${quick === 'lastYear' ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`} 
                  onClick={() => handleQuickSelect('lastYear')}
                  type="button"
                >
                  Last Year
                </button>
                <button 
                  className={`text-left px-3 py-2 rounded text-sm ${quick === 'custom' ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`} 
                  onClick={() => setQuick('custom')}
                  type="button"
                >
                  Custom
                </button>
                
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <button 
                    className="text-left px-3 py-2 rounded text-sm text-red-600 hover:bg-red-50"
                    onClick={clearDateRange}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
                
                <button 
                  className="mt-4 bg-slate-900 text-white px-3 py-2 rounded font-semibold hover:bg-slate-800 transition text-sm" 
                  onClick={() => setPickerOpen(false)}
                  type="button"
                >
                  Apply
                </button>
              </div>
              
              {/* Calendar */}
              <div className="pl-4 border-l border-slate-200">
                <DateRangePicker
                  onChange={handleDateRangeChange}
                  moveRangeOnFirstSelection={false}
                  ranges={[dateRange]}
                  months={1}
                  direction="horizontal"
                  rangeColors={["#2563eb"]}
                  editableDateInputs={true}
                  maxDate={new Date()}
                  staticRanges={[]}
                  inputRanges={[]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;