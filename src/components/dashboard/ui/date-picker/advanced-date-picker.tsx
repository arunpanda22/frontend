"use client";

/**
 * AdvancedDatePicker — the application's shared date-range picker
 * (Quick Select sidebar + dual-month calendar + Cancel/Apply).
 *
 * USED BY
 *   - FilterBar.tsx           (legacy "popover" mode: uncontrolled, `defaultRange` + onApply)
 *   - PivotDateRangeModal.tsx (CONTROLLED "embedded" mode: `value` + `onChange`, no own buttons)
 *
 * MODES
 *   Legacy/uncontrolled  `defaultRange` seeds the committed range. Edits live in a draft until
 *                        Apply. Re-syncs when `defaultRange` changes BY VALUE.
 *   Controlled           pass `value`. The parent owns the range; every selection change calls
 *                        `onChange(range, formatted)`. Partial selections are reported too:
 *                        {startDate: Date, endDate: null} after the first click, so the parent
 *                        can tell "incomplete" from "complete". Re-syncs when `value` changes BY
 *                        VALUE (never by object identity — callers build new objects every render).
 *
 * RULES (unchanged from the legacy picker)
 *   - Latest selectable date = 2 days before today. Dates older than 1 year are disabled.
 *   - Display format DD/MM/YYYY. All dates are normalised to local midnight.
 *
 * FIXES vs the legacy version (do not reintroduce)
 *   - Default selection really is "Last 30 days" (legacy used index 6 = "Last month").
 *   - All presets are anchored on the same "latest selectable" date.
 *   - Time-of-day stripped everywhere (range highlight / one-year boundary were off by a day).
 *   - Month navigation uses first-of-month dates (setMonth overflow skipped February).
 *   - Calendar opens on the selection's month, not always today's.
 *   - No preset is highlighted when there is no selection.
 *   - A click with start-but-no-end is no longer ignored.
 *   - `className` is applied ONLY in embedded variant (popover keeps its fixed look, as before).
 *   - Body scroll lock only runs when `isOpen` is actually provided.
 *   - Cancel now also calls `onCancel` (FilterBar may use it to close the popover).
 *
 * NOTE: Clear Selection keeps its legacy behaviour: it clears the draft AND the committed range
 * and calls `onClear` immediately (FilterBar relies on that).
 */
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface FormattedRange {
  start: string;
  end: string;
}

interface PresetRange {
  label: string;
  getValue: () => DateRange;
}

interface AdvancedDatePickerProps {
  // ---- legacy props (FilterBar) ----
  onDateChange?: (range: DateRange, formattedRange: FormattedRange) => void;
  onApply?: (range: DateRange, formattedRange: FormattedRange) => void;
  onClear?: () => void;
  /** Applied only when variant === "embedded". */
  className?: string;
  defaultRange?: DateRange;
  isOpen?: boolean;
  // ---- new props ----
  /** Controlled value. When provided, `defaultRange` is ignored. */
  value?: DateRange;
  /** Controlled mode: fired on every selection change (partial and complete). */
  onChange?: (range: DateRange, formattedRange: FormattedRange) => void;
  /** Fired when Cancel is clicked (after the draft is reset). */
  onCancel?: () => void;
  /** "popover" (default): bordered card with shadow. "embedded": no shadow, fills its parent. */
  variant?: "popover" | "embedded";
  /** Show the Quick Select sidebar (default true). */
  showPresets?: boolean;
  /** Show Cancel/Apply (default true). Embedded users with their own footer pass false. */
  showActions?: boolean;
}

// ---------------------------------------------------------------------------
// Date helpers (all dates local midnight)
// ---------------------------------------------------------------------------
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const r = startOfDay(d);
  r.setDate(r.getDate() + n);
  return r;
};
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Latest selectable date: two days before today. */
const getLatestSelectable = () => addDays(new Date(), -2);
/** Earliest selectable date: one year ago. */
const getEarliestSelectable = () => {
  const d = startOfDay(new Date());
  d.setFullYear(d.getFullYear() - 1);
  return d;
};

