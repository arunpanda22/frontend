"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Download, GripVertical } from "lucide-react";
import { List, type RowComponentProps } from "react-window";
import { useCurrency } from "@/lib/context/CurrencyContext";
import type { PivotMetrics, PivotTreeNode } from "@/lib/hooks/queries/use-pivot-reports";
import { downloadPivotTreeCsv, downloadPivotTreeXlsx, type ExportColumn } from "@/lib/utils/export-pivot-tree";

interface MetricColumn {
  key: keyof PivotMetrics;
  label: string;
  format: "currency" | "number" | "percentage";
  higherIsBetter: boolean;
}

const DEFAULT_COLUMNS: MetricColumn[] = [
  { key: "spend", label: "Spend", format: "currency", higherIsBetter: false },
  { key: "sales", label: "Sales", format: "currency", higherIsBetter: true },
  { key: "orders", label: "Orders", format: "number", higherIsBetter: true },
  { key: "acos", label: "ACOS", format: "percentage", higherIsBetter: false },
  { key: "cvr", label: "CVR", format: "percentage", higherIsBetter: true },
  { key: "impressions", label: "Impressions", format: "number", higherIsBetter: true },
  { key: "clicks", label: "Clicks", format: "number", higherIsBetter: true },
];

const ROW_HEIGHT = 56;
const LIST_HEIGHT = 560;
const METRIC_COL_WIDTH = 140;
const MIN_NAME_COL_WIDTH = 220;
const MAX_NAME_COL_WIDTH = 800;
const NAME_CELL_FONT = "500 14px Inter, ui-sans-serif, system-ui, sans-serif"; // matches font-medium text-sm

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function DeltaBadge({ current, previous, higherIsBetter }: { current: number; previous: number; higherIsBetter: boolean }) {
  const change = percentChange(current, previous);
  if (change === null) return <span className="text-xs text-slate-400">new</span>;
  if (change === 0) return <span className="text-xs text-slate-400">—</span>;

  const isIncrease = change > 0;
  const isGood = isIncrease === higherIsBetter;
  const sign = isIncrease ? "+" : "";

  return (
    <span className={`text-xs font-medium ${isGood ? "text-emerald-600" : "text-rose-600"}`}>
      {sign}
      {(change * 100).toFixed(1)}%
    </span>
  );
}

function MetricCell({
  column,
  current,
  previous,
  formatValue,
}: {
  column: MetricColumn;
  current: number;
  previous?: number;
  formatValue: (value: number, format: MetricColumn["format"]) => string;
}) {
  return (
    <div className="flex-1 px-4 py-2 text-right">
      <div className="font-mono text-sm font-medium tabular-nums text-slate-800">
        {formatValue(current, column.format)}
      </div>
      {previous !== undefined && (
        <div className="mt-0.5">
          <DeltaBadge current={current} previous={previous} higherIsBetter={column.higherIsBetter} />
        </div>
      )}
    </div>
  );
}

interface FlatRow {
  node: PivotTreeNode;
  depth: number;
  path: string;
  hasChildren: boolean;
}

function flattenVisible(tree: PivotTreeNode[], expanded: Set<string>): FlatRow[] {
  const rows: FlatRow[] = [];
  function visit(nodes: PivotTreeNode[], depth: number, parentPath: string) {
    nodes.forEach((node, i) => {
      const path = parentPath ? `${parentPath}.${i}` : `${i}`;
      const hasChildren = !!node.children?.length;
      rows.push({ node, depth, path, hasChildren });
      if (hasChildren && expanded.has(path)) {
        visit(node.children!, depth + 1, path);
      }
    });
  }
  visit(tree, 0, "");
  return rows;
}

// Measures the actual pixel width the longest visible name would need,
// including its indent (depth * 24px) and the toggle-icon gutter (~48px),
// so the column can size itself to fit whatever's currently expanded
// instead of just filling leftover container space.
let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string, font: string): number {
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return text.length * 8; // crude fallback if canvas is unavailable
  ctx.font = font;
  return ctx.measureText(text).width;
}

