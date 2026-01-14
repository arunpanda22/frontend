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
  GripVertical,
  MoreVertical,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TableData {
  [key: string]: any;
  _parentId?: string | number;
  _children?: TableData[];
}

interface ExpandState {
  [key: string]: boolean;
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
  sortByChange?: boolean;
}

interface AdvancedDataTableProps<T extends TableData = TableData> {
  data: T[];
  columns: ColumnDefinition[];
  onDataChange?: (data: T[]) => void;
  onEditedRowsChange?: (editedRows: Set<number>) => void;
  onColumnsChange?: (columns: ColumnDefinition[]) => void; // ADD THIS
  className?: string;
  autoFitHeaders?: boolean;
  showExportCard?: boolean;
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

const ComparisonBadge = memo(function ComparisonBadge({
  value,
  prevValue,
}: {
  value: number;
  prevValue: number;
}) {
  const change = prevValue !== 0 ? ((value - prevValue) / prevValue) * 100 : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  if (change === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0",
        isPositive && "bg-green-100 text-green-700",
        isNegative && "bg-red-100 text-red-700"
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span className="whitespace-nowrap">{Math.abs(change).toFixed(2)}%</span>
    </div>
  );
});

const calculateOptimalHeaderWidth = (headerText: string): number => {
  const menuButtonWidth = 28;
  const gapWidth = 8;
  const paddingWidth = 24;

  const smallCharWidth = 9;
  const largeCharWidth = 13;

  const isSmall = (ch: string) => /[a-z0-9]/.test(ch);
  const isLargeOrSymbol = (ch: string) => !isSmall(ch);

  let textWidth = 0;

  for (const ch of headerText) {
    textWidth += isSmall(ch) ? smallCharWidth : largeCharWidth;
  }

  const totalWidth = textWidth + gapWidth + menuButtonWidth + paddingWidth;

  // Round to nearest 5 and keep minimum 100
  return Math.max(100, Math.ceil(totalWidth / 5) * 5);
};

const ImageCell = memo(function ImageCell({ imageUrl }: { imageUrl: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return null;
  }

  return (
    <div className="relative inline-block mr-3">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={imageUrl || "/placeholder.svg"}
          alt="Row image"
          className="w-8 h-8 rounded-md object-cover border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
          onError={() => setImageError(true)}
        />

        {isHovered && (
          <div
            className="absolute z-[9999] bg-white p-2 rounded-lg shadow-xl border border-slate-300"
            style={{
              left: "100%",
              top: "50%",
              transform: "translateY(-50%)",
              marginLeft: "8px",
              width: "136px",
              height: "136px",
            }}
            onMouseEnter={() => setIsHovered(true)}
          >
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Expanded view"
              className="w-32 h-32 rounded-md object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
});

const formatValue = (value: any, type?: string): string => {
  if (value === null || value === undefined || value === "") return "-";

  if (type === "number") {
    const num = Number(value);
    if (isNaN(num)) return "-";
    return num.toFixed(2);
  }

  if (type === "date" && value) {
    return new Date(value).toLocaleDateString();
  }

  return String(value);
};

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
    [onSave, onCancel]
  );

  // Check if this row is editable - look for is_editable field or check if it's a keyword row
  const isRowEditable = rowData.is_editable !== false && !rowData._isParent;
  const isCellEditable = column.editable && isRowEditable;

  const handleClick = useCallback(() => {
    if (isCellEditable) {
      onEdit(value);
    }
  }, [isCellEditable, onEdit, value]);

  const displayValue = formatValue(value, column.type);

  const isNameColumn =
    column.field.toLowerCase() === "name" ||
    column.headerName.toLowerCase() === "name";

  const isNumericColumn = column.type === "number";
  const prevValue = rowData?.[`${column.field}_prev`];
  const hasComparison =
    isNumericColumn && prevValue !== undefined && prevValue !== null;

  if (isEditing && isCellEditable) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          type={
            column.type === "number"
              ? "number"
              : column.type === "date"
              ? "date"
              : "text"
          }
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          className="h-8 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-slate-200 text-black rounded-md"
          autoFocus
          onKeyDown={handleKeyDown}
          step={column.type === "number" ? "0.01" : undefined}
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
        isCellEditable &&
          "cursor-pointer hover:bg-blue-50/70 rounded-md px-2 py-1 -mx-2 -my-1 transition-all duration-200"
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col items-start flex-1 min-w-0 gap-1">
        <div className="flex items-center w-full min-w-0">
          {isNameColumn && rowData?.image_url && (
            <ImageCell imageUrl={rowData.image_url} />
          )}
          <div className="relative group/tooltip flex-1 min-w-0">
            <span 
              className="truncate text-sm font-medium text-slate-700 block"
              title={displayValue !== "-" ? String(value || "") : ""}
            >
              {displayValue}
            </span>
          </div>
        </div>
        {hasComparison && (
          <div className="ml-0">
            <ComparisonBadge
              value={Number(value)}
              prevValue={Number(prevValue)}
            />
          </div>
        )}
      </div>
      {isCellEditable && (
        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-60 ml-2 text-slate-400 transition-all duration-200" />
      )}
    </div>
  );
});

