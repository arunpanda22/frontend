"use client";

/**
 * Keyword table inside an opened campaign card on the Flipkart Keywords page.
 * Flipkart counterpart of Amazon's SQPTableV2 ("Search Query Performance"), with the keyword in place of the search
 * query and the campaign baseline in place of the market columns.
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordTable.tsx
 *
 * Data: GET keywords/table/ through useKeywordTable. Search, classification filter, sorting and paging all happen on
 * the SERVER (a campaign can hold hundreds of keyword rows), so changing any of them sends a new request. The previous
 * page stays on screen (dimmed) while the next one loads. Changing the search or a filter goes back to page 1.
 *
 * COLOURS
 * CTR, CVR and ROAS are green when the row is at or above the baseline (ctr_beats_baseline etc. from the API) and red
 * when below, like the "beats market" colours on the Amazon table. The baseline here is the CAMPAIGN's own totals, shown
 * above the table. The status column is the winner / inefficient / wasted / low data classification.
 *
 * NOT-ATTRIBUTED ROW
 * The API returns one row with keyword "" (is_unattributed) for impressions not attributed to any targeted keyword.
 * It is real spend, so it is listed, with a label instead of text.
 */
import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import { useKeywordTable } from "@/lib/hooks/queries/use-flipkart-keywords";
import type {
  KeywordClassification,
  KeywordTableSort,
  SortOrder,
} from "@/lib/api/services/flipkart-keywords.service";
import {
  CLASSIFICATION_META,
  formatCount,
  formatMoney,
  formatPercent,
  formatRoas,
} from "../utils/keywordFormat";

interface FlipkartKeywordTableProps {
  startDate: string;
  endDate: string;
  adsTenant?: string;
  campaignId: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const COLUMNS: { sort: KeywordTableSort; label: string; align: "left" | "right" }[] = [
  { sort: "keyword", label: "Keyword", align: "left" },
  { sort: "impressions", label: "Impr.", align: "right" },
  { sort: "clicks", label: "Clicks", align: "right" },
  { sort: "ctr", label: "CTR", align: "right" },
  { sort: "spend", label: "Spend", align: "right" },
  { sort: "cpc", label: "CPC", align: "right" },
  { sort: "units", label: "Units", align: "right" },
  { sort: "cvr", label: "CVR", align: "right" },
  { sort: "revenue", label: "Revenue", align: "right" },
  { sort: "roas", label: "ROAS", align: "right" },
  { sort: "acos", label: "ACOS", align: "right" },
];

const CLASSIFICATION_OPTIONS: KeywordClassification[] = ["winner", "inefficient", "wasted", "low_data"];

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return <ChevronUp className="w-3 h-3 text-gray-300" />;
  return order === "asc" ? (
    <ChevronUp className="w-3 h-3 text-blue-600" />
  ) : (
    <ChevronDown className="w-3 h-3 text-blue-600" />
  );
}

const goodOrBad = (beats: boolean) => (beats ? "text-emerald-600" : "text-red-500");

export default function FlipkartKeywordTable({
  startDate,
  endDate,
  adsTenant,
  campaignId,
}: FlipkartKeywordTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState<KeywordClassification | "">("");
  const [sort, setSort] = useState<KeywordTableSort>("spend");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce the search box so typing does not send one request per key stroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } = useKeywordTable({
    start_date: startDate,
    end_date: endDate,
    ads_tenant: adsTenant,
    campaign_id: campaignId,
    search: search || undefined,
    classification: classification || undefined,
    sort,
    order,
    page,
    page_size: pageSize,
  });

  const handleSort = (column: KeywordTableSort) => {
    if (sort === column) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSort(column);
      setOrder(column === "keyword" ? "asc" : "desc");
    }
    setPage(1);
  };

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-sm font-semibold text-red-500">Failed to load the keywords</p>
        <p className="text-xs text-gray-400 mt-1">{(error as Error | null)?.message ?? "Please try again later"}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const pagination = data?.pagination;
  const totalRows = pagination?.total_rows ?? 0;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);
  const startRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRows);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar: search, classification filter, baseline */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter keywords..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50
                         focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 text-gray-700"
            />
          </div>
          <select
            value={classification}
            onChange={(event) => {
              setClassification(event.target.value as KeywordClassification | "");
              setPage(1);
            }}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700
                       focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
          >
            <option value="">All keywords</option>
            {CLASSIFICATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {CLASSIFICATION_META[option].label}
              </option>
            ))}
          </select>
        </div>

        {data && (
          <p className="text-xs text-gray-400">
            Campaign baseline: CTR {formatPercent(data.baseline.CTR)} · CVR {formatPercent(data.baseline.CVR)} · ROAS{" "}
            {formatRoas(data.baseline.ROAS)}
          </p>
        )}
      </div>

      {/* Table */}
      <div className={`overflow-x-auto rounded-lg border border-gray-100 ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {COLUMNS.map((column) => (
                <th
                  key={column.sort}
                  onClick={() => handleSort(column.sort)}
                  className={`px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none
                              whitespace-nowrap hover:text-gray-700 transition-colors ${
                                column.align === "right" ? "text-right" : "text-left"
                              }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.align === "right" && <SortIcon active={sort === column.sort} order={order} />}
                    {column.label}
                    {column.align === "left" && <SortIcon active={sort === column.sort} order={order} />}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-right whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="text-center py-8 text-gray-400">
                  Loading keywords...
                </td>
              </tr>
            )}

            {!isLoading && data && data.keywords.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="text-center py-8 text-gray-400">
                  No keywords found{search || classification ? " for these filters" : ""}.
                </td>
              </tr>
            )}

            {data?.keywords.map((row) => {
              const meta = CLASSIFICATION_META[row.classification];
              return (
                <tr
                  key={`${row.keyword}|${row.match_type}`}
                  className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-3 py-2.5 max-w-[260px]">
                    {row.is_unattributed ? (
                      <span className="italic text-gray-400">Not attributed to a keyword</span>
                    ) : (
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-800 truncate" title={row.keyword}>
                          {row.keyword}
                        </span>
                        {row.match_type && (
                          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                            {row.match_type}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatCount(row.Impressions)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatCount(row.Clicks)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${goodOrBad(row.ctr_beats_baseline)}`}>
                    {formatPercent(row.CTR)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatMoney(row.Spend)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatMoney(row.CPC, 2)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatCount(row.Units)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${goodOrBad(row.cvr_beats_baseline)}`}>
                    {formatPercent(row.CVR)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatMoney(row.Revenue)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${goodOrBad(row.roas_beats_baseline)}`}>
                    {formatRoas(row.ROAS)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-400">{formatPercent(row.ACOS)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}
                      title={meta.description}
                    >
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-gray-400">
            {totalRows === 0 ? "No results" : `${startRow}–${endRow} of ${formatCount(totalRows)} keywords`}
            {data?.truncated && " (top keywords by spend only)"}
          </span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700
                           focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-gray-500 px-1">
                Page {Math.min(page, totalPages)} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}