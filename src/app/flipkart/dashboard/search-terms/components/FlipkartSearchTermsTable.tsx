"use client";

/**
 * FlipkartSearchTermsTable: the server-paginated table of search terms.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/components/FlipkartSearchTermsTable.tsx
 *
 * WHY NOT AdvancedDataTable
 * That component sorts / filters / paginates the rows it is given, in the browser. A year of search terms can be
 * tens of thousands of rows, so this table asks the backend (GET /search-terms/) for ONE page at a time and lets
 * the backend search, filter by class, sort and paginate. The look follows SQPTableV2 (search box, sortable
 * headers, page-size select, numbered pagination footer).
 *
 * STATE
 *   Owned by the page (shared with other components): campaignId, minClicks, classification (also set by the
 *   classification chart), and the selected term (detail modal).
 *   Owned here: search text (debounced 400 ms), sort field + order, page, page size.
 *   The page number resets to 1 whenever anything that changes the result set changes.
 *
 * ROWS: search_term (click opens the detail modal) with a "keyword" badge when it already earned
 *   keyword-attributed traffic, class badge, campaigns count, Impressions, Clicks, CTR, CPC, Spend, Spend share,
 *   Units, CVR, Revenue, ROAS (green at or above the baseline ROAS, red below, grey when there are no units),
 *   ACOS. "Campaigns" and "Class" are not sortable (the backend has no sort key for them).
 *
 * LOADING: keepPreviousData is on in the hook, so while the next page loads the current rows stay visible and are
 *   dimmed (isPlaceholderData) instead of flashing a spinner on every click.
 */
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useFlipkartSearchTermsTable } from "@/lib/hooks/queries/use-flipkart-search-terms";
import {
  SEARCH_TERM_CLASSIFICATIONS,
  type FlipkartSearchTermRow,
  type SearchTermClassification,
  type SearchTermSortField,
  type SortOrder,
} from "@/lib/api/services/flipkart-search-terms.service";
import { CLASSIFICATION_META, useFlipkartFormatters } from "./flipkart-search-terms-utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 400;

interface FlipkartSearchTermsTableProps {
  adsTenant?: string;
  campaignId: string | null;
  minClicks: number;
  classification: SearchTermClassification | null;
  onClassificationChange: (classification: SearchTermClassification | null) => void;
  /** Called with the (lower-cased) term when a row is clicked. */
  onSelectTerm: (term: string) => void;
}

interface ColumnDefinition {
  key: string;
  label: string;
  /** Backend sort field. Undefined = not sortable. */
  sortField?: SearchTermSortField;
  align: "left" | "right";
}

const COLUMNS: ColumnDefinition[] = [
  { key: "search_term", label: "Search Term", sortField: "search_term", align: "left" },
  { key: "classification", label: "Class", align: "left" },
  { key: "campaign_count", label: "Campaigns", align: "right" },
  { key: "impressions", label: "Impr.", sortField: "impressions", align: "right" },
  { key: "clicks", label: "Clicks", sortField: "clicks", align: "right" },
  { key: "ctr", label: "CTR", sortField: "ctr", align: "right" },
  { key: "cpc", label: "CPC", sortField: "cpc", align: "right" },
  { key: "spend", label: "Spend", sortField: "spend", align: "right" },
  { key: "spend_share", label: "Spend %", sortField: "spend_share", align: "right" },
  { key: "units", label: "Units", sortField: "units", align: "right" },
  { key: "cvr", label: "CVR", sortField: "cvr", align: "right" },
  { key: "revenue", label: "Revenue", sortField: "revenue", align: "right" },
  { key: "roas", label: "ROAS", sortField: "roas", align: "right" },
  { key: "acos", label: "ACOS", sortField: "acos", align: "right" },
];

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return <ChevronUp className="w-3 h-3 text-gray-300" />;
  return order === "asc" ? (
    <ChevronUp className="w-3 h-3 text-blue-600" />
  ) : (
    <ChevronDown className="w-3 h-3 text-blue-600" />
  );
}

