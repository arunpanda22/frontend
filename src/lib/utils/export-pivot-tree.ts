// lib/utils/export-pivot-tree.ts
import * as XLSX from "xlsx";
import type { PivotMetrics, PivotTotals, PivotTreeNode } from "@/lib/hooks/queries/use-pivot-reports";

export interface ExportColumn {
  key: keyof PivotMetrics;
  label: string;
}

const GRAND_TOTAL_LABEL = "Grand Total";

/**
 * Comparison is "on" iff nodes carry metrics.previous (the backend omits it entirely when
 * comparison is off). Previous columns are exported only in that case.
 */
function hasComparison(tree: PivotTreeNode[], totals?: PivotTotals): boolean {
  return totals?.previous !== undefined || tree.some((n) => n.metrics.previous !== undefined);
}

function metricCells(
  columns: ExportColumn[],
  current: PivotMetrics,
  previous: PivotMetrics | undefined,
  includePrevious: boolean
): (string | number)[] {
  return columns.flatMap((c) => {
    const cur = current[c.key] ?? "";
    return includePrevious ? [cur, previous?.[c.key] ?? ""] : [cur];
  });
}

function metricHeaders(columns: ExportColumn[], includePrevious: boolean): string[] {
  return columns.flatMap((c) =>
    includePrevious ? [`${c.label} (Current)`, `${c.label} (Previous)`] : [c.label]
  );
}

// ---- CSV export: padded "Level N" columns (grouping/outlining is Excel-only) ----

function flattenTreePadded(
  tree: PivotTreeNode[],
  columns: ExportColumn[],
  rootLabel: string,
  totals?: PivotTotals
): { headers: string[]; rows: (string | number)[][] } {
  const includePrevious = hasComparison(tree, totals);
  let maxDepth = 0;
  const entries: { path: string[]; metrics: (string | number)[] }[] = [];

  if (totals) {
    entries.push({
      path: [GRAND_TOTAL_LABEL],
      metrics: metricCells(columns, totals.current, totals.previous, includePrevious),
    });
  }

  function visit(node: PivotTreeNode, depth: number, ancestorPath: string[]) {
    maxDepth = Math.max(maxDepth, depth);
    const path = [...ancestorPath];
    path[depth] = node.name;
    entries.push({
      path,
      metrics: metricCells(columns, node.metrics.current, node.metrics.previous, includePrevious),
    });
    node.children?.forEach((child) => visit(child, depth + 1, path));
  }
  tree.forEach((node) => visit(node, 0, []));

  const rows = entries.map(({ path, metrics }) => {
    const padded = [...path];
    while (padded.length <= maxDepth) padded.push("");
    return [...padded, ...metrics];
  });

  const levelHeaders = Array.from({ length: maxDepth + 1 }, (_, i) =>
    i === 0 ? rootLabel : `Level ${i + 1}`
  );
  return { headers: [...levelHeaders, ...metricHeaders(columns, includePrevious)], rows };
}

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadPivotTreeCsv(
  tree: PivotTreeNode[],
  columns: ExportColumn[],
  rootLabel: string,
  filename: string,
  totals?: PivotTotals
) {
  const { headers, rows } = flattenTreePadded(tree, columns, rootLabel, totals);
  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

// ---- XLSX export: one row per node, indented, with real Excel outline grouping so the
// sheet opens with only top-level rows visible (matches the app's collapsed tree). ----

interface FlatXlsxRow {
  depth: number;
  name: string;
  current: PivotMetrics;
  previous?: PivotMetrics;
}

function flattenTreeForXlsx(tree: PivotTreeNode[]): FlatXlsxRow[] {
  const rows: FlatXlsxRow[] = [];
  function visit(node: PivotTreeNode, depth: number) {
    rows.push({ depth, name: node.name, current: node.metrics.current, previous: node.metrics.previous });
    node.children?.forEach((child) => visit(child, depth + 1));
  }
  tree.forEach((node) => visit(node, 0));
  return rows;
}

export function downloadPivotTreeXlsx(
  tree: PivotTreeNode[],
  columns: ExportColumn[],
  rootLabel: string,
  filename: string,
  totals?: PivotTotals
) {
  const flatRows = flattenTreeForXlsx(tree);
  const includePrevious = hasComparison(tree, totals);

  const aoa: (string | number)[][] = [[rootLabel, ...metricHeaders(columns, includePrevious)]];

  // Grand Total sits directly under the header (same position as the UI), ungrouped and visible.
  if (totals) {
    aoa.push([GRAND_TOTAL_LABEL, ...metricCells(columns, totals.current, totals.previous, includePrevious)]);
  }
  const dataStart = aoa.length; // first node row index in the sheet

  flatRows.forEach((row) => {
    // Leading spaces approximate tree indentation: Excel's outline +/- gutter does not
    // indent cell content, so without this a child row reads flush-left like its parent.
    const name = "  ".repeat(row.depth) + row.name;
    aoa.push([name, ...metricCells(columns, row.current, row.previous, includePrevious)]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 44 }];

  // Header (and Grand Total) rows get no outline level. Excel's outline limit is 7 levels;
  // this app's trees never exceed 3 (tag > target > campaign), so no clamping.
  ws["!rows"] = Array.from({ length: dataStart }, () => ({}));
  flatRows.forEach((row, i) => {
    // depth 0 gets level 0 (SheetJS omits the attribute: an ungrouped root row);
    // everything deeper starts collapsed/hidden like a collapsed pivot.
    ws["!rows"]![dataStart + i] = { level: row.depth, hidden: row.depth > 0 };
  });

  // { above: true }: the PARENT row is the visible summary sitting above its children.
  ws["!outline"] = { above: true };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}