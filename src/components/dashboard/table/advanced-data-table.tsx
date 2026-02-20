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

const calculateOptimalHeaderWidth = (headerText: string): number => {
  const paddingWidth = 16;
  const resizeHandleWidth = 6;

  const smallCharWidth = 6;
  const largeCharWidth = 8;

  const isSmall = (ch: string) => /[a-z0-9]/.test(ch);
  const isLargeOrSymbol = (ch: string) => !isSmall(ch);

  let textWidth = 0;

  for (const ch of headerText) {
    textWidth += isSmall(ch) ? smallCharWidth : largeCharWidth;
  }

  const totalWidth = textWidth + paddingWidth;

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
          className="min-w-8 h-8 rounded-md object-cover border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
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
            column.type === "number"
              ? "number"
              : column.type === "date"
                ? "date"
                : "text"
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
        {isNameColumn && rowData?.image_url && (
          <ImageCell imageUrl={rowData.image_url} />
        )}
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
  const [filterValue, setFilterValue] = useState(
    filters[column.field]?.value || "",
  );

  const type = column.type || "text";
  const currentSort = sorts.find((s) => s.field === column.field);
  const hasFilter = filters[column.field];

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
    onOpenChange(false); // Close dropdown after applying
  }, [onFilter, column.field, type, filterOperator, filterValue, onOpenChange]);

  const handleClearFilter = useCallback(() => {
    setFilterValue("");
    setFilterOperator("contains");
    onClearFilter(column.field);
    onOpenChange(false); // Close dropdown after clearing
  }, [onClearFilter, column.field, onOpenChange]);

  const handleSort = useCallback(() => {
    onSort(column.field);
    onOpenChange(false); // Close dropdown after sorting
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
        <div
          className="p-4 space-y-3 bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {column.sortable !== false && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sort Options
              </label>
              <Button
                variant="default"
                size="sm"
                onClick={handleSort}
                className="w-full justify-start gap-3 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700  hover:text-slate-700 font-medium py-2.5 rounded-lg transition-all duration-200"
              >
                {getSortIcon}
                {getSortLabel}
              </Button>
            </div>
          )}

          {column.filterable !== false && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Filter Options
                </label>

                <div className="space-y-1">
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

                <div className="space-y-1">
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
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pin Column
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={column.pinned === "left" ? "default" : "outline"}
                onClick={() => {
                  onPin(column.field, "left");
                  onOpenChange(false);
                }}
                className={cn(
                  "text-xs font-medium py-2.5 rounded-lg transition-all duration-200",
                  column.pinned === "left"
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700",
                )}
              >
                <Pin className="h-3 w-3 mr-1" />
                Left
              </Button>
              <Button
                size="sm"
                variant={!column.pinned ? "default" : "outline"}
                onClick={() => {
                  onPin(column.field, null);
                  onOpenChange(false);
                }}
                className={cn(
                  "text-xs font-medium py-2.5 rounded-lg transition-all duration-200",
                  !column.pinned
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700",
                )}
              >
                <PinOff className="h-3 w-3 mr-1" />
                None
              </Button>
              <Button
                size="sm"
                variant={column.pinned === "right" ? "default" : "outline"}
                onClick={() => {
                  onPin(column.field, "right");
                  onOpenChange(false);
                }}
                className={cn(
                  "text-xs font-medium py-2.5 rounded-lg transition-all duration-200",
                  column.pinned === "right"
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700",
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

export function AdvancedDataTable({
  data,
  columns,
  onDataChange,
  onColumnsChange,
  className,
  showCheckboxColumn = true,
  rowsPerPage = 10,
  initialSort = [],
  autoFitHeaders = false,
  showExportCard = true,
}: AdvancedDataTableProps) {
  const processedColumns = useMemo(() => {
    return columns.map((col) => {
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
  }, [columns, autoFitHeaders]);

  const [internalColumns, setInternalColumns] =
    useState<ColumnDefinition[]>(processedColumns);
  const [filteredData, setFilteredData] = useState<TableData[]>(data);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<any>("");
  const [filters, setFilters] = useState<FilterState>({});
  const [sorts, setSorts] = useState<SortState[]>(initialSort || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const minVisibleRows = rowsPerPage;
  const containerRef = useRef<HTMLDivElement>(null);

  const containerHeight = useMemo(() => {
    return 40 + minVisibleRows * 36 + 28;
  }, [minVisibleRows]);

  const checkboxColumnWidth = showCheckboxColumn ? 80 : 0;

  const initialWidths = useMemo(
    () =>
      Object.fromEntries(
        internalColumns.map((c) => [
          c.field,
          typeof c.width === "number"
            ? Math.min(c.width, c.maxWidth || 560)
            : Math.min(180, c.maxWidth || 400),
        ]),
      ) as Record<string, number>,
    [internalColumns],
  );

  const [columnWidths, setColumnWidths] =
    useState<Record<string, number>>(initialWidths);
  const resizingRef = useRef<{
    field: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    setColumnWidths(initialWidths);
  }, [initialWidths]);

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, field: string) => {
      e.preventDefault();
      e.stopPropagation();
      const startWidth = columnWidths[field] ?? 120;
      resizingRef.current = { field, startX: e.clientX, startWidth };
      document.body.style.cursor = "col-resize";
      document.body.classList.add("select-none");
    },
    [columnWidths],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const delta = e.clientX - r.startX;
      const col = internalColumns.find((c) => c.field === r.field);
      const min = col?.minWidth ?? 80;
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

  useEffect(() => {
    setInternalColumns(processedColumns);
  }, [processedColumns]);

  const pinnedColumns = useMemo(() => {
    const left = internalColumns.filter((col) => col.pinned === "left");
    const right = internalColumns.filter((col) => col.pinned === "right");
    const center = internalColumns.filter((col) => !col.pinned);
    return { left, center, right };
  }, [internalColumns]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
    const currentPageData = filteredData.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, currentPageData };
  }, [filteredData, currentPage, rowsPerPage]);

  const displayData = useMemo(() => {
    const actualData = paginationData.currentPageData;
    const emptyRowsNeeded = Math.max(0, minVisibleRows - actualData.length);

    const emptyRows = Array(emptyRowsNeeded)
      .fill(null)
      .map((_, index) => ({
        __isEmpty: true,
        __emptyIndex: index,
      }));

    return [...actualData, ...emptyRows];
  }, [paginationData.currentPageData, minVisibleRows]);

  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.entries(filters).forEach(([field, filter]) => {
      result = result.filter((row) => {
        const value = row[field];
        const filterValue = filter.value;

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

    // Apply sorts
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const aVal = a[sort.field];
          const bVal = b[sort.field];

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

  const orderedColumns = useMemo(() => {
    return [
      ...pinnedColumns.left,
      ...pinnedColumns.center,
      ...pinnedColumns.right,
    ];
  }, [pinnedColumns]);

  const handleSort = useCallback((field: string) => {
    setSorts((prev) => {
      const existingSort = prev.find((s) => s.field === field);
      if (existingSort) {
        if (existingSort.direction === "asc") {
          return [{ field, direction: "desc" as const }];
        } else {
          return [];
        }
      } else {
        return [{ field, direction: "asc" as const }];
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
    [],
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
    [],
  );

  const saveEdit = useCallback(() => {
    if (!editingCell) return;

    const actualRowIndex = paginationData.startIndex + editingCell.row;
    const newData = [...data];
    newData[actualRowIndex] = {
      ...newData[actualRowIndex],
      [editingCell.field]: editValue,
    };

    onDataChange?.(newData);
    setEditingCell(null);
    setHasChanges(true);
  }, [editingCell, editValue, data, onDataChange, paginationData.startIndex]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const handleRowSelect = useCallback(
    (rowIndex: number, checked: boolean) => {
      setSelectedRows((prev) => {
        const newSet = new Set(prev);
        const actualIndex = paginationData.startIndex + rowIndex;
        if (checked) {
          newSet.add(actualIndex);
        } else {
          newSet.delete(actualIndex);
        }
        return newSet;
      });
    },
    [paginationData.startIndex],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIndices = new Set(
          Array.from({ length: filteredData.length }, (_, i) => i),
        );
        setSelectedRows(allIndices);
      } else {
        setSelectedRows(new Set());
      }
    },
    [filteredData.length],
  );

  const deleteSelectedRows = useCallback(() => {
    if (selectedRows.size === 0) return;

    const newData = data.filter((_, index) => !selectedRows.has(index));
    onDataChange?.(newData);
    setSelectedRows(new Set());
    setHasChanges(true);
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
        // Dynamically load SheetJS for proper .xlsx export
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload = () => {
          const XLSX = (window as any).XLSX;

          // Build worksheet data: header row + data rows
          const wsData = [
            internalColumns.map((col) => col.headerName),
            ...filteredData.map((row) =>
              internalColumns.map((col) => row[col.field] ?? ""),
            ),
          ];

          const ws = XLSX.utils.aoa_to_sheet(wsData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

          XLSX.writeFile(wb, "export.xlsx");
        };
        document.head.appendChild(script);
      } else {
        // CSV export unchanged
        const headers = internalColumns
          .map((col) => escapeCSV(col.headerName))
          .join(",");
        const rows = filteredData
          .map((row) =>
            internalColumns.map((col) => escapeCSV(row[col.field])).join(","),
          )
          .join("\n");

        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "export.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [filteredData, internalColumns],
  );

  const handleColumnPin = useCallback(
    (field: string, position: "left" | "right" | null) => {
      const updatedColumns = internalColumns.map((col) =>
        col.field === field ? { ...col, pinned: position } : col,
      );
      setInternalColumns(updatedColumns);
      onColumnsChange?.(updatedColumns);
    },
    [internalColumns, onColumnsChange],
  );

  const getLeftOffset = useCallback(
    (column: ColumnDefinition) => {
      if (column.pinned !== "left") return undefined;

      const leftPinnedIndex = pinnedColumns.left.findIndex(
        (col) => col.field === column.field,
      );
      let offset = checkboxColumnWidth;

      for (let i = 0; i < leftPinnedIndex; i++) {
        offset +=
          columnWidths[pinnedColumns.left[i].field] ??
          pinnedColumns.left[i].width ??
          120;
      }

      return offset;
    },
    [pinnedColumns.left, checkboxColumnWidth, columnWidths],
  );

  const getRightOffset = useCallback(
    (column: ColumnDefinition) => {
      if (column.pinned !== "right") return undefined;

      const rightPinnedIndex = pinnedColumns.right.findIndex(
        (col) => col.field === column.field,
      );
      let offset = 0;

      for (let i = rightPinnedIndex + 1; i < pinnedColumns.right.length; i++) {
        offset +=
          columnWidths[pinnedColumns.right[i].field] ??
          pinnedColumns.right[i].width ??
          120;
      }

      return offset;
    },
    [pinnedColumns.right, columnWidths],
  );

  const handleHeaderClick = useCallback(
    (e: React.MouseEvent, field: string) => {
      // Prevent opening dropdown if clicking on resize handle
      if (resizingRef.current) return;

      e.stopPropagation();
      setOpenDropdown((prev) => (prev === field ? null : field));
    },
    [],
  );

  return (
    <div className={cn("w-full bg-white", className)}>
      {showExportCard && (
        <div
          className={`flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200`}
        >
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
      )}

      <div
        className={`bg-white border-x border-b border-slate-200 overflow-hidden`}
      >
        <div
          className="overflow-auto"
          style={{ height: `${containerHeight}px` }}
        >
          <div className="relative">
            <table className="table-fixed w-full border-collapse min-w-full">
              <colgroup>
                {showCheckboxColumn && (
                  <col style={{ width: checkboxColumnWidth }} />
                )}
                {orderedColumns.map((col) => (
                  <col
                    key={col.field}
                    style={{
                      width: columnWidths[col.field] ?? col.width ?? 120,
                    }}
                  />
                ))}
              </colgroup>
              <thead>
                <tr
                  className="bg-white border-b border-slate-200"
                  style={{ height: "40px" }}
                >
                  {showCheckboxColumn && (
                    <th
                      className="sticky left-0 z-30 p-0 bg-white border-r border-slate-200"
                      style={{
                        width: checkboxColumnWidth,
                        minWidth: checkboxColumnWidth,
                      }}
                    >
                      <div className="flex items-center justify-center h-12">
                        <Checkbox
                          checked={
                            selectedRows.size === filteredData.length &&
                            filteredData.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300 rounded"
                        />
                      </div>
                    </th>
                  )}
                  {orderedColumns.map((column) => {
                    const isLeftPinned = column.pinned === "left";
                    const isRightPinned = column.pinned === "right";
                    const leftOffset = getLeftOffset(column);
                    const rightOffset = getRightOffset(column);
                    const currentSort = sorts.find(
                      (s) => s.field === column.field,
                    );
                    const hasFilter = filters[column.field];

                    return (
                      <th
                        key={column.field}
                        className={cn(
                          "text-left p-0 font-semibold text-xs bg-white border-r border-slate-200 relative group text-slate-700 cursor-pointer hover:bg-slate-50",
                          isLeftPinned &&
                            "sticky z-20 shadow-[2px_0_4px_rgba(0,0,0,0.08)]",
                          isRightPinned &&
                            "sticky z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.08)]",
                        )}
                        style={{
                          width:
                            columnWidths[column.field] ?? column.width ?? 80,
                          minWidth: column.minWidth ?? 80,
                          maxWidth: column.maxWidth ?? 400,
                          left: leftOffset,
                          right: rightOffset,
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
                            {hasFilter && (
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
                          onOpenChange={(open) =>
                            setOpenDropdown(open ? column.field : null)
                          }
                        />

                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize ${column.headerName} column`}
                          onMouseDown={(e) =>
                            onResizeMouseDown(e, column.field)
                          }
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
                {displayData.map((row, rowIndex) => {
                  const actualIndex = paginationData.startIndex + rowIndex;
                  const isSelected = selectedRows.has(actualIndex);
                  const isEmpty =
                    row?.__isEmpty || Object.keys(row || {}).length === 0;

                  return (
                    <tr
                      key={
                        row?.__isEmpty ? `empty-${row.__emptyIndex}` : rowIndex
                      }
                      className={cn(
                        "border-b border-slate-150 hover:bg-slate-50 transition-all duration-150",
                        isSelected && !isEmpty && "bg-blue-50 border-blue-200",
                        isEmpty && "opacity-30",
                        rowIndex % 2 === 1 && !isEmpty && "bg-slate-50/40",
                      )}
                      style={{ height: "36px" }}
                    >
                      {showCheckboxColumn && (
                        <td
                          className={cn(
                            "sticky left-0 z-20 p-0 border-r border-slate-200",
                            rowIndex % 2 === 1 && !isEmpty
                              ? "bg-slate-50/40"
                              : "bg-white",
                            isSelected && !isEmpty && "bg-blue-50",
                          )}
                          style={{
                            width: checkboxColumnWidth,
                            minWidth: checkboxColumnWidth,
                          }}
                        >
                          <div className="flex items-center justify-center h-11">
                            {!isEmpty && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleRowSelect(rowIndex, checked as boolean)
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
                        const leftOffset = getLeftOffset(column);
                        const rightOffset = getRightOffset(column);

                        return (
                          <td
                            key={column.field}
                            className={cn(
                              "p-0 border-r border-slate-200 relative",
                              isLeftPinned &&
                                "sticky z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)]",
                              isRightPinned &&
                                "sticky z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.06)]",
                              !isEmpty &&
                                rowIndex % 2 === 1 &&
                                (isLeftPinned || isRightPinned) &&
                                "bg-slate-50",
                              !isEmpty &&
                                rowIndex % 2 === 0 &&
                                (isLeftPinned || isRightPinned) &&
                                "bg-white",
                              isSelected &&
                                (isLeftPinned || isRightPinned) &&
                                "bg-blue-50",
                            )}
                            style={{
                              width:
                                columnWidths[column.field] ??
                                column.width ??
                                80,
                              minWidth: column.minWidth ?? 80,
                              maxWidth: column.maxWidth ?? 400,
                              left: leftOffset,
                              right: rightOffset,
                            }}
                          >
                            <div
                              className={cn(
                                "h-9 px-3 flex items-center",
                                rowIndex % 2 === 1 && !isEmpty
                                  ? "bg-slate-50/40"
                                  : "bg-white",
                                isSelected && !isEmpty && "bg-blue-50",
                              )}
                            >
                              {!isEmpty && (
                                <CellRenderer
                                  value={
                                    (row as TableData)[
                                      column.field as keyof TableData
                                    ]
                                  }
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
                                      value,
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

      <div className="flex items-center justify-between px-4 py-3 bg-white border-x border-b border-slate-200">
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
              {filteredData.length.toLocaleString()}
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
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(paginationData.totalPages, prev + 1),
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
