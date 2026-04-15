"use client";

import type React from "react";

import { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import { Button } from "../ui/table/button";
import { Input } from "../ui/table/input";
import { Checkbox } from "../ui/table/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/table-dropdown-menu";
import {
  Download,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pin,
  PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

export interface ColumnDefinition {
  field: string;
  headerName: string;
  type?: "text" | "number" | "date" | "boolean";
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  pinned?: "left" | "right" | null;
  autoFitHeader?: boolean;
}

export interface TableData {
  [key: string]: any;
}

interface FilterState {
  [field: string]: {
    type: "text" | "number" | "date" | "boolean";
    operator: string;
    value: any;
    values?: any[];
  };
}

interface SortState {
  field: string;
  direction: "asc" | "desc";
}

interface AdvancedDataTableProps {
  data: TableData[];
  columns: ColumnDefinition[];
  onDataChange?: (data: TableData[]) => void;
  onColumnsChange?: (columns: ColumnDefinition[]) => void;
  className?: string;
  showCheckboxColumn?: boolean;
  rowsPerPage?: number;
  initialSort?: SortState[];
  autoFitHeaders?: boolean;
  showExportCard?: boolean;
  filename?: string;
  onSelectionChange?: (selectedData: TableData[]) => void;
  showDeleteOption?: boolean;
  /**
   * Field name whose value uniquely identifies each row.
   * When provided, selection and deletion are keyed by this field — making
   * filter + select-all + delete work correctly across all views.
   * When omitted the table uses the row's stable index in `data` as the key
   * (original index-based behaviour), keeping existing callers unaffected.
   */
  rowKey?: string;
  /**
   * Pre-select rows by their stable key on first mount.
   * Useful for restoring selection state when the component remounts
   * (e.g. after a collapsible section is reopened).
   * Requires `rowKey` to be set so the keys match row values.
   */
  initialSelectedKeys?: string[];
}

interface CellRendererProps {
  value: any;
  column: ColumnDefinition;
  isEditing: boolean;
  editValue: any;
  onEdit: (value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditValueChange: (value: any) => void;
  rowData: TableData;
}

// ---------------------------------------------------------------------------
// Internal enriched row type — carries a pre-computed stable key.
// We never expose this outside the component.
// ---------------------------------------------------------------------------
interface EnrichedRow {
  row: TableData;
  /** Stable string key derived once when building filteredWithKeys. */
  key: string;
}

// ---------------------------------------------------------------------------
// Derive a stable string key for a row.
//   - rowKey provided → row[rowKey]   (O(1), survives spread-copy)
//   - rowKey absent   → String(originalIndex)  (legacy, index-based)
// ---------------------------------------------------------------------------
function deriveKey(
  row: TableData,
  rowKey: string | undefined,
  fallbackIndex: number,
): string {
  if (rowKey) {
    const v = row[rowKey];
    if (v !== undefined && v !== null) return String(v);
  }
  return String(fallbackIndex);
}

// ---------------------------------------------------------------------------
const calculateOptimalHeaderWidth = (headerText: string): number => {
  const paddingWidth = 16;
  const smallCharWidth = 6;
  const largeCharWidth = 8;
  const isSmall = (ch: string) => /[a-z0-9]/.test(ch);
  let textWidth = 0;
  for (const ch of headerText) textWidth += isSmall(ch) ? smallCharWidth : largeCharWidth;
  return Math.max(100, Math.ceil((textWidth + paddingWidth) / 5) * 5);
};

const ImageCell = memo(function ImageCell({ imageUrl }: { imageUrl: string }) {
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties | null>(null);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  if (!imageUrl || imageError) return null;

  const handleMouseEnter = () => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setPopupStyle({
        position: "fixed",
        top: rect.top + rect.height / 2 - 68,
        left: rect.right + 8,
        width: 136,
        height: 136,
        zIndex: 9999,
      });
    }
  };
  const handleMouseLeave = () => setPopupStyle(null);

  return (
    <div className="relative inline-block mr-3">
      <img
        ref={imgRef}
        src={imageUrl || "/placeholder.svg"}
        alt="Row image"
        className="min-w-8 h-8 rounded-md object-cover border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
        onError={() => setImageError(true)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      {popupStyle &&
        createPortal(
          <div
            className="bg-white p-2 rounded-lg shadow-xl border border-slate-300"
            style={popupStyle}
            onMouseEnter={() => setPopupStyle(popupStyle)}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Expanded view"
              className="w-32 h-32 rounded-md object-cover"
            />
          </div>,
          document.body,
        )}
    </div>
  );
});

const CellRenderer = memo(function CellRenderer({
  value,
  column,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onEditValueChange,
  rowData,
}: CellRendererProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") onSave();
      if (e.key === "Escape") onCancel();
    },
    [onSave, onCancel],
  );

  const handleClick = useCallback(() => {
    if (column.editable) onEdit(value);
  }, [column.editable, onEdit, value]);

  const displayValue =
    column.type === "date" && value
      ? new Date(value).toLocaleDateString()
      : value === 0 || value === "0" || value === 0.0
        ? String(value)
        : value === "" || value === null || value === undefined
          ? "-"
          : String(value);

  const isNameColumn =
    column.field.toLowerCase() === "name" ||
    column.field.toLowerCase() === "product_name" ||
    column.headerName.toLowerCase() === "name";

  if (isEditing && column.editable) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          type={
            column.type === "number" ? "number" : column.type === "date" ? "date" : "text"
          }
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          className="h-8 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white border-slate-200 rounded-md"
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-700 rounded-md transition-all duration-200"
          onClick={onSave}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700 rounded-md transition-all duration-200"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between group w-full min-h-[1.75rem]",
        column.editable &&
          "cursor-pointer hover:bg-blue-50/70 rounded-md px-2 py-1 -mx-2 -my-1 transition-all duration-200",
      )}
      onClick={handleClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        {isNameColumn && rowData?.image_url && <ImageCell imageUrl={rowData.image_url} />}
        <span
          className="truncate font-normal text-slate-700"
          style={{ fontSize: "13px", lineHeight: "1.4" }}
        >
          {displayValue}
        </span>
      </div>
      {column.editable && (
        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-60 ml-2 text-slate-400 transition-all duration-200" />
      )}
    </div>
  );
});

