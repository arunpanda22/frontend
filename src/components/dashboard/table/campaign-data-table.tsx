"use client";

import type React from "react";
import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  memo,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/table/checkbox";
import { Input } from "../ui/table/input";
import {
  Check,
  X,
  Edit3,
  ChevronDown,
  Calendar,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColumnType = "text" | "number" | "date" | "boolean" | "dropdown";

export interface DropdownOption {
  label: string;
  value: string;
}

export interface CampaignColumnDefinition {
  field: string;
  headerName: string;
  type?: ColumnType;
  /** If true this column's cell is merged (rowspan) across all rows sharing the same group */
  span?: boolean;
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  options?: DropdownOption[];
  /** For date columns: column-wide default ISO date string */
  defaultDate?: string;
  bulkSet?: boolean
  /**
   * Custom title shown in the "Set all" popup for this column (number
   * columns only, for now). Falls back to "Set budget for all rows" when
   * omitted, so existing usages of this component that don't pass this
   * keep their current copy unchanged.
   */
  bulkSetLabel?: string
}

export interface CampaignTableData {
  [key: string]: any;
}

interface SortState {
  field: string;
  direction: "asc" | "desc";
}

interface FilterState {
  [field: string]: {
    operator: string;
    value: string;
  };
}

export interface CampaignDataTableProps {
  data: CampaignTableData[];
  columns: CampaignColumnDefinition[];
  /**
   * Fields that together define a group (e.g. ["advertisedAsin", "campaignName"]).
   * Rows sharing the same composite key will be visually merged.
   */
  groupByFields: string[];
  onDataChange: (data: CampaignTableData[]) => void;
  onSelectionChange?: (selected: CampaignTableData[]) => void;
  className?: string;
  showCheckboxColumn?: boolean;
  rowsPerPage?: number;
  showDeleteOption?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupKey(row: CampaignTableData, fields: string[]): string {
  return fields.map((f) => String(row[f] ?? "")).join("__||__");
}

interface RowGroup {
  key: string;
  rows: { originalIndex: number; row: CampaignTableData }[];
}

function buildGroups(
  data: CampaignTableData[],
  groupByFields: string[],
): RowGroup[] {
  const map = new Map<string, RowGroup>();
  data.forEach((row, i) => {
    const k = groupKey(row, groupByFields);
    if (!map.has(k)) map.set(k, { key: k, rows: [] });
    map.get(k)!.rows.push({ originalIndex: i, row });
  });
  return Array.from(map.values());
}

// ─── Filter operators ─────────────────────────────────────────────────────────

const TEXT_OPS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "startsWith", label: "Starts with" },
  { value: "endsWith", label: "Ends with" },
];
const NUMBER_OPS = [
  { value: "equals", label: "=" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
];

function applyRowFilter(
  row: CampaignTableData,
  field: string,
  op: string,
  val: string,
  type: ColumnType = "text",
): boolean {
  const cell = row[field];
  if (val === "" || val === null || val === undefined) return true;
  if (type === "number") {
    const n = Number(cell);
    const v = Number(val);
    if (isNaN(n) || isNaN(v)) return true;
    if (op === "equals") return n === v;
    if (op === "gt") return n > v;
    if (op === "lt") return n < v;
    if (op === "gte") return n >= v;
    if (op === "lte") return n <= v;
  }
  const s = String(cell ?? "").toLowerCase();
  const fv = val.toLowerCase();
  if (op === "contains") return s.includes(fv);
  if (op === "equals") return s === fv;
  if (op === "startsWith") return s.startsWith(fv);
  if (op === "endsWith") return s.endsWith(fv);
  return true;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Dropdown cell
const DropdownCell = memo(function DropdownCell({
  value,
  options,
  editable,
  onChange,
}: {
  value: string;
  options: DropdownOption[];
  editable?: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const label = options.find((o) => o.value === value)?.label ?? value ?? "—";

  const openMenu = () => {
    if (!editable) return;
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPopupStyle({
        position: "fixed",
        top: r.bottom + 2,
        left: r.left,
        minWidth: r.width,
        zIndex: 9999,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        disabled={!editable}
        className={cn(
          "flex items-center justify-between w-full h-7 px-2 rounded text-left text-[13px] text-slate-700 transition-colors group",
          editable && "hover:bg-blue-50/70 cursor-pointer",
          !editable && "cursor-default",
        )}
      >
        <span className="truncate">{label}</span>
        {editable && (
          <ChevronDown className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1 transition-opacity" />
        )}
      </button>
      {open &&
        createPortal(
          <div
            className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden py-1"
            style={popupStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-[13px] hover:bg-blue-50 transition-colors",
                  opt.value === value
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700",
                )}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
});

// Date cell (per-row picker)
const DateCell = memo(function DateCell({
  value,
  editable,
  onChange,
}: {
  value: string;
  editable?: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  const display = value
    ? new Date(value + "T00:00:00").toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const openPicker = () => {
    if (!editable) return;
    setDraft(value ?? "");
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPopupStyle({
        position: "fixed",
        top: r.bottom + 4,
        left: r.left,
        zIndex: 9999,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={openPicker}
        disabled={!editable}
        className={cn(
          "flex items-center gap-1.5 w-full h-7 px-2 rounded text-left text-[13px] text-slate-700 transition-colors group",
          editable && "hover:bg-blue-50/70 cursor-pointer",
          !editable && "cursor-default",
        )}
      >
        <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="truncate">{display}</span>
      </button>
      {open &&
        createPortal(
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 w-56"
            style={popupStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Select Date
            </span>
            <input
              type="date"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-semibold rounded-lg py-2 transition-colors"
              >
                <Check className="h-3 w-3" /> Apply
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 text-[12px] transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
});

// Editable text/number cell
const EditableCell = memo(function EditableCell({
  value,
  column,
  isEditing,
  editValue,
  onStartEdit,
  onSave,
  onCancel,
  onEditValueChange,
}: {
  value: any;
  column: CampaignColumnDefinition;
  isEditing: boolean;
  editValue: any;
  onStartEdit: (v: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditValueChange: (v: any) => void;
}) {
  const display =
    value === 0 || value === "0"
      ? String(value)
      : !value && value !== false
        ? "—"
        : String(value);

  if (isEditing && column.editable) {
    return (
      <div className="flex items-center gap-1 w-full">
        <Input
          type={column.type === "number" ? "number" : "text"}
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          className="h-7 text-[13px] flex-1 focus:ring-2 focus:ring-blue-500 bg-white border-slate-200 rounded"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
        />
        <button
          type="button"
          onClick={onSave}
          className="h-6 w-6 flex items-center justify-center hover:bg-green-100 hover:text-green-700 rounded transition-colors"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-6 w-6 flex items-center justify-center hover:bg-red-100 hover:text-red-700 rounded transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-between group w-full min-h-[1.75rem]",
        column.editable &&
          "cursor-pointer hover:bg-blue-50/70 rounded px-2 py-1 -mx-2 -my-1 transition-colors",
      )}
      onClick={() => column.editable && onStartEdit(value)}
    >
      <span className="truncate text-[13px] text-slate-700">{display}</span>
      {column.editable && (
        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50 ml-2 text-slate-400 flex-shrink-0 transition-opacity" />
      )}
    </div>
  );
});

// Column header with sort + filter dropdown
const ColumnHeader = memo(function ColumnHeader({
  col,
  sort,
  filter,
  onSort,
  onFilter,
  onClearFilter,
  onResizeMouseDown,
  onDateHeaderClick,
  onNumberHeaderClick,
  onDropdownHeaderClick,
}: {
  col: CampaignColumnDefinition;
  sort?: SortState;
  filter?: { operator: string; value: string };
  onSort: () => void;
  onFilter: (op: string, val: string) => void;
  onClearFilter: () => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
  onDateHeaderClick?: (e: React.MouseEvent) => void;
  onNumberHeaderClick?: (e: React.MouseEvent) => void;
  onDropdownHeaderClick?: (e: React.MouseEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filterOp, setFilterOp] = useState(filter?.operator ?? "contains");
  const [filterVal, setFilterVal] = useState(filter?.value ?? "");
  const anchorRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  const isDate = col.type === "date";
  const isNumber = col.type === "number";
  const ops = isNumber ? NUMBER_OPS : TEXT_OPS;
  const hasFilter = !!filter?.value;

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!col.sortable && !col.filterable) return;
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPopupStyle({
        position: "fixed",
        top: r.bottom + 2,
        left: Math.max(0, r.right - 260),
        width: 260,
        zIndex: 9999,
      });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Date header click → bulk set popup; non-date → sort/filter dropdown
  const handleClick = (e: React.MouseEvent) => {
    if (isDate && onDateHeaderClick) {
      e.stopPropagation();
      onDateHeaderClick(e);
      return;
    }
    if (col.type === 'number' && col.bulkSet && onNumberHeaderClick) {
      e.stopPropagation();
      onNumberHeaderClick(e);
      return;
    }
    if (col.type === 'dropdown' && col.bulkSet && onDropdownHeaderClick) {
    e.stopPropagation();
    onDropdownHeaderClick(e);
    return;
  }
    openMenu(e);
  };

  const SortIcon = sort
    ? sort.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <div ref={anchorRef} className="relative group flex items-center h-full">
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 h-full px-3 w-full text-left flex-1 min-w-0"
      >
        {isDate && (
          <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
        )}
        {col.type === 'number' && col.bulkSet && (
          <span className="text-[10px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity ml-auto whitespace-nowrap">
            Set all
          </span>
        )}
        {col.type === 'dropdown' && col.bulkSet && (
          <span className="text-[10px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity ml-auto whitespace-nowrap">
            Set all
          </span>
        )}
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate">
          {col.headerName}
        </span>
        {col.sortable !== false && !isDate && !col.span && (
          <SortIcon
            className={cn(
              "h-3 w-3 flex-shrink-0 transition-opacity",
              sort ? "opacity-100 text-blue-500" : "opacity-0 group-hover:opacity-40 text-slate-400",
            )}
          />
        )}
        {hasFilter && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
        )}
        {isDate && (
          <span className="text-[10px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity ml-auto whitespace-nowrap">
            Set all
          </span>
        )}
      </button>

      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={onResizeMouseDown}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none z-10 flex-shrink-0"
      >
        <div className="h-full w-px mx-auto bg-transparent group-hover:bg-slate-300/80 transition-colors" />
      </div>

      {/* Sort + filter dropdown (non-date, non-spanned) */}
      {open &&
        !isDate &&
        !col.span &&
        createPortal(
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-3"
            style={popupStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {col.sortable !== false && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Sort
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSort();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[13px] text-slate-700 font-medium transition-colors"
                >
                  <SortIcon className="h-3.5 w-3.5 text-slate-500" />
                  {sort
                    ? sort.direction === "asc"
                      ? "Sort Descending"
                      : "Remove Sort"
                    : "Sort Ascending"}
                </button>
              </div>
            )}
            {col.filterable !== false && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Filter
                </span>
                <select
                  value={filterOp}
                  onChange={(e) => setFilterOp(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ops.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={filterVal}
                  onChange={(e) => setFilterVal(e.target.value)}
                  placeholder="Filter value…"
                  className="text-[13px] focus:ring-2 focus:ring-blue-500 border-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onFilter(filterOp, filterVal);
                      setOpen(false);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onFilter(filterOp, filterVal);
                      setOpen(false);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-semibold rounded-lg py-1.5 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterVal("");
                      setFilterOp("contains");
                      onClearFilter();
                      setOpen(false);
                    }}
                    className="px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-[12px] text-slate-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
});

// ─── Bulk date confirm popup ──────────────────────────────────────────────────

function BulkDatePopup({
  style,
  onApply,
  onCancel,
}: {
  style: React.CSSProperties;
  onApply: (date: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState("");
  return createPortal(
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex flex-col gap-3 w-64"
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-slate-700">
          Set date for all rows
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => draft && onApply(draft)}
          disabled={!draft}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-[12px] font-semibold rounded-lg py-2 transition-colors"
        >
          Apply to all rows
        </button>
      </div>
    </div>,
    document.body,
  );
}

function BulkNumberPopup({
  label,
  min,
  style,
  onApply,
  onCancel,
}: {
  label:   string
  min?:    number
  style:   React.CSSProperties
  onApply: (value: number) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState('')
  return createPortal(
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex flex-col gap-3 w-56"
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-slate-700">{label}</span>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && draft && onApply(parseFloat(draft))}
        min={min}
        step="0.01"
        placeholder={min != null ? `Min ${min.toFixed(2)}` : 'Enter value'}
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button
        type="button"
        onClick={() => draft && onApply(parseFloat(draft))}
        disabled={!draft || isNaN(parseFloat(draft))}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-[12px] font-semibold rounded-lg py-2 transition-colors"
      >
        Apply to all rows
      </button>
    </div>,
    document.body,
  )
}

function BulkDropdownPopup({
  label,
  options,
  style,
  onApply,
  onCancel,
}: {
  label:    string
  options:  DropdownOption[]
  style:    React.CSSProperties
  onApply:  (value: string) => void
  onCancel: () => void
}) {
  return createPortal(
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 flex flex-col w-44"
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-2.5 py-2 pb-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="h-3 w-3" />
        </button>
      </div>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="w-full text-left px-3 py-2 text-[13px] hover:bg-blue-50 text-slate-700 rounded-lg transition-colors"
          onClick={() => onApply(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function CampaignDataTable({
  data,
  columns,
  groupByFields,
  onDataChange,
  onSelectionChange,
  className,
  showCheckboxColumn = true,
  rowsPerPage = 10,
  showDeleteOption = true,
}: CampaignDataTableProps) {
  // ── Column widths ──
  const initialWidths = useMemo(
    () =>
      Object.fromEntries(
        columns.map((c) => [c.field, Math.min(c.width ?? 160, c.maxWidth ?? 560)]),
      ) as Record<string, number>,
    [columns],
  );
  const [columnWidths, setColumnWidths] =
    useState<Record<string, number>>(initialWidths);
  const resizingRef = useRef<{
    field: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => setColumnWidths(initialWidths), [initialWidths]);

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, field: string) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = {
        field,
        startX: e.clientX,
        startWidth: columnWidths[field] ?? 120,
      };
      document.body.style.cursor = "col-resize";
      document.body.classList.add("select-none");
    },
    [columnWidths],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const col = columns.find((c) => c.field === r.field);
      const min = col?.minWidth ?? 80;
      const max = col?.maxWidth ?? 560;
      const w = Math.max(min, Math.min(max, r.startWidth + e.clientX - r.startX));
      setColumnWidths((prev) => (prev[r.field] === w ? prev : { ...prev, [r.field]: w }));
    };
    const onUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.classList.remove("select-none");
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [columns]);

  // ── Sort ──
  const [sort, setSort] = useState<SortState | null>(null);

  const handleSort = useCallback((field: string) => {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, direction: "asc" };
      if (prev.direction === "asc") return { field, direction: "desc" };
      return null;
    });
  }, []);

  // ── Filter ──
  const [filters, setFilters] = useState<FilterState>({});

  const handleFilter = useCallback((field: string, op: string, val: string) => {
    setFilters((prev) => ({ ...prev, [field]: { operator: op, value: val } }));
  }, []);

  const clearFilter = useCallback((field: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // ── Build groups from filtered + sorted data ──
  const processedGroups = useMemo(() => {
    // 1. Filter individual rows
    let filtered = data.filter((row) =>
      Object.entries(filters).every(([field, { operator, value }]) => {
        const col = columns.find((c) => c.field === field);
        return applyRowFilter(row, field, operator, value, col?.type ?? "text");
      }),
    );

    // 2. Build groups
    let groups = buildGroups(filtered, groupByFields);

    // 3. Sort groups by spanned column (first span col that matches sort field),
    //    or sort per-row columns within groups
    if (sort) {
      const col = columns.find((c) => c.field === sort.field);
      if (col?.span) {
        // Sort groups by first row's value of the spanned field
        groups = groups.sort((a, b) => {
          const av = a.rows[0]?.row[sort.field] ?? "";
          const bv = b.rows[0]?.row[sort.field] ?? "";
          const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
          return sort.direction === "asc" ? cmp : -cmp;
        });
      } else {
        // Sort rows within each group
        groups = groups.map((g) => ({
          ...g,
          rows: [...g.rows].sort((a, b) => {
            const av = a.row[sort.field] ?? "";
            const bv = b.row[sort.field] ?? "";
            const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
            return sort.direction === "asc" ? cmp : -cmp;
          }),
        }));
      }
    }

    return groups;
  }, [data, columns, filters, sort, groupByFields]);

  // Total rows (for pagination based on groups)
  const totalGroupCount = processedGroups.length;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalGroupCount / rowsPerPage));

  // Reset page when data changes
  useEffect(() => setCurrentPage(1), [data.length]);

  const pageGroups = processedGroups.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  // ── Selection (by original data index) ──
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    onSelectionChange?.(data.filter((_, i) => selectedRows.has(i)));
  }, [selectedRows, data, onSelectionChange]);

  const handleRowSelect = useCallback((originalIndex: number, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      checked ? next.add(originalIndex) : next.delete(originalIndex);
      return next;
    });
  }, []);

  const handleGroupSelect = useCallback(
    (group: RowGroup, checked: boolean) => {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        group.rows.forEach(({ originalIndex }) => {
          checked ? next.add(originalIndex) : next.delete(originalIndex);
        });
        return next;
      });
    },
    [],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedRows(
        checked ? new Set(data.map((_, i) => i)) : new Set(),
      );
    },
    [data],
  );

  const allSelected = selectedRows.size === data.length && data.length > 0;

  // ── Delete ──
  const deleteSelected = useCallback(() => {
    onDataChange(data.filter((_, i) => !selectedRows.has(i)));
    setSelectedRows(new Set());
  }, [data, selectedRows, onDataChange]);

  // ── Cell edits ──
  const [editingCell, setEditingCell] = useState<{
    originalIndex: number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<any>("");

  const saveEdit = useCallback(() => {
    if (!editingCell) return;
    const newData = [...data];
    newData[editingCell.originalIndex] = {
      ...newData[editingCell.originalIndex],
      [editingCell.field]: editValue,
    };
    onDataChange(newData);
    setEditingCell(null);
  }, [editingCell, editValue, data, onDataChange]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const handleCellChange = useCallback(
    (originalIndex: number, field: string, value: any) => {
      const newData = [...data];
      newData[originalIndex] = { ...newData[originalIndex], [field]: value };
      onDataChange(newData);
    },
    [data, onDataChange],
  );

  // Spanned cell edit: apply to all rows in the group
  const handleSpannedCellChange = useCallback(
    (group: RowGroup, field: string, value: any) => {
      const newData = [...data];
      group.rows.forEach(({ originalIndex }) => {
        newData[originalIndex] = { ...newData[originalIndex], [field]: value };
      });
      onDataChange(newData);
    },
    [data, onDataChange],
  );

  // Spanned inline edit
  const saveSpannedEdit = useCallback(
    (group: RowGroup) => {
      if (!editingCell) return;
      handleSpannedCellChange(group, editingCell.field, editValue);
      setEditingCell(null);
    },
    [editingCell, editValue, handleSpannedCellChange],
  );

  // ── Bulk date ──
  const [bulkDateField, setBulkDateField] = useState<string | null>(null);
  const [bulkDateStyle, setBulkDateStyle] = useState<React.CSSProperties>({});

  const applyBulkDate = useCallback(
    (date: string) => {
      if (!bulkDateField) return;
      const newData = data.map((row) => ({ ...row, [bulkDateField]: date }));
      onDataChange(newData);
      setBulkDateField(null);
    },
    [bulkDateField, data, onDataChange],
  );

  const [bulkNumberField, setBulkNumberField] = useState<string | null>(null)
  const [bulkNumberStyle, setBulkNumberStyle] = useState<React.CSSProperties>({})
  // Falls back to the original hardcoded copy so any existing usage that
  // doesn't set column.bulkSetLabel renders exactly as it did before.
  const [bulkNumberLabel, setBulkNumberLabel] = useState<string>('Set budget for all rows')
  const [bulkDropdownField,  setBulkDropdownField]  = useState<string | null>(null)
  const [bulkDropdownStyle,  setBulkDropdownStyle]  = useState<React.CSSProperties>({})
  const [bulkDropdownOptions, setBulkDropdownOptions] = useState<DropdownOption[]>([])

  const applyBulkNumber = useCallback((value: number) => {
    if (!bulkNumberField) return
    onDataChange(data.map((row) => ({ ...row, [bulkNumberField]: value })))
    setBulkNumberField(null)
  }, [bulkNumberField, data, onDataChange])

  const applyBulkDropdown = useCallback((value: string) => {
    if (!bulkDropdownField) return
    onDataChange(data.map((row) => ({ ...row, [bulkDropdownField]: value })))
    setBulkDropdownField(null)
  }, [bulkDropdownField, data, onDataChange])

  // ── Layout ──
  const checkboxColWidth = showCheckboxColumn ? 48 : 0;
  const totalDataRows = processedGroups.reduce((sum, g) => sum + g.rows.length, 0);

  return (
    <div className={cn("w-full bg-white", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-b-0 border-slate-200 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="h-7 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {totalGroupCount.toLocaleString()}
            </span>
            <span className="text-sm text-slate-500">campaigns</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-medium text-slate-600">
              {totalDataRows.toLocaleString()} rows
            </span>
            {selectedRows.size > 0 && (
              <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                {selectedRows.size} selected
              </span>
            )}
            {Object.keys(filters).length > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                <Filter className="h-2.5 w-2.5" />
                {Object.keys(filters).length} filter
                {Object.keys(filters).length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {showDeleteOption && selectedRows.size > 0 && (
          <button
            type="button"
            onClick={deleteSelected}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete ({selectedRows.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-slate-200 overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "600px" }}>
          <table className="table-fixed w-full border-collapse min-w-full">
            <colgroup>
              {showCheckboxColumn && (
                <col style={{ width: checkboxColWidth }} />
              )}
              {columns.map((col) => (
                <col
                  key={col.field}
                  style={{ width: columnWidths[col.field] ?? col.width ?? 120 }}
                />
              ))}
            </colgroup>

            <thead className="sticky top-0 z-30">
              <tr
                className="bg-slate-50 border-b border-slate-200"
                style={{ height: 40 }}
              >
                {showCheckboxColumn && (
                  <th
                    className="sticky left-0 z-40 bg-slate-50 border-r border-slate-200 p-0"
                    style={{ width: checkboxColWidth }}
                  >
                    <div className="flex items-center justify-center h-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300 rounded"
                      />
                    </div>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.field}
                    className="text-left p-0 bg-slate-50 border-r border-slate-200 relative"
                    style={{
                      width: columnWidths[col.field] ?? col.width ?? 120,
                      minWidth: col.minWidth ?? 80,
                      maxWidth: col.maxWidth ?? 560,
                    }}
                  >
                    <ColumnHeader
                      col={col}
                      sort={sort?.field === col.field ? sort : undefined}
                      filter={filters[col.field]}
                      onSort={() => handleSort(col.field)}
                      onFilter={(op, val) => handleFilter(col.field, op, val)}
                      onClearFilter={() => clearFilter(col.field)}
                      onResizeMouseDown={(e) => onResizeMouseDown(e, col.field)}
                      onDateHeaderClick={
                        col.type === "date"
                          ? (e: React.MouseEvent) => {
                              const r = (e.currentTarget as HTMLElement)
                                .closest("th")
                                ?.getBoundingClientRect();
                              setBulkDateStyle({
                                position: "fixed",
                                top: (r?.bottom ?? 0) + 4,
                                left: Math.max(0, r?.left ?? 0),
                                zIndex: 9999,
                              });
                              setBulkDateField(col.field);
                            }
                          : undefined
                      }
                      onNumberHeaderClick={
                        col.type === 'number' && col.bulkSet
                          ? (e: React.MouseEvent) => {
                              const r = (e.currentTarget as HTMLElement)
                                .closest('th')
                                ?.getBoundingClientRect()
                              setBulkNumberStyle({
                                position: 'fixed',
                                top: (r?.bottom ?? 0) + 4,
                                left: Math.max(0, r?.left ?? 0),
                                zIndex: 9999,
                              })
                              setBulkNumberLabel(col.bulkSetLabel ?? 'Set budget for all rows')
                              setBulkNumberField(col.field)
                            }
                          : undefined
                      }
                      onDropdownHeaderClick={
                        col.type === 'dropdown' && col.bulkSet
                          ? (e: React.MouseEvent) => {
                              const r = (e.currentTarget as HTMLElement)
                                .closest('th')
                                ?.getBoundingClientRect()
                              setBulkDropdownStyle({
                                position: 'fixed',
                                top: (r?.bottom ?? 0) + 4,
                                left: Math.max(0, r?.left ?? 0),
                                zIndex: 9999,
                              })
                              setBulkDropdownOptions(col.options ?? [])
                              setBulkDropdownField(col.field)
                            }
                          : undefined
                      }
                    />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pageGroups.map((group) => {
                const groupRowCount = group.rows.length;
                const anyInGroupSelected = group.rows.some(({ originalIndex }) =>
                  selectedRows.has(originalIndex),
                );
                const allInGroupSelected = group.rows.every(({ originalIndex }) =>
                  selectedRows.has(originalIndex),
                );

                return group.rows.map(({ originalIndex, row }, rowIdx) => {
                  const isFirst = rowIdx === 0;
                  const isLast = rowIdx === groupRowCount - 1;
                  const isSelected = selectedRows.has(originalIndex);

                  return (
                    <tr
                      key={originalIndex}
                      className={cn(
                        "border-b border-slate-100 transition-colors hover:bg-slate-50/40",
                        isSelected && "bg-blue-50/50",
                        !isSelected && rowIdx % 2 === 1 && "bg-slate-50/30",
                        isLast && "border-b-slate-200 border-b",
                      )}
                      style={{ height: 36 }}
                    >
                      {/* Checkbox (per row) */}
                      {showCheckboxColumn && (
                        <td
                          className={cn(
                            "sticky left-0 z-20 p-0 border-r border-slate-200",
                            isSelected
                              ? "bg-blue-50"
                              : rowIdx % 2 === 1
                                ? "bg-slate-50/40"
                                : "bg-white",
                          )}
                          style={{ width: checkboxColWidth }}
                        >
                          <div className="flex items-center justify-center h-9">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleRowSelect(originalIndex, checked as boolean)
                              }
                              className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 border-slate-300 rounded"
                            />
                          </div>
                        </td>
                      )}

                      {columns.map((col) => {
                        const cellValue = row[col.field];

                        // ── Spanned columns: render only on first row of group ──
                        if (col.span) {
                          if (!isFirst) return null; // consumed by rowSpan

                          const isSpanEditing =
                            editingCell?.originalIndex === originalIndex &&
                            editingCell?.field === col.field;

                          const renderSpanContent = () => {
                            if (col.type === "dropdown") {
                              return (
                                <DropdownCell
                                  value={cellValue}
                                  options={col.options ?? []}
                                  editable={col.editable}
                                  onChange={(v) =>
                                    handleSpannedCellChange(group, col.field, v)
                                  }
                                />
                              );
                            }
                            if (col.type === "date") {
                              return (
                                <DateCell
                                  value={cellValue}
                                  editable={col.editable}
                                  onChange={(v) =>
                                    handleSpannedCellChange(group, col.field, v)
                                  }
                                />
                              );
                            }
                            // text/number with inline edit for spanned
                            if (isSpanEditing && col.editable) {
                              return (
                                <div className="flex items-center gap-1 w-full px-2">
                                  <Input
                                    type={col.type === "number" ? "number" : "text"}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-7 text-[13px] flex-1 focus:ring-2 focus:ring-blue-500 bg-white border-slate-200 rounded"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveSpannedEdit(group);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => saveSpannedEdit(group)}
                                    className="h-6 w-6 flex items-center justify-center hover:bg-green-100 hover:text-green-700 rounded"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="h-6 w-6 flex items-center justify-center hover:bg-red-100 hover:text-red-700 rounded"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            }
                            const display =
                              cellValue === 0 || cellValue === "0"
                                ? String(cellValue)
                                : !cellValue && cellValue !== false
                                  ? "—"
                                  : String(cellValue);
                            return (
                              <div
                                className={cn(
                                  "flex items-center justify-between group/span w-full px-3",
                                  col.editable &&
                                    "cursor-pointer hover:bg-blue-50/70 rounded mx-1 transition-colors",
                                )}
                                onClick={() =>
                                  col.editable && (
                                    setEditingCell({ originalIndex, field: col.field }),
                                    setEditValue(cellValue)
                                  )
                                }
                              >
                                <span className="text-[13px] text-slate-700 truncate font-medium">
                                  {display}
                                </span>
                                {groupRowCount > 1 && (
                                  <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                                    ×{groupRowCount}
                                  </span>
                                )}
                                {col.editable && (
                                  <Edit3 className="h-3 w-3 opacity-0 group-hover/span:opacity-50 ml-1 text-slate-400 flex-shrink-0" />
                                )}
                              </div>
                            );
                          };

                          return (
                            <td
                              key={col.field}
                              rowSpan={groupRowCount}
                              className={cn(
                                "p-0 border-r border-slate-200 align-middle",
                                allInGroupSelected
                                  ? "bg-blue-50/60"
                                  : "bg-white",
                                // Strong left border to visually separate groups
                                "border-l-2 border-l-slate-200",
                              )}
                              style={{
                                width: columnWidths[col.field] ?? col.width ?? 120,
                                minWidth: col.minWidth ?? 80,
                                maxWidth: col.maxWidth ?? 560,
                                // Vertical center
                                verticalAlign: "middle",
                              }}
                            >
                              <div className="flex items-center justify-center w-full min-h-[36px]">
                                {renderSpanContent()}
                              </div>
                            </td>
                          );
                        }

                        // ── Per-row columns ──
                        return (
                          <td
                            key={col.field}
                            className={cn(
                              "p-0 border-r border-slate-200",
                              isSelected ? "bg-blue-50/60" : "",
                            )}
                            style={{
                              width: columnWidths[col.field] ?? col.width ?? 120,
                              minWidth: col.minWidth ?? 80,
                              maxWidth: col.maxWidth ?? 560,
                            }}
                          >
                            <div
                              className={cn(
                                "h-9 px-3 flex items-center",
                                !isSelected && rowIdx % 2 === 1
                                  ? "bg-slate-50/40"
                                  : "bg-transparent",
                              )}
                            >
                              {col.type === "dropdown" ? (
                                <DropdownCell
                                  value={cellValue}
                                  options={col.options ?? []}
                                  editable={col.editable}
                                  onChange={(v) =>
                                    handleCellChange(originalIndex, col.field, v)
                                  }
                                />
                              ) : col.type === "date" ? (
                                <DateCell
                                  value={cellValue}
                                  editable={col.editable}
                                  onChange={(v) =>
                                    handleCellChange(originalIndex, col.field, v)
                                  }
                                />
                              ) : (
                                <EditableCell
                                  value={cellValue}
                                  column={col}
                                  isEditing={
                                    editingCell?.originalIndex === originalIndex &&
                                    editingCell?.field === col.field
                                  }
                                  editValue={editValue}
                                  onStartEdit={(v) => {
                                    setEditingCell({
                                      originalIndex,
                                      field: col.field,
                                    });
                                    setEditValue(v);
                                  }}
                                  onSave={saveEdit}
                                  onCancel={cancelEdit}
                                  onEditValueChange={setEditValue}
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}

              {/* Empty rows to fill page */}
              {Array.from({
                length: Math.max(0, rowsPerPage - pageGroups.length),
              }).map((_, i) => (
                <tr
                  key={`empty-${i}`}
                  className="border-b border-slate-100 opacity-20"
                  style={{ height: 36 }}
                >
                  {showCheckboxColumn && (
                    <td className="border-r border-slate-200" />
                  )}
                  {columns.map((col) => (
                    <td key={col.field} className="border-r border-slate-200" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-t-0 border-slate-200 rounded-b-xl">
        <div className="text-[13px] text-slate-600">
          Page{" "}
          <span className="font-semibold text-slate-800">{currentPage}</span>{" "}
          of{" "}
          <span className="font-semibold text-slate-800">{totalPages}</span>
          <span className="text-slate-400 mx-2">·</span>
          <span className="font-semibold text-slate-800">
            {totalGroupCount}
          </span>{" "}
          campaigns,{" "}
          <span className="font-semibold text-slate-800">{totalDataRows}</span>{" "}
          rows
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-bold min-w-[2.5rem] text-center">
            {currentPage}
          </div>
          <button
            type="button"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Bulk date popup */}
      {bulkDateField && (
        <BulkDatePopup
          style={bulkDateStyle}
          onApply={applyBulkDate}
          onCancel={() => setBulkDateField(null)}
        />
      )}
      {bulkNumberField && (
        <BulkNumberPopup
          label={bulkNumberLabel}
          style={bulkNumberStyle}
          onApply={applyBulkNumber}
          onCancel={() => setBulkNumberField(null)}
        />
      )}
      {bulkDropdownField && (
        <BulkDropdownPopup
          label="Set all rows"
          options={bulkDropdownOptions}
          style={bulkDropdownStyle}
          onApply={applyBulkDropdown}
          onCancel={() => setBulkDropdownField(null)}
        />
      )}
    </div>
  );
}