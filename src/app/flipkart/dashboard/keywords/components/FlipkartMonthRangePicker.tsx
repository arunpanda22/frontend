"use client";

/**
 * Month range picker for the Flipkart Keywords page.
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartMonthRangePicker.tsx
 *
 * Replaces the free date picker (FilterBar) on this page: keyword data is stored as monthly periods and the API only
 * counts whole months, so the user chooses a first and a last month plus a few quick presets. The parent keeps the
 * value as a MonthRange ("YYYY-MM" strings) and converts it with monthRangeToDates() when it calls the API.
 *
 * Keeps the range valid: choosing a "From" later than "To" moves "To" to the same month, and the other way round.
 * Only the last 12 months can be chosen (that is all the history the pull keeps).
 */
import React, { useMemo } from "react";
import {
  buildMonthOptions,
  isSameRange,
  lastMonthsRange,
  type MonthRange,
  type YearMonth,
} from "../utils/keywordDates";

interface FlipkartMonthRangePickerProps {
  value: MonthRange;
  onChange: (range: MonthRange) => void;
}

const PRESETS: { label: string; months: number }[] = [
  { label: "Last 3 months", months: 3 },
  { label: "Last 6 months", months: 6 },
  { label: "Last 12 months", months: 12 },
];

const selectClass =
  "border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white shadow-sm " +
  "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 cursor-pointer";

export default function FlipkartMonthRangePicker({ value, onChange }: FlipkartMonthRangePickerProps) {
  const options = useMemo(() => buildMonthOptions(), []);

  const handleFromChange = (from: YearMonth) => {
    onChange({ from, to: from > value.to ? from : value.to });
  };

  const handleToChange = (to: YearMonth) => {
    onChange({ from: to < value.from ? to : value.from, to });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="keyword-month-from">
          From
        </label>
        <select
          id="keyword-month-from"
          className={selectClass}
          value={value.from}
          onChange={(event) => handleFromChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="text-sm font-medium text-slate-700" htmlFor="keyword-month-to">
          To
        </label>
        <select
          id="keyword-month-to"
          className={selectClass}
          value={value.to}
          onChange={(event) => handleToChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        {PRESETS.map((preset) => {
          const presetRange = lastMonthsRange(preset.months);
          const isActive = isSameRange(value, presetRange);
          return (
            <button
              key={preset.months}
              type="button"
              onClick={() => onChange(presetRange)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}