const ColumnActionsDropdown = memo(function ColumnActionsDropdown({
  column,
  sorts,
  filters,
  onSort,
  onFilter,
  onClearFilter,
  onPin,
  data,
  open,
  onOpenChange,
}: {
  column: ColumnDefinition;
  sorts: SortState[];
  filters: FilterState;
  onSort: (field: string) => void;
  onFilter: (field: string, type: string, operator: string, value: any) => void;
  onClearFilter: (field: string) => void;
  onPin: (field: string, position: "left" | "right" | null) => void;
  data: TableData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [filterOperator, setFilterOperator] = useState(
    filters[column.field]?.operator || "contains",
  );
  const [filterValue, setFilterValue] = useState(filters[column.field]?.value || "");

  const type = column.type || "text";
  const currentSort = sorts.find((s) => s.field === column.field);

  const operators: Record<string, { value: string; label: string }[]> = {
    text: [
      { value: "contains", label: "Contains" },
      { value: "equals", label: "Equals" },
      { value: "startsWith", label: "Starts with" },
      { value: "endsWith", label: "Ends with" },
    ],
    number: [
      { value: "equals", label: "Equals" },
      { value: "greaterThan", label: "Greater than" },
      { value: "lessThan", label: "Less than" },
      { value: "greaterThanOrEqual", label: "Greater than or equal" },
      { value: "lessThanOrEqual", label: "Less than or equal" },
    ],
    date: [
      { value: "equals", label: "Equals" },
      { value: "after", label: "After" },
      { value: "before", label: "Before" },
    ],
    boolean: [{ value: "equals", label: "Equals" }],
  };

  const handleApplyFilter = useCallback(() => {
    onFilter(column.field, type, filterOperator, filterValue);
    onOpenChange(false);
  }, [onFilter, column.field, type, filterOperator, filterValue, onOpenChange]);

  const handleClearFilter = useCallback(() => {
    setFilterValue("");
    setFilterOperator("contains");
    onClearFilter(column.field);
    onOpenChange(false);
  }, [onClearFilter, column.field, onOpenChange]);

  const handleSort = useCallback(() => {
    onSort(column.field);
    onOpenChange(false);
  }, [onSort, column.field, onOpenChange]);

  const getSortLabel = currentSort
    ? currentSort.direction === "asc"
      ? "Sort Descending"
      : "Remove Sort"
    : "Sort Ascending";

  const getSortIcon = currentSort ? (
    currentSort.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  ) : (
    <ArrowUpDown className="h-4 w-4" />
  );

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <div className="w-full h-full pointer-events-none" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 bg-white border-slate-200 shadow-xl rounded-lg"
        align="end"
      >
        <div className="p-4 space-y-3 bg-white" onClick={(e) => e.stopPropagation()}>
          {column.sortable !== false && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sort Options
              </label>
              <Button
                variant="default"
                size="sm"
                onClick={handleSort}
                className="w-full justify-start gap-3 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-700 font-medium py-2.5 rounded-lg transition-all duration-200"
              >
                {getSortIcon}
                {getSortLabel}
              </Button>
            </div>
          )}

          {column.filterable !== false && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter Options
              </label>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Filter Type</label>
                <select
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {operators[type]?.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Filter Value</label>
                <Input
                  type={type === "number" ? "number" : type === "date" ? "date" : "text"}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black border-slate-200 rounded-lg py-2.5"
                  placeholder="Enter filter value..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleApplyFilter}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  Apply Filter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearFilter}
                  className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pin Column
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { pos: "left" as const, label: "Left", Icon: Pin },
                  { pos: null, label: "None", Icon: PinOff },
                  { pos: "right" as const, label: "Right", Icon: Pin },
                ] as const
              ).map(({ pos, label, Icon }) => (
                <Button
                  key={label}
                  size="sm"
                  variant={column.pinned === pos ? "default" : "outline"}
                  onClick={() => { onPin(column.field, pos); onOpenChange(false); }}
                  className={cn(
                    "text-xs font-medium py-2.5 rounded-lg transition-all duration-200",
                    column.pinned === pos
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700",
                  )}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// ===========================================================================
// Main component
// ===========================================================================
export function AdvancedDataTable({
  data,
  columns,
  onDataChange,
  onColumnsChange,
  onSelectionChange,
  className,
  showCheckboxColumn = true,
  rowsPerPage = 10,
  initialSort = [],
  autoFitHeaders = false,
  showExportCard = true,
  filename = "export",
  showDeleteOption = true,
  rowKey,
  initialSelectedKeys,
}: AdvancedDataTableProps) {
  // ── columns ──────────────────────────────────────────────────────────────
  const processedColumns = useMemo(() => {
    return columns.map((col) => {
      const shouldAutoFit = autoFitHeaders || col.autoFitHeader;
      if (!shouldAutoFit && col.width !== undefined) return col;
      if (shouldAutoFit) {
        const calc = calculateOptimalHeaderWidth(col.headerName);
        let w = calc;
        if (col.minWidth !== undefined) w = Math.max(w, col.minWidth);
        if (col.maxWidth !== undefined) w = Math.min(w, col.maxWidth);
        return { ...col, width: w };
      }
      return { ...col, width: col.width || 240 };
    });
  }, [columns, autoFitHeaders]);

  const [internalColumns, setInternalColumns] = useState<ColumnDefinition[]>(processedColumns);
  useEffect(() => { setInternalColumns(processedColumns); }, [processedColumns]);

  const pinnedColumns = useMemo(() => ({
    left:   internalColumns.filter((c) => c.pinned === "left"),
    right:  internalColumns.filter((c) => c.pinned === "right"),
    center: internalColumns.filter((c) => !c.pinned),
  }), [internalColumns]);

  const orderedColumns = useMemo(
    () => [...pinnedColumns.left, ...pinnedColumns.center, ...pinnedColumns.right],
    [pinnedColumns],
  );

  const initialWidths = useMemo(
    () =>
      Object.fromEntries(
        internalColumns.map((c) => [
          c.field,
          Math.min(typeof c.width === "number" ? c.width : 180, c.maxWidth || 560),
        ]),
      ) as Record<string, number>,
    [internalColumns],
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialWidths);
  useEffect(() => { setColumnWidths(initialWidths); }, [initialWidths]);

  // ── column resize ─────────────────────────────────────────────────────────
  const resizingRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, field: string) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = { field, startX: e.clientX, startWidth: columnWidths[field] ?? 120 };
      document.body.style.cursor = "col-resize";
      document.body.classList.add("select-none");
    },
    [columnWidths],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const col = internalColumns.find((c) => c.field === r.field);
      const min = col?.minWidth ?? 80;
      const max = col?.maxWidth ?? 400;
      const w = Math.max(min, Math.min(max, r.startWidth + (e.clientX - r.startX)));
      setColumnWidths((prev) => (prev[r.field] === w ? prev : { ...prev, [r.field]: w }));
    };
    const onMouseUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.classList.remove("select-none");
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [internalColumns]);

  // ── filters / sorts ───────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({});
  const [sorts, setSorts] = useState<SortState[]>(initialSort || []);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── editing ───────────────────────────────────────────────────────────────
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>("");
  const [hasChanges, setHasChanges] = useState(false);

  // ── selection ─────────────────────────────────────────────────────────────
  // Set of stable row keys (row[rowKey] or String(originalIndex)).
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(
    () => new Set(initialSelectedKeys ?? []),
  );

  // =========================================================================
  // KEY DATA STRUCTURES
  //
  // 1. keyToOriginalIndex  Map<key, originalIndex>
  //    Built from `data` prop.  Used by deleteSelectedRows to avoid indexOf.
  //    Rebuilt whenever `data` changes (which happens after every delete).
  //
  // 2. filteredWithKeys  EnrichedRow[]
  //    The filtered+sorted view of `data`, each row enriched with its stable
  //    key. Built in one useMemo so the render loop never needs to call
  //    deriveKey or indexOf. Uses object-reference equality (processedData
  //    preserves references from `data`) for the no-rowKey fallback path.
  // =========================================================================

  /** O(1) lookup: stable key → original index in `data`. */
  const keyToOriginalIndex = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    data.forEach((row, i) => map.set(deriveKey(row, rowKey, i), i));
    return map;
  }, [data, rowKey]);

  /** Filtered + sorted data with stable keys attached. */
  const filteredWithKeys = useMemo<EnrichedRow[]>(() => {
    // Build a reference→index map for the no-rowKey fallback.
    // processedData is derived from data via filter/sort, preserving references.
    const refToIndex = new Map<TableData, number>();
    if (!rowKey) data.forEach((row, i) => refToIndex.set(row, i));

    // --- apply filters ---
    let result = [...data];

    Object.entries(filters).forEach(([field, filter]) => {
      result = result.filter((row) => {
        const value = row[field];
        const fv = filter.value;
        if (fv === "" || fv === null || fv === undefined) return true;

        switch (filter.type) {
          case "text": {
            const sv = String(value).toLowerCase();
            const sf = String(fv).toLowerCase();
            switch (filter.operator) {
              case "contains":   return sv.includes(sf);
              case "equals":     return sv === sf;
              case "startsWith": return sv.startsWith(sf);
              case "endsWith":   return sv.endsWith(sf);
              default:           return true;
            }
          }
          case "number": {
            const nv = Number(value), nf = Number(fv);
            switch (filter.operator) {
              case "equals":             return nv === nf;
              case "greaterThan":        return nv > nf;
              case "lessThan":           return nv < nf;
              case "greaterThanOrEqual": return nv >= nf;
              case "lessThanOrEqual":    return nv <= nf;
              default:                   return true;
            }
          }
          case "date": {
            const dv = new Date(value), df = new Date(fv);
            switch (filter.operator) {
              case "equals": return dv.toDateString() === df.toDateString();
              case "after":  return dv > df;
              case "before": return dv < df;
              default:       return true;
            }
          }
          default: return true;
        }
      });
    });

    // --- apply sorts ---
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const av = a[sort.field], bv = b[sort.field];
          if (av === bv) continue;
          return (av < bv ? -1 : 1) * (sort.direction === "asc" ? 1 : -1);
        }
        return 0;
      });
    }

    // --- annotate with stable keys ---
    return result.map((row) => {
      const key = rowKey
        ? deriveKey(row, rowKey, 0)            // row[rowKey]; index irrelevant
        : String(refToIndex.get(row) ?? 0);    // original index via ref map
      return { row, key };
    });
  }, [data, filters, sorts, rowKey]);

  // Reset to page 1 when filter/sort changes the result set
  const prevFilteredLengthRef = useRef(filteredWithKeys.length);
  useEffect(() => {
    if (filteredWithKeys.length !== prevFilteredLengthRef.current) {
      setCurrentPage(1);
      prevFilteredLengthRef.current = filteredWithKeys.length;
    }
  }, [filteredWithKeys.length]);

  // ── pagination ────────────────────────────────────────────────────────────
  const minVisibleRows = rowsPerPage;
  const containerHeight = useMemo(() => 40 + minVisibleRows * 36 + 28, [minVisibleRows]);
  const checkboxColumnWidth = showCheckboxColumn ? 80 : 0;

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredWithKeys.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredWithKeys.length);
    return {
      totalPages,
      startIndex,
      endIndex,
      currentPageData: filteredWithKeys.slice(startIndex, endIndex),
    };
  }, [filteredWithKeys, currentPage, rowsPerPage]);

  const displayData = useMemo<EnrichedRow[]>(() => {
    const actual = paginationData.currentPageData;
    const emptyCount = Math.max(0, minVisibleRows - actual.length);
    const empties: EnrichedRow[] = Array.from({ length: emptyCount }, (_, i) => ({
      row: { __isEmpty: true, __emptyIndex: i },
      key: `__empty_${i}`,
    }));
    return [...actual, ...empties];
  }, [paginationData.currentPageData, minVisibleRows]);

  // ── onSelectionChange callback ────────────────────────────────────────────
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange; }, [onSelectionChange]);

  useEffect(() => {
    if (!onSelectionChangeRef.current) return;
    const selected = data.filter((row, i) =>
      selectedRowKeys.has(deriveKey(row, rowKey, i)),
    );
    onSelectionChangeRef.current(selected);
  }, [selectedRowKeys, data, rowKey]);

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleSort = useCallback((field: string) => {
    setSorts((prev) => {
      const ex = prev.find((s) => s.field === field);
      if (ex) return ex.direction === "asc" ? [{ field, direction: "desc" as const }] : [];
      return [{ field, direction: "asc" as const }];
    });
  }, []);

  const handleFilter = useCallback(
    (field: string, type: string, operator: string, value: any) => {
      setFilters((prev) => ({ ...prev, [field]: { type: type as any, operator, value } }));
    },
    [],
  );

  const clearFilter = useCallback((field: string) => {
    setFilters((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleCellEdit = useCallback((rowIndex: number, field: string, value: any) => {
    setEditingCell({ row: rowIndex, field });
    setEditValue(value);
  }, []);

  /**
   * saveEdit: maps the visible row index back to the original data index
   * using the pre-computed key, avoiding brittle index arithmetic.
   */
  const saveEdit = useCallback(() => {
    if (!editingCell) return;
    const pageItem = paginationData.currentPageData[editingCell.row];
    if (!pageItem) return;
    const origIdx = keyToOriginalIndex.get(pageItem.key);
    if (origIdx === undefined) return;
    const newData = [...data];
    newData[origIdx] = { ...newData[origIdx], [editingCell.field]: editValue };
    onDataChange?.(newData);
    setEditingCell(null);
    setHasChanges(true);
  }, [editingCell, editValue, data, onDataChange, paginationData.currentPageData, keyToOriginalIndex]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  // ── selection handlers ────────────────────────────────────────────────────

  /** Toggle a single row by its pre-computed stable key. */
  const handleRowSelect = useCallback((key: string, checked: boolean) => {
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  /**
   * Tracks whether the user's pointer is actively over the header checkbox.
   * This gates handleSelectAll so it only fires on genuine user interaction,
   * NOT when the `checked` prop changes programmatically (which causes shadcn
   * Checkbox / Radix to spuriously fire onCheckedChange, wiping all selections
   * when a single row checkbox is toggled and allInViewSelected flips).
   */
  const selectAllInteractingRef = useRef(false);

  /**
   * Select/deselect every row in the current filtered view (all pages).
   * Rows outside the current filter that are already selected are untouched.
   * Only runs when triggered by genuine user interaction (pointer down on the
   * header checkbox), not by prop-driven re-renders.
   */
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      // Guard: ignore calls that originate from React re-rendering the
      // controlled `checked` prop — only act on real pointer events.
      if (!selectAllInteractingRef.current) return;
      selectAllInteractingRef.current = false;

      setSelectedRowKeys((prev) => {
        const next = new Set(prev);
        filteredWithKeys.forEach(({ key }) => {
          if (checked) next.add(key);
          else next.delete(key);
        });
        return next;
      });
    },
    [filteredWithKeys],
  );

  /**
   * Delete all rows whose key is in selectedRowKeys.
   * Uses keyToOriginalIndex for O(1) lookup — no indexOf, no reference
   * equality, works correctly even after onDataChange creates spread copies.
   */
  const deleteSelectedRows = useCallback(() => {
    if (selectedRowKeys.size === 0) return;
    const newData = data.filter((row, i) => !selectedRowKeys.has(deriveKey(row, rowKey, i)));
    onDataChange?.(newData);
    setSelectedRowKeys(new Set());
    setHasChanges(true);
  }, [data, rowKey, selectedRowKeys, onDataChange]);

  // ── derived selection state ───────────────────────────────────────────────

  /** Count of rows in the current filtered view that are selected. */
  const selectedCountInView = useMemo(
    () => filteredWithKeys.filter(({ key }) => selectedRowKeys.has(key)).length,
    [filteredWithKeys, selectedRowKeys],
  );

  const allInViewSelected =
    filteredWithKeys.length > 0 && selectedCountInView === filteredWithKeys.length;

  /**
   * Total selected rows — counts only keys that still exist in `data`.
   * This prevents stale keys from inflating the count after deletions or
   * after the parent swaps in fresh data.
   */
  const totalSelected = useMemo(() => {
    let count = 0;
    selectedRowKeys.forEach((key) => { if (keyToOriginalIndex.has(key)) count++; });
    return count;
  }, [selectedRowKeys, keyToOriginalIndex]);

  // ── column pin helpers ────────────────────────────────────────────────────
  const getLeftOffset = useCallback(
    (column: ColumnDefinition) => {
      if (column.pinned !== "left") return undefined;
      let offset = checkboxColumnWidth;
      for (const col of pinnedColumns.left) {
        if (col.field === column.field) break;
        offset += columnWidths[col.field] ?? col.width ?? 120;
      }
      return offset;
    },
    [pinnedColumns.left, checkboxColumnWidth, columnWidths],
  );

  const getRightOffset = useCallback(
    (column: ColumnDefinition) => {
      if (column.pinned !== "right") return undefined;
      const idx = pinnedColumns.right.findIndex((c) => c.field === column.field);
      let offset = 0;
      for (let i = idx + 1; i < pinnedColumns.right.length; i++) {
        offset += columnWidths[pinnedColumns.right[i].field] ?? pinnedColumns.right[i].width ?? 120;
      }
      return offset;
    },
    [pinnedColumns.right, columnWidths],
  );

  const handleColumnPin = useCallback(
    (field: string, position: "left" | "right" | null) => {
      const updated = internalColumns.map((col) =>
        col.field === field ? { ...col, pinned: position } : col,
      );
      setInternalColumns(updated);
      onColumnsChange?.(updated);
    },
    [internalColumns, onColumnsChange],
  );

  const handleHeaderClick = useCallback((e: React.MouseEvent, field: string) => {
    if (resizingRef.current) return;
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === field ? null : field));
  }, []);

  // ── export ────────────────────────────────────────────────────────────────
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    return str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const exportData = useCallback(
    (format: "csv" | "excel") => {
      const rows = filteredWithKeys.map(({ row }) => row);
      if (format === "excel") {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload = () => {
          const XLSX = (window as any).XLSX;
          const wsData = [
            internalColumns.map((c) => c.headerName),
            ...rows.map((row) => internalColumns.map((c) => row[c.field] ?? "")),
          ];
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
          XLSX.writeFile(wb, `${filename}.xlsx`);
        };
        document.head.appendChild(script);
      } else {
        const headers = internalColumns.map((c) => escapeCSV(c.headerName)).join(",");
        const csvRows = rows
          .map((row) => internalColumns.map((c) => escapeCSV(row[c.field])).join(","))
          .join("\n");
        const blob = new Blob([`${headers}\n${csvRows}`], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [filteredWithKeys, internalColumns, filename],
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={cn("w-full bg-white", className)}>
      {showExportCard && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            {showDeleteOption && totalSelected > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedRows}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({totalSelected})
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {filteredWithKeys.length.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-slate-500">records</span>
                </div>
                <div className="text-xs text-slate-500">
                  {totalSelected > 0 && `${totalSelected} selected • `}
                  Page {currentPage} of {paginationData.totalPages || 1} •
                  Showing {rowsPerPage} rows
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-slate-200 shadow-lg rounded-lg">
                <DropdownMenuItem onClick={() => exportData("csv")} className="hover:bg-slate-50">
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData("excel")} className="hover:bg-slate-50">
                  Export for Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <div className="bg-white border-x border-b border-slate-200 overflow-hidden">
        <div className="overflow-auto" style={{ height: `${containerHeight}px` }}>
          <div className="relative">
            <table className="table-fixed w-full border-collapse min-w-full">
              <colgroup>
                {showCheckboxColumn && <col style={{ width: checkboxColumnWidth }} />}
                {orderedColumns.map((col) => (
                  <col
                    key={col.field}
                    style={{ width: columnWidths[col.field] ?? col.width ?? 120 }}
                  />
                ))}
              </colgroup>

              <thead>
                <tr className="bg-white border-b border-slate-200" style={{ height: "40px" }}>
                  {showCheckboxColumn && (
                    <th
                      className="sticky left-0 z-30 p-0 bg-white border-r border-slate-200"
                      style={{ width: checkboxColumnWidth, minWidth: checkboxColumnWidth }}
                    >
                      <div className="flex items-center justify-center h-12">
                        <Checkbox
                          checked={allInViewSelected}
                          onPointerDown={() => { selectAllInteractingRef.current = true; }}
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300 rounded"
                        />
                      </div>
                    </th>
                  )}
                  {orderedColumns.map((column) => {
                    const isLeftPinned = column.pinned === "left";
                    const isRightPinned = column.pinned === "right";
                    const currentSort = sorts.find((s) => s.field === column.field);

                    return (
                      <th
                        key={column.field}
                        className={cn(
                          "text-left p-0 font-semibold text-xs bg-white border-r border-slate-200 relative group text-slate-700 cursor-pointer hover:bg-slate-50",
                          isLeftPinned && "sticky z-20 shadow-[2px_0_4px_rgba(0,0,0,0.08)]",
                          isRightPinned && "sticky z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.08)]",
                        )}
                        style={{
                          width: columnWidths[column.field] ?? column.width ?? 80,
                          minWidth: column.minWidth ?? 80,
                          maxWidth: column.maxWidth ?? 400,
                          left: getLeftOffset(column),
                          right: getRightOffset(column),
                        }}
                        onClick={(e) => handleHeaderClick(e, column.field)}
                      >
                        <div className="flex items-center justify-between h-10 px-3">
                          <div className="flex items-center flex-1 min-w-0">
                            <span
                              className="truncate font-bold text-slate-700"
                              style={{ fontSize: "12px", lineHeight: "1.4" }}
                            >
                              {column.headerName}
                            </span>
                            {currentSort && (
                              <span className="ml-1 text-blue-600">
                                {currentSort.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                            {filters[column.field] && (
                              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </div>

                        <ColumnActionsDropdown
                          column={column}
                          sorts={sorts}
                          filters={filters}
                          onSort={handleSort}
                          onFilter={handleFilter}
                          onClearFilter={clearFilter}
                          onPin={handleColumnPin}
                          data={data}
                          open={openDropdown === column.field}
                          onOpenChange={(open) => setOpenDropdown(open ? column.field : null)}
                        />

                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize ${column.headerName} column`}
                          onMouseDown={(e) => onResizeMouseDown(e, column.field)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none z-30"
                        >
                          <div className="h-full w-px mx-auto bg-transparent group-hover:bg-slate-300/60" />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {displayData.map(({ row, key }, rowIndex) => {
                  const isEmpty = !!row.__isEmpty;
                  const isSelected = !isEmpty && selectedRowKeys.has(key);

                  return (
                    <tr
                      key={key}
                      className={cn(
                        "border-b border-slate-150 hover:bg-slate-50 transition-all duration-150",
                        isSelected && "bg-blue-50 border-blue-200",
                        isEmpty && "opacity-30",
                        !isSelected && rowIndex % 2 === 1 && !isEmpty && "bg-slate-50/40",
                      )}
                      style={{ height: "36px" }}
                    >
                      {showCheckboxColumn && (
                        <td
                          className={cn(
                            "sticky left-0 z-20 p-0 border-r border-slate-200",
                            isSelected ? "bg-blue-50" : rowIndex % 2 === 1 && !isEmpty ? "bg-slate-50/40" : "bg-white",
                          )}
                          style={{ width: checkboxColumnWidth, minWidth: checkboxColumnWidth }}
                        >
                          <div className="flex items-center justify-center h-11">
                            {!isEmpty && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleRowSelect(key, checked as boolean)
                                }
                                className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 border-slate-300 rounded"
                              />
                            )}
                          </div>
                        </td>
                      )}

                      {orderedColumns.map((column) => {
                        const isLeftPinned = column.pinned === "left";
                        const isRightPinned = column.pinned === "right";

                        return (
                          <td
                            key={column.field}
                            className={cn(
                              "p-0 border-r border-slate-200 relative",
                              isLeftPinned && "sticky z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)]",
                              isRightPinned && "sticky z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.06)]",
                              (isLeftPinned || isRightPinned) && (
                                isSelected ? "bg-blue-50"
                                  : rowIndex % 2 === 1 && !isEmpty ? "bg-slate-50"
                                  : "bg-white"
                              ),
                            )}
                            style={{
                              width: columnWidths[column.field] ?? column.width ?? 80,
                              minWidth: column.minWidth ?? 80,
                              maxWidth: column.maxWidth ?? 400,
                              left: getLeftOffset(column),
                              right: getRightOffset(column),
                            }}
                          >
                            <div
                              className={cn(
                                "h-9 px-3 flex items-center",
                                isSelected ? "bg-blue-50"
                                  : rowIndex % 2 === 1 && !isEmpty ? "bg-slate-50/40"
                                  : "bg-white",
                              )}
                            >
                              {!isEmpty && (
                                <CellRenderer
                                  value={row[column.field]}
                                  column={column}
                                  isEditing={
                                    editingCell?.row === rowIndex &&
                                    editingCell?.field === column.field
                                  }
                                  editValue={editValue}
                                  onEdit={(v) => handleCellEdit(rowIndex, column.field, v)}
                                  onSave={saveEdit}
                                  onCancel={cancelEdit}
                                  onEditValueChange={setEditValue}
                                  rowData={row}
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-x border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-800">{paginationData.startIndex + 1}</span> to{" "}
            <span className="font-bold text-slate-800">{paginationData.endIndex}</span> of{" "}
            <span className="font-bold text-slate-800">
              {filteredWithKeys.length.toLocaleString()}
            </span>{" "}
            entries
          </div>
          {filteredWithKeys.length !== data.length && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
              Filtered from {data.length.toLocaleString()} total
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            Previous
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Page</span>
            <div className="px-4 py-2 bg-gradient-to-r from-ocean-600 to-ocean-400 text-white rounded-lg text-sm font-bold min-w-[3rem] text-center shadow-sm">
              {currentPage}
            </div>
            <span className="text-sm font-medium text-slate-600">
              of {paginationData.totalPages || 1}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(paginationData.totalPages, p + 1))}
            disabled={currentPage === paginationData.totalPages || paginationData.totalPages === 0}
            className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}