export default function FlipkartSearchTermsTable({
  adsTenant,
  campaignId,
  minClicks,
  classification,
  onClassificationChange,
  onSelectTerm,
}: FlipkartSearchTermsTableProps) {
  const { dateRange } = useDateRange();
  const format = useFlipkartFormatters();
  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SearchTermSortField>("spend");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce the search box: commit the text and go back to page 1 in the same update (one request).
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Anything that changes the result set from OUTSIDE this component (date range, campaign, min clicks, class)
  // sends the table back to page 1. Adjusting state during render is React's documented pattern for this.
  const resultSetKey = [startDate, endDate, adsTenant ?? "", campaignId ?? "", minClicks, classification ?? ""].join("|");
  const [previousKey, setPreviousKey] = useState(resultSetKey);
  if (previousKey !== resultSetKey) {
    setPreviousKey(resultSetKey);
    setPage(1);
  }

  const { data, isLoading, isError, error, isPlaceholderData } = useFlipkartSearchTermsTable(
    {
      start_date: startDate,
      end_date: endDate,
      ads_tenant: adsTenant,
      campaign_id: campaignId ?? undefined,
      min_clicks: minClicks,
      search: search || undefined,
      classification: classification ?? undefined,
      sort,
      order,
      page,
      page_size: pageSize,
    },
    !!(startDate && endDate)
  );

  const handleSort = (field: SearchTermSortField) => {
    if (sort === field) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder(field === "search_term" ? "asc" : "desc");
    }
    setPage(1);
  };

  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);
  const totalRows = pagination?.total_rows ?? 0;
  const startRow = totalRows === 0 ? 0 : ((pagination?.page ?? 1) - 1) * pageSize + 1;
  const endRow = Math.min((pagination?.page ?? 1) * pageSize, totalRows);

  // Page number list with ellipsis, e.g. 1 ... 4 5 6 ... 40
  const pageNumbers = useMemo(() => {
    const current = Math.min(page, totalPages);
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i);
      if (current < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  const roasClass = (row: FlipkartSearchTermRow, baseline: number): string => {
    if (row.Units === 0) return "text-gray-400";
    return row.ROAS >= baseline ? "text-emerald-600" : "text-red-500";
  };

  const renderCell = (column: ColumnDefinition, row: FlipkartSearchTermRow, baseline: number): React.ReactNode => {
    switch (column.key) {
      case "search_term":
        return (
          <span className="inline-flex items-center gap-2 max-w-[260px]">
            <button
              type="button"
              onClick={() => onSelectTerm(row.search_term)}
              className="truncate text-left font-medium text-blue-700 hover:underline"
              title="Open term details"
            >
              {row.search_term}
            </button>
            {row.already_targeted && (
              <span
                className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
                title="Already earned keyword-attributed traffic in this range"
              >
                keyword
              </span>
            )}
          </span>
        );
      case "classification": {
        const meta = CLASSIFICATION_META[row.classification];
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.badgeClass}`}
            title={meta.hint}
          >
            {meta.label}
          </span>
        );
      }
      case "campaign_count":
        return format.count(row.campaign_count);
      case "impressions":
        return format.count(row.Impressions);
      case "clicks":
        return format.count(row.Clicks);
      case "ctr":
        return format.percent(row.CTR);
      case "cpc":
        return format.money2(row.CPC);
      case "spend":
        return format.money(row.Spend);
      case "spend_share":
        return `${row.spend_share_pct.toFixed(2)}%`;
      case "units":
        return format.count(row.Units);
      case "cvr":
        return format.percent(row.CVR);
      case "revenue":
        return format.money(row.Revenue);
      case "roas":
        return <span className={`font-semibold ${roasClass(row, baseline)}`}>{format.roas(row.ROAS)}</span>;
      case "acos":
        return row.Revenue > 0 ? format.percent(row.ACOS) : "—";
      default:
        return null;
    }
  };

  const header = (
    <div className="p-4 border-b border-gray-100">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">Search Terms</h6>
        <div className="text-right">
          <div className="text-sm font-medium text-slate-700">
            {data ? `${format.count(totalRows)} terms` : ""}
            {data && classification ? ` · ${CLASSIFICATION_META[classification].label}` : ""}
          </div>
          <div className="text-xs text-slate-500">
            {startDate} to {endDate}
            {data ? ` · Baseline ROAS ${format.roas(data.baseline_roas)}` : ""}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-white shadow-lg flex flex-col">
      {header}

      {/* Toolbar: search, class filter, page size */}
      <div className="px-4 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search terms..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={100}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 text-gray-700"
            />
          </div>
          <select
            value={classification ?? ""}
            onChange={(e) => onClassificationChange((e.target.value || null) as SearchTermClassification | null)}
            aria-label="Filter by class"
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
          >
            <option value="">All classes</option>
            {SEARCH_TERM_CLASSIFICATIONS.map((value) => (
              <option key={value} value={value}>
                {CLASSIFICATION_META[value].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {isLoading || (!data && !isError) ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            <div className="w-5 h-5 mr-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Loading search terms...
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-red-500 font-semibold">Failed to load search terms</div>
            <div className="text-sm text-gray-500">{error?.message || "Unknown error occurred"}</div>
          </div>
        ) : data.search_terms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-gray-600">No search terms found</div>
            <div className="text-sm text-gray-500">
              {search || classification
                ? "Try clearing the search or the class filter"
                : "There are no search terms in the selected date range"}
            </div>
          </div>
        ) : (
          <div className={`overflow-x-auto rounded-lg border border-gray-100 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      onClick={column.sortField ? () => handleSort(column.sortField as SearchTermSortField) : undefined}
                      aria-sort={
                        column.sortField && sort === column.sortField
                          ? order === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      className={`px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide select-none whitespace-nowrap ${
                        column.sortField ? "cursor-pointer hover:text-gray-700" : ""
                      } ${column.align === "right" ? "text-right" : "text-left"}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {column.align === "right" && column.sortField && (
                          <SortIcon active={sort === column.sortField} order={order} />
                        )}
                        {column.label}
                        {column.align === "left" && column.sortField && (
                          <SortIcon active={sort === column.sortField} order={order} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.search_terms.map((row) => (
                  <tr key={row.search_term} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 py-2.5 text-gray-700 whitespace-nowrap ${
                          column.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {renderCell(column, row, data.baseline_roas)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination footer */}
            <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-400">
                {totalRows === 0
                  ? "No results"
                  : `${format.count(startRow)}–${format.count(endRow)} of ${format.count(totalRows)} terms`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  title="First page"
                  className="px-1.5 py-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  title="Previous page"
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {pageNumbers.map((p, index) =>
                  p === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-gray-300 select-none">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[26px] h-[26px] rounded text-xs font-medium transition-colors ${
                        page === p
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  title="Next page"
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  title="Last page"
                  className="px-1.5 py-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}

        {data?.truncated && (
          <p className="text-xs text-gray-500 mt-3">
            Only the highest-spend terms are listed: there are more distinct terms than the page can load. The summary
            totals above still cover all of them.
          </p>
        )}
        <p className="text-xs text-gray-400 mt-3">
          ROAS is green at or above the baseline and red below it. "keyword" marks terms that also earned
          keyword-attributed traffic in this range. Click a term to see its campaigns and daily trend.
        </p>
      </div>
    </div>
  );
}