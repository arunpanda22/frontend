// lib/utils/export-pivot-tree.ts
import * as XLSX from "xlsx";
import type { PivotMetrics, PivotTreeNode } from "@/lib/hooks/queries/use-pivot-reports";

export interface ExportColumn {
  key: keyof PivotMetrics;
  label: string;
}

// ---- CSV export: unchanged padded "Level N" column format ----
// (Grouping/outlining is an Excel-only concept — CSV has no equivalent,
// so this keeps its own flattening logic separate from the xlsx path.)

function flattenTreePadded(
  tree: PivotTreeNode[],
  columns: ExportColumn[],
  rootLabel: string
): { headers: string[]; rows: (string | number)[][] } {
  let maxDepth = 0;
  const rows: (string | number)[][] = [];

  function visit(node: PivotTreeNode, depth: number, ancestorPath: string[]) {
    maxDepth = Math.max(maxDepth, depth);
    const path = [...ancestorPath];
    path[depth] = node.name;

    const metricValues = columns.flatMap((col) => [
      node.metrics.current[col.key],
      node.metrics.previous?.[col.key] ?? "",
    ]);
    rows.push([...path, ...metricValues] as (string | number)[]);

    node.children?.forEach((child) => visit(child, depth + 1, path));
  }

  tree.forEach((node) => visit(node, 0, []));

  const paddedRows = rows.map((row) => {
    const pathLen = row.length - columns.length * 2;
    const path = row.slice(0, pathLen);
    const metrics = row.slice(pathLen);
    while (path.length <= maxDepth) path.push("");
    return [...path, ...metrics];
  });

  const levelHeaders = Array.from({ length: maxDepth + 1 }, (_, i) =>
    i === 0 ? rootLabel : `Level ${i + 1}`
  );
  const metricHeaders = columns.flatMap((col) => [`${col.label} (Current)`, `${col.label} (Previous)`]);

  return { headers: [...levelHeaders, ...metricHeaders], rows: paddedRows };
}

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadPivotTreeCsv(
  tree: PivotTreeNode[],
  columns: ExportColumn[],
  rootLabel: string,
  filename: string
) {
  const { headers, rows } = flattenTreePadded(tree, columns, rootLabel);
  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

// ---- XLSX export: one row per node, indented, with real Excel outline
// grouping so the sheet opens with only top-level rows visible and the
// +/- gutter controls let the user expand exactly like the app's tree,
// matching the original uploaded workbook's collapsed-pivot behavior. ----

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
  filename: string
) {
  const flatRows = flattenTreeForXlsx(tree);

  const headers = [rootLabel, ...columns.flatMap((c) => [`${c.label} (Current)`, `${c.label} (Previous)`])];
  const aoa: (string | number)[][] = [headers];

  flatRows.forEach((row) => {
    // Leading spaces approximate the tree's visual indentation, since
    // Excel's outline gutter controls (+/-) don't indent cell content —
    // without this, an expanded child row reads flush-left, identical
    // to its parent.
    const name = "  ".repeat(row.depth) + row.name;
    const metricValues = columns.flatMap((c) => [row.current[c.key], row.previous?.[c.key] ?? ""]);
    aoa.push([name, ...metricValues]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Row 0 is the header (no outline level). Data rows start at index 1.
  // Excel Web Query/Wire limit is 7 outline levels — this app's trees
  // never go that deep (max observed: 3, tag -> target -> campaign), so
  // no clamping is applied, but a much deeper future tree would need one.
  ws["!rows"] = [{}];
  flatRows.forEach((row, i) => {
    const rowIndex = i + 1;
    // depth 0 (top-level tag/date/etc.) gets no outlineLevel at all —
    // confirmed via testing that SheetJS omits the attribute for
    // level: 0, which is exactly the "ungrouped root row" Excel expects.
    // Everything below depth 0 starts collapsed (hidden) by default,
    // matching the original workbook's collapsed-pivot appearance.
    ws["!rows"]![rowIndex] = { level: row.depth, hidden: row.depth > 0 };
  });

  // { above: true } makes the PARENT row the visible "summary" that sits
  // above its (collapsible) children — matches this tree's layout, where
  // the tag/date row comes before its target/campaign children, not
  // after them as a trailing total.
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