const ExpandButton = memo(function ExpandButton({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-6 h-6 hover:bg-slate-100 rounded transition-colors"
      aria-label="Toggle row expansion"
    >
      <svg
        className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
          isExpanded ? "rotate-90" : ""
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
});

// PART 1: Helper Components and Column Actions Dropdown

const ColumnActionsDropdown = memo(function ColumnActionsDropdown({
  column,
  sorts,
  filters,
  onSort,
  onFilter,
  onClearFilter,
  onPin,
  data,
}: {
  column: ColumnDefinition;
  sorts: SortState[];
  filters: FilterState;
  onSort: (field: string, sortByChange?: boolean) => void;
  onFilter: (field: string, type: string, operator: string, value: any) => void;
  onClearFilter: (field: string) => void;
  onPin: (field: string, position: "left" | "right" | null) => void;
  data: TableData[];
}) {
  const [filterOperator, setFilterOperator] = useState(
    filters[column.field]?.operator || "contains"
  );
  const [filterValue, setFilterValue] = useState(
    filters[column.field]?.value || ""
  );

  const type = column.type || "text";
  const currentSort = sorts.find((s) => s.field === column.field);
  const hasFilter = filters[column.field];

  const hasComparisonData = data.some(
    (row) =>
      row[`${column.field}_prev`] !== undefined &&
      row[`${column.field}_prev`] !== null
  );
  const isNumericColumn = column.type === "number";

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
  }, [onFilter, column.field, type, filterOperator, filterValue]);

  const handleClearFilter = useCallback(() => {
    setFilterValue("");
    setFilterOperator("contains");
    onClearFilter(column.field);
  }, [onClearFilter, column.field]);

  const handleSort = useCallback(
    (sortByChange?: boolean) => {
      onSort(column.field, sortByChange);
    },
    [onSort, column.field]
  );

  const getSortLabel = (sortByChange?: boolean) => {
    const currentSortForType = sorts.find(
      (s) => s.field === column.field && s.sortByChange === sortByChange
    );
    if (!currentSortForType)
      return sortByChange ? "Sort by Change %" : "Sort Ascending";
    return currentSortForType.direction === "asc"
      ? sortByChange
        ? "Sort Change % Desc"
        : "Sort Descending"
      : "Remove Sort";
  };

  const getSortIcon = (sortByChange?: boolean) => {
    const currentSortForType = sorts.find(
      (s) => s.field === column.field && s.sortByChange === sortByChange
    );
    return currentSortForType ? (
      currentSortForType.direction === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      )
    ) : (
      <ArrowUpDown className="h-4 w-4" />
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 hover:bg-slate-600/20 text-white rounded-md transition-all duration-200",
            (currentSort || hasFilter || column.pinned) &&
              "bg-slate-600/30 shadow-sm"
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-w-[calc(100vw-2rem)] p-0 bg-white border-slate-200 shadow-xl rounded-lg max-h-[80vh] overflow-y-auto"
        align="end"
        sideOffset={5}
      >
        <div className="p-5 space-y-5 bg-white">
          {column.sortable !== false && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sort Options
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort(false)}
                className="w-full justify-start gap-3 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium py-2.5 rounded-lg transition-all duration-200"
              >
                {getSortIcon(false)}
                {getSortLabel(false)}
              </Button>

              {isNumericColumn && hasComparisonData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort(true)}
                  className="w-full justify-start gap-3 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium py-2.5 rounded-lg transition-all duration-200"
                >
                  {getSortIcon(true)}
                  <div className="flex items-center gap-2">
                    {currentSort?.sortByChange ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4 opacity-50" />
                    )}
                    <span>{getSortLabel(true)}</span>
                  </div>
                </Button>
              )}
            </div>
          )}

          {column.filterable !== false && (
            <>
              <div className="h-px bg-slate-200"></div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Filter Options
                </label>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Filter Type
                  </label>
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Filter Value
                  </label>
                  <Input
                    type={
                      type === "number"
                        ? "number"
                        : type === "date"
                        ? "date"
                        : "text"
                    }
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-slate-200 rounded-lg py-2.5"
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
            </>
          )}

          <div className="h-px bg-slate-200"></div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pin Column
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={column.pinned === "left" ? "default" : "outline"}
                onClick={() => onPin(column.field, "left")}
                className={cn(
                  "text-xs font-medium py-2.5 rounded-lg transition-all duration-200",
                  column.pinned === "left"
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                )}
              >
                <Pin className="h-3 w-3 mr-1" />
                Left
              </Button>
              <Button
                size="sm"
                variant={!column.pinned ? "default" : "outline"}
                onClick={() => onPin(column.field, null)}
                className={cn(
                  "text-xs font-medium py-2.5 rounded-lg transition-all duration-200",
                  !column.pinned
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                )}
              >
                <PinOff className="h-3 w-3 mr-1" />
                None
              </Button>
              <Button
                size="sm"
                variant={column.pinned === "right" ? "default" : "outline"}
                onClick={() => onPin(column.field, "right")}
                className={cn(
                  "text-xs font-medium py-2.5 rounded-lg transition-all duration-200",
                  column.pinned === "right"
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                )}
              >
                <Pin className="h-3 w-3 mr-1" />
                Right
              </Button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// PART 2: Main AdvancedDataTable Component