function longestVisibleNameWidth(flatRows: FlatRow[]): number {
  let max = 0;
  for (const row of flatRows) {
    const indent = 20 + row.depth * 24;
    const iconGutter = 32; // toggle button / spacer width
    const textWidth = measureTextWidth(row.node.name, NAME_CELL_FONT);
    const rowPadding = 32; // left+right cell padding (px-5 ~= 20px each side, rounded)
    max = Math.max(max, indent + iconGutter + textWidth + rowPadding);
  }
  return max;
}

interface TreeRowProps {
  flatRows: FlatRow[];
  expanded: Set<string>;
  toggle: (path: string) => void;
  columns: MetricColumn[];
  template: string;
  formatValue: (value: number, format: MetricColumn["format"]) => string;
}

function TreeRow({ index, style, flatRows, expanded, toggle, columns, template, formatValue }: RowComponentProps<TreeRowProps>) {
  const { node, depth, path, hasChildren } = flatRows[index];
  const isExpanded = expanded.has(path);
  const { current, previous } = node.metrics;

  return (
    <div
      style={{ ...style, gridTemplateColumns: template }}
      className="grid items-center border-b border-slate-100 transition hover:bg-slate-50/60"
    >
      <div className="flex items-center px-5 py-2" style={{ paddingLeft: `${20 + depth * 24}px` }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggle(path)}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.name}`}
            className="mr-2 flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="mr-2 size-6 shrink-0" />
        )}
        <span
          title={node.name}
          className={`truncate font-medium ${depth === 0 ? "text-slate-900" : "text-slate-700"}`}
        >
          {node.name}
        </span>
      </div>
      {columns.map((column) => (
        <MetricCell
          key={column.key}
          column={column}
          current={current[column.key]}
          previous={previous?.[column.key]}
          formatValue={formatValue}
        />
      ))}
    </div>
  );
}

export function PivotTreeTable({
  tree,
  columns = DEFAULT_COLUMNS,
  defaultExpandedDepth = 0,
  rootLabel = "Name",
  enableTopLevelFilter = false,
  enableExport = false,
  exportFilename = "pivot-report",
}: {
  tree: PivotTreeNode[];
  columns?: MetricColumn[];
  defaultExpandedDepth?: number;
  rootLabel?: string;
  enableTopLevelFilter?: boolean;
  enableExport?: boolean;
  exportFilename?: string;
}) {
  const { formatCurrencyNoDecimal, formatNumber, formatPercentage } = useCurrency();
  const [selectedTopLevel, setSelectedTopLevel] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Manual drag override — once set, takes priority over both the
  // container-fill width AND the content-measured width below.
  const [manualNameColWidth, setManualNameColWidth] = useState<number | null>(null);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const visibleTree = useMemo(() => {
    if (!selectedTopLevel) return tree;
    return tree.filter((node) => node.name === selectedTopLevel);
  }, [tree, selectedTopLevel]);

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (defaultExpandedDepth <= 0) return new Set();
    return new Set(tree.map((_, i) => String(i)));
  });

  const flatRows = useMemo(() => flattenVisible(visibleTree, expanded), [visibleTree, expanded]);

  function toggle(path: string) {
    setExpanded((current) => {
      const next = new Set(current);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  function formatValue(value: number, format: MetricColumn["format"]) {
    if (format === "currency") return formatCurrencyNoDecimal(value);
    if (format === "percentage") return formatPercentage(value);
    return formatNumber(value);
  }

  const exportColumns: ExportColumn[] = columns.map((c) => ({ key: c.key, label: c.label }));

  function handleExport(kind: "csv" | "xlsx") {
    const filename = selectedTopLevel ? `${exportFilename}-${selectedTopLevel}` : exportFilename;
    if (kind === "csv") {
      downloadPivotTreeCsv(visibleTree, exportColumns, rootLabel, filename);
    } else {
      downloadPivotTreeXlsx(visibleTree, exportColumns, rootLabel, filename);
    }
  }

  const metricsWidth = columns.length * METRIC_COL_WIDTH;
  const containerFillWidth = Math.max(MIN_NAME_COL_WIDTH, containerWidth - metricsWidth);

  // Re-measured whenever the set of visible rows changes (i.e. every
  // expand/collapse), so newly-revealed long child names immediately
  // widen the column instead of being truncated until someone notices
  // and drags manually.
  const contentWidth = useMemo(() => {
    const measured = longestVisibleNameWidth(flatRows);
    return Math.min(MAX_NAME_COL_WIDTH, Math.max(MIN_NAME_COL_WIDTH, measured));
  }, [flatRows]);

  const autoNameColWidth = Math.max(containerFillWidth, contentWidth);
  const autoNameColWidthRef = useRef(autoNameColWidth);
  autoNameColWidthRef.current = autoNameColWidth;

  const nameColWidth = manualNameColWidth ?? autoNameColWidth;
  const totalWidth = nameColWidth + metricsWidth;
  const template = `${nameColWidth}px repeat(${columns.length}, ${METRIC_COL_WIDTH}px)`;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startWidth = manualNameColWidth ?? autoNameColWidthRef.current;
      resizeStateRef.current = { startX: e.clientX, startWidth };

      function onMouseMove(moveEvent: MouseEvent) {
        if (!resizeStateRef.current) return;
        const delta = moveEvent.clientX - resizeStateRef.current.startX;
        const next = Math.min(
          MAX_NAME_COL_WIDTH,
          Math.max(MIN_NAME_COL_WIDTH, resizeStateRef.current.startWidth + delta)
        );
        setManualNameColWidth(next);
      }
      function onMouseUp() {
        resizeStateRef.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [manualNameColWidth]
  );

  const rowProps = useMemo<TreeRowProps>(
    () => ({ flatRows, expanded, toggle, columns, template, formatValue }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flatRows, expanded, columns, template]
  );

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-sm text-slate-400">
        No data for this date range.
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {(enableTopLevelFilter || enableExport) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          {enableTopLevelFilter ? (
            <select
              value={selectedTopLevel ?? ""}
              onChange={(e) => setSelectedTopLevel(e.target.value || null)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-[#1a2b3c] focus:outline-none"
            >
              <option value="">All {rootLabel.toLowerCase()}s</option>
              {tree.map((node) => (
                <option key={node.name} value={node.name}>
                  {node.name}
                </option>
              ))}
            </select>
          ) : (
            <div />
          )}

          {enableExport && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport("csv")}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Download className="size-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport("xlsx")}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Download className="size-3.5" /> Excel
              </button>
            </div>
          )}
        </div>
      )}

      {visibleTree.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-sm text-slate-400">No match for this filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ width: totalWidth }}>
            <div
              style={{ gridTemplateColumns: template }}
              className="relative grid border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"
            >
              <div className="relative px-5 py-3 font-medium">
                {rootLabel}
                <div
                  onMouseDown={handleResizeStart}
                  className="group absolute right-0 top-0 flex h-full w-3 -translate-x-1/2 cursor-col-resize items-center justify-center"
                  style={{ height: LIST_HEIGHT + 48 }}
                >
                  <GripVertical className="size-3 text-transparent group-hover:text-slate-400" />
                </div>
              </div>
              {columns.map((column) => (
                <div key={column.key} className="px-4 py-3 text-right font-medium">
                  {column.label}
                </div>
              ))}
            </div>
            <List
              rowComponent={TreeRow}
              rowCount={flatRows.length}
              rowHeight={ROW_HEIGHT}
              rowProps={rowProps}
              style={{
                height: Math.min(LIST_HEIGHT, flatRows.length * ROW_HEIGHT),
                overflowX: "hidden",
                width: totalWidth,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}