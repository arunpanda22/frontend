// src/app/dashboard/market-funnel-insights/sqp-v2/components/SQPTableV2.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { SQPSearchQueryV2 } from "../types/sqp_v2.types";

interface SQPTableV2Props {
  data: SQPSearchQueryV2[];
}

type SortKey = keyof SQPSearchQueryV2;
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp className="w-3 h-3 text-gray-300" />;
  return dir === "asc" ? (
    <ChevronUp className="w-3 h-3 text-blue-600" />
  ) : (
    <ChevronDown className="w-3 h-3 text-blue-600" />
  );
}

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "search_query", label: "Search Term", align: "left" },
  { key: "asin_impression_count", label: "ASIN Impr.", align: "right" },
  { key: "total_impression_count", label: "Total Impr.", align: "right" },
  { key: "asin_click_count", label: "ASIN Clicks", align: "right" },
  { key: "total_click_count", label: "Total Clicks", align: "right" },
  { key: "asin_ctr", label: "ASIN CTR", align: "right" },
  { key: "market_ctr", label: "Mkt CTR", align: "right" },
  { key: "asin_purchase_count", label: "ASIN Purch.", align: "right" },
  { key: "total_purchase_count", label: "Total Purch.", align: "right" },
  { key: "asin_cvr", label: "ASIN CVR", align: "right" },
  { key: "market_cvr", label: "Mkt CVR", align: "right" },
  { key: "keyword_exists", label: "In Ads", align: "right" },
];

export default function SQPTableV2({ data }: SQPTableV2Props) {
  const [sortKey, setSortKey] = useState<SortKey>("asin_impression_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Reset to page 1 whenever filters/sort/pageSize change
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir, pageSize]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((row) => row.search_query.toLowerCase().includes(q));
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "boolean" && typeof bv === "boolean") {
        return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
      }
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const startRow = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(safePage * pageSize, sorted.length);

  // Page number list with ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  // Export the current filtered+sorted data to Excel
  const exportToExcel = useCallback(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => {
      const XLSX = (window as any).XLSX;
      const headers = COLUMNS.map((c) => c.label);
      const rows = sorted.map((row) => [
        row.search_query,
        row.asin_impression_count,
        row.total_impression_count,
        row.asin_click_count,
        row.total_click_count,
        row.asin_ctr,
        row.market_ctr,
        row.asin_purchase_count,
        row.total_purchase_count,
        row.asin_cvr,
        row.market_cvr,
        row.keyword_exists ? "Yes" : "No",
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SQP Data");
      XLSX.writeFile(wb, "sqp_search_queries.xlsx");
    };
    document.head.appendChild(script);
  }, [sorted]);

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No search query data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Top bar: search + export + page size selector */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50
                       focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 text-gray-700"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200
                       rounded-lg bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700
                         focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide cursor-pointer
                              select-none whitespace-nowrap hover:text-gray-700 transition-colors
                              ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.align === "right" && (
                      <SortIcon active={sortKey === col.key} dir={sortDir} />
                    )}
                    {col.label}
                    {col.align === "left" && (
                      <SortIcon active={sortKey === col.key} dir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px] truncate">
                  {row.search_query}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatNumber(row.asin_impression_count)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-400">
                  {formatNumber(row.total_impression_count)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatNumber(row.asin_click_count)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-400">
                  {formatNumber(row.total_click_count)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`font-semibold ${row.ctr_beats_market ? "text-emerald-600" : "text-red-500"}`}>
                    {row.asin_ctr.toFixed(2)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-400">
                  {row.market_ctr.toFixed(2)}%
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatNumber(row.asin_purchase_count)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-400">
                  {formatNumber(row.total_purchase_count)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`font-semibold ${row.cvr_beats_market ? "text-emerald-600" : "text-red-500"}`}>
                    {row.asin_cvr.toFixed(2)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-400">
                  {row.market_cvr.toFixed(2)}%
                </td>
                <td className="px-3 py-2.5 text-right">
                  {row.keyword_exists ? (
                    <span className="inline-flex items-center justify-end gap-1 text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Yes</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-end gap-1 text-gray-400">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>No</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {sorted.length === 0
              ? "No results"
              : `${startRow}–${endRow} of ${sorted.length} search terms`}
          </span>

          <div className="flex items-center gap-1">
            {/* First page */}
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              title="First page"
              className="px-1.5 py-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
            >
              «
            </button>

            {/* Prev page */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-gray-300 select-none">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[26px] h-[26px] rounded text-xs font-medium transition-colors
                              ${safePage === p
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                              }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Next page */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last page */}
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              title="Last page"
              className="px-1.5 py-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}