const dayKey = (d: Date | null) => (d ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` : "");
const rangeKey = (r: DateRange) => `${dayKey(r.startDate)}|${dayKey(r.endDate)}`;
const normalizeRange = (r?: DateRange | null): DateRange => ({
  startDate: r?.startDate ? startOfDay(r.startDate) : null,
  endDate: r?.endDate ? startOfDay(r.endDate) : null,
});

/** DD/MM/YYYY */
const formatDate = (date: Date | null): string =>
  date ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

const PRESET_RANGES: PresetRange[] = [
  {
    label: "Last 7 days",
    getValue: () => {
      const end = getLatestSelectable();
      return { startDate: addDays(end, -6), endDate: end };
    },
  },
  {
    label: "This week",
    getValue: () => {
      const end = getLatestSelectable();
      return { startDate: addDays(end, -end.getDay()), endDate: end }; // weeks start on Sunday
    },
  },
  {
    label: "Last week",
    getValue: () => {
      const end = getLatestSelectable();
      const lastWeekEnd = addDays(end, -end.getDay() - 1); // previous Saturday
      return { startDate: addDays(lastWeekEnd, -6), endDate: lastWeekEnd };
    },
  },
  {
    label: "Last 14 days",
    getValue: () => {
      const end = getLatestSelectable();
      return { startDate: addDays(end, -13), endDate: end };
    },
  },
  {
    label: "Last 30 days",
    getValue: () => {
      const end = getLatestSelectable();
      return { startDate: addDays(end, -29), endDate: end };
    },
  },
  {
    label: "This month",
    getValue: () => {
      const end = getLatestSelectable();
      return { startDate: new Date(end.getFullYear(), end.getMonth(), 1), endDate: end };
    },
  },
  {
    label: "Last month",
    getValue: () => {
      const end = getLatestSelectable();
      return {
        startDate: new Date(end.getFullYear(), end.getMonth() - 1, 1),
        endDate: new Date(end.getFullYear(), end.getMonth(), 0),
      };
    },
  },
  {
    label: "Last 90 days",
    getValue: () => {
      const end = getLatestSelectable();
      return { startDate: addDays(end, -89), endDate: end };
    },
  },
];

const DEFAULT_PRESET = PRESET_RANGES.find((p) => p.label === "Last 30 days") as PresetRange;

/** Label of the preset equal to `range`, or "" (custom / empty). */
function matchPreset(range: DateRange): string {
  if (!range.startDate || !range.endDate) return "";
  const key = rangeKey(range);
  return PRESET_RANGES.find((p) => rangeKey(p.getValue()) === key)?.label ?? "";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** 42 midnight dates covering the month grid (Sunday-first). */
function generateCalendarDays(monthDate: Date): Date[] {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay() + i));
  }
  return days;
}

export function AdvancedDatePicker({
  onDateChange,
  onApply,
  onClear,
  className = "",
  defaultRange,
  isOpen,
  value,
  onChange,
  onCancel,
  variant = "popover",
  showPresets = true,
  showActions = true,
}: AdvancedDatePickerProps) {
  const controlled = value !== undefined;
  const initial = normalizeRange(value ?? defaultRange ?? DEFAULT_PRESET.getValue());

  const [selectedRange, setSelectedRange] = useState<DateRange>(initial); // committed (uncontrolled mode)
  const [tempRange, setTempRange] = useState<DateRange>(initial); // what the calendar shows
  const [currentMonth, setCurrentMonth] = useState<Date>(() => monthStart(initial.startDate ?? new Date()));
  const [isSelectingEnd, setIsSelectingEnd] = useState(!!initial.startDate && !initial.endDate);
  const [activePreset, setActivePreset] = useState<string>(matchPreset(initial));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // ---- External sync, BY VALUE ----------------------------------------------------------
  const externalKey = controlled ? rangeKey(normalizeRange(value)) : null;
  useEffect(() => {
    if (!controlled) return;
    const ext = normalizeRange(value);
    setTempRange(ext);
    setIsSelectingEnd(!!ext.startDate && !ext.endDate);
    setActivePreset(matchPreset(ext));
    // The visible month is deliberately NOT moved here: clicking a date in the right-hand month
    // must not make the calendar jump. It is set on mount and on preset clicks only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalKey]);

  const defaultKey = !controlled && defaultRange ? rangeKey(normalizeRange(defaultRange)) : null;
  useEffect(() => {
    if (controlled || defaultKey === null) return;
    const next = normalizeRange(defaultRange);
    setSelectedRange(next);
    setTempRange(next);
    setIsSelectingEnd(false);
    setActivePreset(matchPreset(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultKey]);

  // Body scroll lock — only when the parent actually drives `isOpen` (FilterBar does).
  useEffect(() => {
    if (isOpen === undefined) return;
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const committedRange = controlled ? normalizeRange(value) : selectedRange;

  function emitChange(range: DateRange) {
    onChange?.(range, { start: formatDate(range.startDate), end: formatDate(range.endDate) });
  }

  // ---- Constraints ---------------------------------------------------------------------
  const latest = getLatestSelectable();
  const earliest = getEarliestSelectable();
  const isDisabledDate = (date: Date) => date > latest || date < earliest;

  // ---- Handlers ------------------------------------------------------------------------
  function handleDateClick(date: Date) {
    if (isDisabledDate(date)) return;

    if (isSelectingEnd && tempRange.startDate) {
      const start = tempRange.startDate;
      const next: DateRange = date >= start ? { startDate: start, endDate: date } : { startDate: date, endDate: start };
      setTempRange(next);
      setIsSelectingEnd(false);
      setActivePreset(matchPreset(next));
      emitChange(next);
    } else {
      const next: DateRange = { startDate: date, endDate: null };
      setTempRange(next);
      setIsSelectingEnd(true);
      setActivePreset("");
      emitChange(next);
    }
  }

  function handlePresetClick(preset: PresetRange) {
    const range = normalizeRange(preset.getValue());
    setTempRange(range);
    setActivePreset(preset.label);
    setIsSelectingEnd(false);
    if (range.startDate) setCurrentMonth(monthStart(range.startDate));
    emitChange(range);
  }

  function handleApply() {
    if (!tempRange.startDate || !tempRange.endDate) return;
    setSelectedRange(tempRange);
    const formatted = { start: formatDate(tempRange.startDate), end: formatDate(tempRange.endDate) };
    onApply?.(tempRange, formatted);
    onDateChange?.(tempRange, formatted);
  }

  function handleCancel() {
    setTempRange(committedRange);
    setIsSelectingEnd(false);
    setActivePreset(matchPreset(committedRange));
    onCancel?.();
  }

  function handleClear() {
    const empty: DateRange = { startDate: null, endDate: null };
    setTempRange(empty);
    setSelectedRange(empty);
    setActivePreset("");
    setIsSelectingEnd(false);
    onClear?.();
  }

  function navigateMonth(direction: "prev" | "next") {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + (direction === "prev" ? -1 : 1), 1));
  }

  // ---- Range highlighting (includes hover preview while choosing the end date) -----------
  function isInRange(date: Date) {
    if (!tempRange.startDate) return false;
    let end = tempRange.endDate;
    if (isSelectingEnd && hoverDate && !tempRange.endDate) {
      end = hoverDate >= tempRange.startDate ? hoverDate : tempRange.startDate;
    }
    if (!end) return false;
    const rangeStart = tempRange.startDate <= end ? tempRange.startDate : end;
    const rangeEnd = tempRange.startDate <= end ? end : tempRange.startDate;
    return date >= rangeStart && date <= rangeEnd;
  }
  const isRangeStart = (date: Date) => !!tempRange.startDate && date.getTime() === tempRange.startDate.getTime();
  const isRangeEnd = (date: Date) => !!tempRange.endDate && date.getTime() === tempRange.endDate.getTime();

  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  const renderCalendar = (monthDate: Date) => {
    const days = generateCalendarDays(monthDate);
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-700">
            {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const inMonth = date.getMonth() === monthDate.getMonth();
            const isDisabled = isDisabledDate(date);
            const inRange = isInRange(date);
            const rangeStart = isRangeStart(date);
            const rangeEnd = isRangeEnd(date);
            const isLatestAvailable = date.getTime() === latest.getTime();

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => isSelectingEnd && !isDisabled && setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
                disabled={isDisabled}
                className={`
                h-10 w-10 text-sm rounded-lg transition-all duration-200 relative
                ${!inMonth ? "text-gray-400" : "text-gray-700"}
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

  const rootClass =
    variant === "embedded"
      ? `bg-white border border-powder-blue-200 rounded-xl overflow-hidden w-full ${className}`
      : "bg-white border border-powder-blue-200 rounded-xl shadow-xl overflow-hidden max-w-4xl w-full";

  return (
    <div className={rootClass}>
      <div className="flex">
        {/* Preset Ranges Sidebar */}
        {showPresets && (
          <div className="w-56 shrink-0 border-r border-powder-blue-200 bg-powder-blue-50 p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Quick Select</h3>
            </div>
            <div className="space-y-1">
              {PRESET_RANGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
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

              <button
                type="button"
                onClick={handleClear}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-200 text-red-600 hover:bg-red-50 border-t border-powder-blue-200 mt-4 pt-4"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Calendar Section */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
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
              type="button"
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-powder-blue-50 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {renderCalendar(currentMonth)}
            {renderCalendar(nextMonth)}
          </div>

          {showActions && (
            <div className="flex justify-end gap-3 pt-4 border-t border-powder-blue-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-powder-blue-300 rounded-lg hover:bg-powder-blue-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!tempRange.startDate || !tempRange.endDate}
                className="px-4 py-2 text-sm font-medium text-white bg-powder-blue-600 rounded-lg hover:bg-powder-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}