export function AdvancedDataTable({
  data,
  columns: initialColumns,
  onDataChange,
  onEditedRowsChange,
  onColumnsChange, // ADD THIS
  className,
  autoFitHeaders = false, // ADD THIS
}: AdvancedDataTableProps) {
  const processedColumns = useMemo(() => {
    return initialColumns.map((col) => {
      const shouldAutoFit = autoFitHeaders || col.autoFitHeader;

      if (!shouldAutoFit && col.width !== undefined) {
        return col;
      }

      if (shouldAutoFit) {
        const calculatedWidth = calculateOptimalHeaderWidth(col.headerName);

        let finalWidth = calculatedWidth;
        if (col.minWidth !== undefined) {
          finalWidth = Math.max(finalWidth, col.minWidth);
        }
        if (col.maxWidth !== undefined) {
          finalWidth = Math.min(finalWidth, col.maxWidth);
        }

        return {
          ...col,
          width: finalWidth,
        };
      }

      return {
        ...col,
        width: col.width || 240,
      };
    });
  }, [initialColumns, autoFitHeaders]);

  const [internalColumns, setInternalColumns] =
    useState<ColumnDefinition[]>(processedColumns); // ADD THIS
  const [filteredData, setFilteredData] = useState<TableData[]>(data);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<any>("");
  const [filters, setFilters] = useState<FilterState>({});
  const [sorts, setSorts] = useState<SortState[]>([]);
  const [expandedRows, setExpandedRows] = useState<ExpandState>({});

  const rowsPerPage = 100;
  const minVisibleRows = 10;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight] = useState(600);

  // Update columns when initialColumns change
  useEffect(() => {
    setInternalColumns(processedColumns);
  }, [processedColumns]);

  const initialWidths = useMemo(
    () =>
      Object.fromEntries(
        internalColumns.map((c) => [
          c.field,
          typeof c.width === "number"
            ? Math.min(c.width, c.maxWidth || 560)
            : Math.min(180, c.maxWidth || 400),
        ])
      ) as Record<string, number>,
    [internalColumns] // ✅ Correct dependency
  );

  const [columnWidths, setColumnWidths] =
    useState<Record<string, number>>(initialWidths);

  useEffect(() => {
    setColumnWidths(initialWidths);
  }, [initialWidths]);

  const resizingRef = useRef<{
    field: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, field: string) => {
      e.preventDefault();
      e.stopPropagation();
      const startWidth = columnWidths[field] ?? 180;
      resizingRef.current = { field, startX: e.clientX, startWidth };
      document.body.style.cursor = "col-resize";
      document.body.classList.add("select-none");
    },
    [columnWidths]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const delta = e.clientX - r.startX;
      const col = internalColumns.find((c) => c.field === r.field);
      const min = col?.minWidth ?? 120;
      const max = col?.maxWidth ?? 400;
      const newWidth = Math.max(min, Math.min(max, r.startWidth + delta));
      setColumnWidths((prev) => {
        if (prev[r.field] === newWidth) return prev;
        return { ...prev, [r.field]: newWidth };
      });
    };
    const onMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
      }
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

  const pinnedColumns = useMemo(() => {
    const left = internalColumns.filter((col) => col.pinned === "left");
    const right = internalColumns.filter((col) => col.pinned === "right");
    const center = internalColumns.filter((col) => !col.pinned);
    return { left, center, right };
  }, [internalColumns]);

  // REMOVED: calculateAggregatedRow function - no longer needed since API returns aggregated data

  const flattenedData = useMemo(() => {
    const result: (TableData & {
      _isChild?: boolean;
      _parentRowId?: string | number;
      _flatIndex?: number;
    })[] = [];
    const rowId = (row: TableData, index: number) => row.id || index;

    const flattenChildren = (
      parent: TableData,
      parentIndex: number,
      depth = 0
    ) => {
      const parentRowId = rowId(parent, parentIndex);
      const children = parent._children || [];

      if (children.length > 0) {
        // Use parent data as-is (already aggregated by API)
        const flatIndex = result.length;
        result.push({
          ...parent,
          _isParent: true,
          _rowId: parentRowId,
          _depth: depth,
          _flatIndex: flatIndex,
        });

        const isExpanded = expandedRows[parentRowId] === true;

        if (isExpanded) {
          children.forEach((child) => {
            const flatIndex = result.length;
            result.push({
              ...child,
              _isChild: true,
              _parentRowId: parentRowId,
              _depth: depth + 1,
              _flatIndex: flatIndex,
            });
          });
        }
      } else {
        const flatIndex = result.length;
        result.push({
          ...parent,
          _rowId: parentRowId,
          _depth: depth,
          _flatIndex: flatIndex,
        });
      }
    };

    filteredData.forEach((row, index) => {
      flattenChildren(row, index);
    });

    return result;
  }, [filteredData, expandedRows]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(flattenedData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, flattenedData.length);
    const currentPageData = flattenedData.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, currentPageData };
  }, [flattenedData, currentPage, rowsPerPage]);

  const displayData = useMemo(() => {
    const pageData = [...paginationData.currentPageData];
    while (pageData.length < minVisibleRows) {
      pageData.push({});
    }
    return pageData;
  }, [paginationData.currentPageData, minVisibleRows]);

  const processedData = useMemo(() => {
    let result = [...data];

    Object.entries(filters).forEach(([field, filter]) => {
      result = result.filter((row) => {
        const value = row[field];
        const { operator, value: filterValue } = filter;

        if (
          filterValue === "" ||
          filterValue === null ||
          filterValue === undefined
        )
          return true;

        switch (filter.type) {
          case "text":
            const strValue = String(value).toLowerCase();
            const strFilter = String(filterValue).toLowerCase();
            switch (filter.operator) {
              case "contains":
                return strValue.includes(strFilter);
              case "equals":
                return strValue === strFilter;
              case "startsWith":
                return strValue.startsWith(strFilter);
              case "endsWith":
                return strValue.endsWith(strFilter);
              default:
                return true;
            }
          case "number":
            const numValue = Number(value);
            const numFilter = Number(filterValue);
            switch (filter.operator) {
              case "equals":
                return numValue === numFilter;
              case "greaterThan":
                return numValue > numFilter;
              case "lessThan":
                return numValue < numFilter;
              case "greaterThanOrEqual":
                return numValue >= numFilter;
              case "lessThanOrEqual":
                return numValue <= numFilter;
              default:
                return true;
            }
          case "date":
            const dateValue = new Date(value);
            const dateFilter = new Date(filterValue);
            switch (filter.operator) {
              case "equals":
                return dateValue.toDateString() === dateFilter.toDateString();
              case "after":
                return dateValue > dateFilter;
              case "before":
                return dateValue < dateFilter;
              default:
                return true;
            }
          default:
            return true;
        }
      });
    });

    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          let aVal, bVal;

          if (sort.sortByChange) {
            const aCurrent = Number(a[sort.field]) || 0;
            const aPrev = Number(a[`${sort.field}_prev`]) || 0;
            const bCurrent = Number(b[sort.field]) || 0;
            const bPrev = Number(b[`${sort.field}_prev`]) || 0;

            aVal = aPrev !== 0 ? ((aCurrent - aPrev) / aPrev) * 100 : 0;
            bVal = bPrev !== 0 ? ((bCurrent - bPrev) / bPrev) * 100 : 0;
          } else {
            aVal = a[sort.field];
            bVal = b[sort.field];
          }

          if (aVal === bVal) continue;

          const comparison = aVal < bVal ? -1 : 1;
          return sort.direction === "asc" ? comparison : -comparison;
        }
        return 0;
      });
    }

    return result;
  }, [data, filters, sorts]);

  useEffect(() => {
    setFilteredData(processedData);
    setCurrentPage(1);
  }, [processedData]);

  useEffect(() => {
    onEditedRowsChange?.(editedRows);
  }, [editedRows, onEditedRowsChange]);

  const orderedColumns = useMemo(() => {
    return [
      ...pinnedColumns.left,
      ...pinnedColumns.center,
      ...pinnedColumns.right,
    ];
  }, [pinnedColumns]);

  const handleSort = useCallback((field: string, sortByChange?: boolean) => {
    setSorts((prev) => {
      const existingIndex = prev.findIndex(
        (s) => s.field === field && s.sortByChange === sortByChange
      );

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        if (existing.direction === "asc") {
          return [{ ...existing, direction: "desc" }];
        } else {
          return [];
        }
      } else {
        return [{ field, direction: "asc", sortByChange }];
      }
    });
  }, []);

  const handleFilter = useCallback(
    (field: string, type: string, operator: string, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [field]: { type: type as any, operator, value },
      }));
    },
    []
  );

  const clearFilter = useCallback((field: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  }, []);

  const handleCellEdit = useCallback(
    (rowIndex: number, field: string, value: any) => {
      setEditingCell({ row: rowIndex, field });
      setEditValue(value);
    },
    []
  );

  const saveEdit = useCallback(() => {
    if (!editingCell) return;

    const pageRowIndex = editingCell.row;
    const rowData = displayData[pageRowIndex];
    const flatIndex = rowData._flatIndex;

    if (flatIndex === undefined) return;

    // Create deep copy of data
    const newData = JSON.parse(JSON.stringify(data));

    // Find and update the correct row
    let updated = false;

    for (let i = 0; i < newData.length; i++) {
      if (newData[i]._children) {
        for (let j = 0; j < newData[i]._children.length; j++) {
          if (newData[i]._children[j].keyword_id === rowData.keyword_id) {
            newData[i]._children[j][editingCell.field] =
              editingCell.field === "keyword_bid" ||
              internalColumns.find((c) => c.field === editingCell.field)
                ?.type === "number"
                ? Number(editValue)
                : editValue;
            updated = true;
            break;
          }
        }
      }
      if (updated) break;
    }

    if (updated) {
      onDataChange?.(newData);

      // Mark row as edited and select it
      const newEditedRows = new Set(editedRows);
      newEditedRows.add(flatIndex);
      setEditedRows(newEditedRows);

      const newSelectedRows = new Set(selectedRows);
      newSelectedRows.add(flatIndex);
      setSelectedRows(newSelectedRows);
    }

    setEditingCell(null);
  }, [
    editingCell,
    editValue,
    data,
    displayData,
    internalColumns,
    onDataChange,
    editedRows,
    selectedRows,
  ]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const handleRowSelect = useCallback(
    (rowIndex: number, checked: boolean) => {
      const rowData = displayData[rowIndex];
      const flatIndex = rowData._flatIndex;

      if (flatIndex === undefined) return;

      setSelectedRows((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(flatIndex);
        } else {
          newSet.delete(flatIndex);
        }
        return newSet;
      });
    },
    [displayData]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIndices = new Set(flattenedData.map((_, i) => i));
        setSelectedRows(allIndices);
      } else {
        setSelectedRows(new Set());
      }
    },
    [flattenedData]
  );

  const deleteSelectedRows = useCallback(() => {
    if (selectedRows.size === 0) return;

    const newData = data.filter((_, index) => !selectedRows.has(index));
    onDataChange?.(newData);
    setSelectedRows(new Set());
  }, [data, selectedRows, onDataChange]);

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportData = useCallback(
    (format: "csv" | "excel") => {
      if (format === "excel") {
        const htmlContent = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          </head>
          <body>
            <table>
              <thead>
                <tr>
                  ${internalColumns
                    .map((col) => `<th>${col.headerName}</th>`)
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${filteredData
                  .map(
                    (row) =>
                      `<tr>${internalColumns
                        .map((col) => `<td>${row[col.field] ?? ""}</td>`)
                        .join("")}</tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], {
          type: "application/vnd.ms-excel",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export.xls`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const headers = internalColumns
          .map((col) => escapeCSV(col.headerName))
          .join(",");
        const rows = filteredData
          .map((row) =>
            internalColumns.map((col) => escapeCSV(row[col.field])).join(",")
          )
          .join("\n");

        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: "text/csv" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [filteredData, internalColumns]
  );

  const handleColumnPin = useCallback(
    (field: string, position: "left" | "right" | null) => {
      const updatedColumns = internalColumns.map((col) =>
        col.field === field ? { ...col, pinned: position } : col
      );
      setInternalColumns(updatedColumns);
      onColumnsChange?.(updatedColumns);
    },
    [internalColumns, onColumnsChange]
  );

  const handleRowExpandToggle = useCallback((rowId: string | number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  }, []);

  // Return statement starts on next part (Part 4)

  // PART 4: JSX Return Statement (continues from Part 3)

  return (
    <div className={cn("w-full space-y-6 bg-slate-50", className)}>
      <div className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          {selectedRows.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedRows}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedRows.size})
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <div>
              <div className="text-lg font-bold text-slate-800">
                {filteredData.length.toLocaleString()}{" "}
                <span className="text-sm font-medium text-slate-500">
                  records
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {selectedRows.size > 0 && `${selectedRows.size} selected • `}
                {editedRows.size > 0 && `${editedRows.size} edited • `}
                Page {currentPage} of {paginationData.totalPages || 1}
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
              <DropdownMenuItem
                onClick={() => exportData("csv")}
                className="hover:bg-slate-50"
              >
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportData("excel")}
                className="hover:bg-slate-50"
              >
                Export for Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-auto" style={{ height: containerHeight }}>
          <div className="relative">
            <table className="table-fixed w-full border-collapse min-w-full">
              <colgroup><col style={{ width: 56 }} />{orderedColumns.map((col) => (
                <col
                  key={col.field}
                  style={{
                    width: columnWidths[col.field] ?? col.width ?? 180,
                  }}
                />
              ))}</colgroup>
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-b border-slate-600">
                  <th className="sticky left-0 z-20 w-14 p-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white border-r border-slate-600">
                    <div className="flex items-center justify-center h-12 w-14">
                      <Checkbox
                        checked={
                          selectedRows.size === flattenedData.length &&
                          flattenedData.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-400 rounded"
                      />
                    </div>
                  </th>
                  {orderedColumns.map((column) => {
                    const isLeftPinned = column.pinned === "left";
                    const isRightPinned = column.pinned === "right";

                    const widthFor = (col: ColumnDefinition) =>
                      columnWidths[col.field] ?? col.width ?? 180;
                    const leftOffset = isLeftPinned
                      ? 56 +
                        pinnedColumns.left
                          .slice(0, pinnedColumns.left.indexOf(column))
                          .reduce((acc, col) => acc + widthFor(col), 0)
                      : undefined;
                    const rightOffset = isRightPinned
                      ? pinnedColumns.right
                          .slice(pinnedColumns.right.indexOf(column) + 1)
                          .reduce((acc, col) => acc + widthFor(col), 0)
                      : undefined;

                    return (
                      <th
                        key={column.field}
                        className={cn(
                          "text-left p-0 font-bold text-sm bg-gradient-to-r from-slate-800 to-slate-700 text-white border-r border-slate-600 relative group",
                          isLeftPinned &&
                            "sticky z-10 shadow-[4px_0_8px_rgba(0,0,0,0.15)]",
                          isRightPinned &&
                            "sticky z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.15)]"
                        )}
                        style={{
                          width:
                            columnWidths[column.field] ?? column.width ?? 180,
                          minWidth: column.minWidth ?? 120,
                          maxWidth: column.maxWidth ?? 500, // ADD THIS
                          left: leftOffset,
                          right: rightOffset,
                        }}
                      >
                        <div className="flex items-center justify-between h-12 px-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="truncate font-bold text-white text-sm tracking-wide">
                              {column.headerName}
                            </span>
                          </div>
                          <div className="flex items-center ml-3">
                            <ColumnActionsDropdown
                              column={column}
                              sorts={sorts}
                              filters={filters}
                              onSort={handleSort}
                              onFilter={handleFilter}
                              onClearFilter={clearFilter}
                              onPin={handleColumnPin}
                              data={data}
                            />
                          </div>
                        </div>

                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize ${column.headerName} column`}
                          onMouseDown={(e) =>
                            onResizeMouseDown(e, column.field)
                          }
                          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none"
                        >
                          <div className="h-full w-px mx-auto bg-transparent group-hover:bg-slate-400/60" />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {displayData.map((row, rowIndex) => {
                  const flatIndex = row._flatIndex;
                  const isSelected =
                    flatIndex !== undefined && selectedRows.has(flatIndex);
                  const isEdited =
                    flatIndex !== undefined && editedRows.has(flatIndex);
                  const isEmpty = Object.keys(row).length === 0;
                  const rowId = row.id || row._rowId || rowIndex;
                  const isParent = row._isParent;
                  const isExpanded = expandedRows[rowId];

                  return (
                    <tr
                      key={rowIndex}
                      className={cn(
                        "border-b border-slate-100 hover:bg-blue-50/50 transition-all duration-150",
                        isSelected && "bg-blue-100 border-blue-300",
                        isEdited &&
                          !isSelected &&
                          "bg-yellow-50 border-yellow-200",
                        isEmpty && "opacity-30",
                        rowIndex % 2 === 0 &&
                          !isSelected &&
                          !isEdited &&
                          "bg-slate-50/30"
                      )}
                    >
                      <td className="sticky left-0 z-10 p-0 bg-white border-r border-slate-200">
                        <div className="flex items-center justify-center h-11">
                          {!isEmpty && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleRowSelect(rowIndex, checked as boolean)
                              }
                              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300 rounded"
                            />
                          )}
                        </div>
                      </td>
                      {orderedColumns.map((column, colIndex) => {
                        const isLeftPinned = column.pinned === "left";
                        const isRightPinned = column.pinned === "right";

                        const widthFor = (col: ColumnDefinition) =>
                          columnWidths[col.field] ?? col.width ?? 180;
                        const leftOffset = isLeftPinned
                          ? 56 +
                            pinnedColumns.left
                              .slice(0, pinnedColumns.left.indexOf(column))
                              .reduce((acc, col) => acc + widthFor(col), 0)
                          : undefined;
                        const rightOffset = isRightPinned
                          ? pinnedColumns.right
                              .slice(pinnedColumns.right.indexOf(column) + 1)
                              .reduce((acc, col) => acc + widthFor(col), 0)
                          : undefined;

                        const isFirstColumn = colIndex === 0;

                        return (
                          <td
                            key={column.field}
                            className={cn(
                              "p-0 border-r border-slate-200 relative",
                              isLeftPinned &&
                                "sticky z-10 bg-white shadow-[4px_0_8px_rgba(0,0,0,0.08)]",
                              isRightPinned &&
                                "sticky z-10 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.08)]",
                              isSelected &&
                                (isLeftPinned || isRightPinned) &&
                                "bg-blue-100",
                              isEdited &&
                                !isSelected &&
                                (isLeftPinned || isRightPinned) &&
                                "bg-yellow-50"
                            )}
                            style={{
                              width:
                                columnWidths[column.field] ??
                                column.width ??
                                180,
                              minWidth: column.minWidth ?? 120,
                              maxWidth: column.maxWidth ?? 400, // ADD THIS
                              left: leftOffset,
                              right: rightOffset,
                            }}
                          >
                            <div className="h-14 px-2 flex items-center">
                              {isFirstColumn && isParent && (
                                <div
                                  style={{
                                    paddingLeft: `${(row._depth || 0) * 20}px`,
                                  }}
                                >
                                  <ExpandButton
                                    isExpanded={isExpanded}
                                    onClick={() => handleRowExpandToggle(rowId)}
                                  />
                                </div>
                              )}
                              {!isEmpty && (
                                <CellRenderer
                                  value={row[column.field]}
                                  column={column}
                                  isEditing={
                                    editingCell?.row === rowIndex &&
                                    editingCell?.field === column.field
                                  }
                                  editValue={editValue}
                                  onEdit={(value) =>
                                    handleCellEdit(
                                      rowIndex,
                                      column.field,
                                      value
                                    )
                                  }
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

      <div className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {paginationData.startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-800">
              {paginationData.endIndex}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">
              {flattenedData.length.toLocaleString()}
            </span>{" "}
            entries
          </div>
          {filteredData.length !== data.length && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
              Filtered from {data.length.toLocaleString()} total
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            Previous
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Page</span>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-bold min-w-[3rem] text-center shadow-sm">
              {currentPage}
            </div>
            <span className="text-sm font-medium text-slate-600">
              of {paginationData.totalPages || 1}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(paginationData.totalPages, prev + 1)
              )
            }
            disabled={
              currentPage === paginationData.totalPages ||
              paginationData.totalPages === 0
            }
            className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
