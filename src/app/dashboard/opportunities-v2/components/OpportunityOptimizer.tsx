"use client";

import React, { useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useSQPOpportunities,
  useNgramOpportunities,
  useAsinSuggestOpportunities,
  useProductRecommendations,
  useCompetingAsins,
  useCompetiRankData,
  SQPSearchQuery,
  NgramKeyword,
  CompetiRankRecord,
  TopCompetitor,
  KeywordRecommendation,
  ProductRecommendation,
  useAllAsins,
} from "@/lib/hooks/use-opportunities";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";
import { SQPCampaignModal, type SQPCampaignRow } from "./sqp-campaign-modal";
import { useCampaignDefaults } from "@/lib/hooks/campaignCreationHooks";
import {
  TargetCampaignModal,
  type TargetKWRow,
  type TargetASINRow,
} from "./target-campaign-modal";
import { NgramVariantsModal } from "./ngram-actions-modal";
import { NgramNegateModal } from "./ngram-negate-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ASIN {
  id: string;
  name: string;
  imageUrl?: string;
  avgCtr: string;
  ctrDelta: string;
  avgCvr: string;
  cvrDelta: string;
}

type TabKey = "sqp" | "ngram" | "target" | "competitor";

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtPctFraction = (v: number) => `${(v * 100).toFixed(1)}%`;

// ─── Target ACOS parser ───────────────────────────────────────────────────────

function parseTargetAcos(raw?: string | number | null): number {
  if (raw == null) return 0.2;
  if (typeof raw === "number") return raw > 1 ? raw / 100 : raw;
  const n = parseFloat(String(raw).replace("%", "").trim());
  if (isNaN(n)) return 0.2;
  return n > 1 ? n / 100 : n;
}

// ─── N-gram helpers ───────────────────────────────────────────────────────────

function wordCount(kw: string): number {
  return kw.trim().split(/\s+/).length;
}

function ngramType(keyword: string): string {
  const n = wordCount(keyword);
  if (n === 1) return "unigram";
  if (n === 2) return "bigram";
  if (n === 3) return "trigram";
  return `${n}-gram`;
}

function isSubsetOf(child: string, parent: string): boolean {
  const childWords = child.toLowerCase().trim().split(/\s+/);
  const parentWords = new Set(parent.toLowerCase().trim().split(/\s+/));
  return childWords.every((w) => parentWords.has(w));
}

function isNegativeKeyword(k: NgramKeyword): boolean {
  return (
    k.Classification?.toLowerCase() === "negative" ||
    k.ACOS_Comment?.toLowerCase().includes("high")
  );
}

// ─── N-gram tree builder ──────────────────────────────────────────────────────

interface NgramTreeNode {
  keyword: NgramKeyword;
  children: NgramTreeNode[];
  depth: number;
}

function buildNgramTree(keywords: NgramKeyword[]): NgramTreeNode[] {
  const byN = new Map<number, NgramKeyword[]>();
  for (const kw of keywords) {
    const n = wordCount(kw.Keyword);
    const bucket = byN.get(n) ?? [];
    bucket.push(kw);
    byN.set(n, bucket);
  }
  const maxN = byN.size ? Math.max(...byN.keys()) : 0;
  if (maxN === 0) return [];

  const placed = new Set<string>();

  function buildNode(kw: NgramKeyword, depth: number): NgramTreeNode {
    const key = `${kw.ASIN}::${kw.Keyword}`;
    placed.add(key);
    const n = wordCount(kw.Keyword);
    const children = (byN.get(n - 1) ?? [])
      .filter((child) => isSubsetOf(child.Keyword, kw.Keyword))
      .map((child) => buildNode(child, depth + 1));
    return { keyword: kw, children, depth };
  }

  const roots: NgramTreeNode[] = [];
  for (let n = maxN; n >= 1; n--) {
    for (const kw of byN.get(n) ?? []) {
      if (!placed.has(`${kw.ASIN}::${kw.Keyword}`)) {
        roots.push(buildNode(kw, 0));
      }
    }
  }
  return roots;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const Badge: React.FC<{
  label: string;
  variant: "green" | "red" | "amber" | "blue" | "gray";
}> = ({ label, variant }) => {
  const styles: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    gray: "bg-gray-100 text-gray-500 border border-gray-200",
  };
  return (
    <span
      className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[variant]}`}
    >
      {label}
    </span>
  );
};

const TH: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <th
    className={`px-3 py-2 text-left text-[11px] font-medium text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap ${className}`}
  >
    {children}
  </th>
);

const TD: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ children, className = "", onClick }) => (
  <td
    onClick={onClick}
    className={`px-3 py-2 text-[12px] text-gray-700 border-b border-gray-50 ${className}`}
  >
    {children}
  </td>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  // Build page number buttons — show at most 5 around current
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
      <span className="text-[11px] text-gray-400">
        {start}–{end} of {totalItems.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="text-[11px] text-gray-400 px-1">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[24px] h-6 px-1.5 rounded text-[11px] font-medium transition-colors ${
                p === page
                  ? "bg-[#f5a623] text-white"
                  : "text-gray-500 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Reset to page 1 when items change
  const safePageRef = React.useRef(page);
  const safePage = Math.min(page, totalPages);
  if (safePageRef.current !== safePage) safePageRef.current = safePage;

  const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return {
    page: safePage,
    totalPages,
    paged,
    setPage,
    totalItems: items.length,
    pageSize,
  };
}

// ─── State helpers ────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="py-10 text-center text-sm text-gray-400">
    No data available for this ASIN
  </div>
);

const LoadingState = () => (
  <div className="py-10 text-center text-sm text-gray-400 animate-pulse">
    Loading…
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="py-10 text-center text-sm text-red-400">Error: {message}</div>
);

const FetchPrompt: React.FC<{ label: string; onFetch: () => void }> = ({
  label,
  onFetch,
}) => (
  <div className="py-8 text-center">
    <button
      onClick={onFetch}
      className="px-4 py-2 text-[12px] font-medium bg-[#f5a623] text-white rounded-lg hover:bg-[#e09010] transition-colors shadow-sm"
    >
      {label}
    </button>
  </div>
);

// ─── Checkbox ─────────────────────────────────────────────────────────────────

const Checkbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, indeterminate = false, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-3.5 h-3.5 rounded border-gray-300 text-[#f5a623] accent-[#f5a623] cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    />
  );
};

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

interface BulkAction {
  label: string;
  variant: "green" | "red" | "gray";
  onClick: () => void;
}

const BulkActionBar: React.FC<{
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onSelectAll: (checked: boolean) => void;
  onClear: () => void;
}> = ({ selectedCount, totalCount, actions, onSelectAll, onClear }) => {
  if (selectedCount === 0) return null;
  const variantStyles: Record<string, string> = {
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    red: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
    gray: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
  };
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-1 duration-150">
      <Checkbox
        checked={selectedCount === totalCount}
        indeterminate={selectedCount > 0 && selectedCount < totalCount}
        onChange={onSelectAll}
      />
      <span className="text-[11px] font-medium text-blue-700">
        {selectedCount} of {totalCount} selected
      </span>
      <div className="flex items-center gap-1.5 ml-1">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`text-[11px] px-2.5 py-1 rounded border transition-colors font-medium ${variantStyles[a.variant]}`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <button
        onClick={onClear}
        className="ml-auto text-[11px] text-blue-400 hover:text-blue-600 transition-colors"
      >
        Clear
      </button>
    </div>
  );
};

// ─── SQP row status type ──────────────────────────────────────────────────────

interface SQPRowStatus {
  status: "success" | "error" | "loading";
  campaignId?: string;
  error?: string;
}

// ─── SQP Table ────────────────────────────────────────────────────────────────

const SQPTable: React.FC<{
  asin: string;
  queries: SQPSearchQuery[];
  isLoading: boolean;
  error: Error | null;
}> = ({ asin, queries, isLoading, error }) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rowStatuses, setRowStatuses] = useState<Record<number, SQPRowStatus>>({});
  const [modal, setModal] = useState<SQPCampaignRow[] | null>(null);

  const { page, totalPages, paged, setPage, totalItems, pageSize } =
    usePagination(queries);

  const toggleRow = useCallback((i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const handleSelectAll = (checked: boolean) =>
    setSelected(checked ? new Set(queries.map((_, i) => i)) : new Set());

  const openSingle = (i: number) => setModal([{ index: i, query: queries[i] }]);

  const openBulk = () => {
    const rows: SQPCampaignRow[] = [...selected].map((i) => ({
      index: i,
      query: queries[i],
    }));
    setModal(rows);
  };

  const handleRowSuccess = useCallback((index: number, campaignId: string) => {
    setRowStatuses((prev) => ({
      ...prev,
      [index]: { status: "success", campaignId },
    }));
  }, []);

  const handleRowError = useCallback((index: number, err: string) => {
    setRowStatuses((prev) => ({
      ...prev,
      [index]: { status: "error", error: err },
    }));
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;
  if (!queries.length) return <EmptyState />;

  // Map paged items back to their original indices
  const pagedWithIndex = paged.map((q) => ({
    q,
    i: queries.indexOf(q),
  }));

  const sqpBulkActions: BulkAction[] = [
    { label: "+ Add to campaign", variant: "green", onClick: openBulk },
    { label: "Export", variant: "gray", onClick: () => {} },
  ];

  return (
    <div>
      {modal && (
        <SQPCampaignModal
          asin={asin}
          rows={modal}
          onClose={() => setModal(null)}
          onRowSuccess={handleRowSuccess}
          onRowError={handleRowError}
        />
      )}

      <BulkActionBar
        selectedCount={selected.size}
        totalCount={queries.length}
        actions={sqpBulkActions}
        onSelectAll={handleSelectAll}
        onClear={() => setSelected(new Set())}
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <TH className="w-8">
                <Checkbox
                  checked={selected.size === queries.length && queries.length > 0}
                  indeterminate={selected.size > 0 && selected.size < queries.length}
                  onChange={handleSelectAll}
                />
              </TH>
              <TH>Search term</TH>
              <TH>Search vol.</TH>
              <TH>Mkt impr.</TH>
              <TH>My impr.</TH>
              <TH>My CTR</TH>
              <TH>Mkt clicks</TH>
              <TH>My clicks</TH>
              <TH>My CVR</TH>
              <TH>Mkt CVR</TH>
              <TH>My purchases</TH>
              <TH>Mkt purchases</TH>
              <TH>Beats mkt</TH>
              <TH>Coverage</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </thead>
          <tbody>
            {pagedWithIndex.map(({ q, i }) => {
              const cvrGood = q["Conversion > Market"];
              const hasBroad = q.BROAD !== "doesn't exist";
              const hasPhrase = q.PHRASE !== "doesn't exist";
              const hasExact = q.EXACT !== "doesn't exist";
              const isSelected = selected.has(i);
              const rowStatus = rowStatuses[i];
              const isSuccess = rowStatus?.status === "success";
              const isErr = rowStatus?.status === "error";
              const myCtr =
                q.asin_impression_count > 0
                  ? (q.asin_click_count / q.asin_impression_count) * 100
                  : 0;

              const rowBg = isSelected
                ? "bg-blue-50 hover:bg-blue-100"
                : isSuccess
                  ? "bg-emerald-50 hover:bg-emerald-100"
                  : isErr
                    ? "bg-red-50/50 hover:bg-red-50"
                    : "hover:bg-gray-50";

              return (
                <tr
                  key={i}
                  onClick={() => toggleRow(i)}
                  className={`transition-colors cursor-pointer ${rowBg}`}
                >
                  <TD>
                    <Checkbox checked={isSelected} onChange={() => toggleRow(i)} />
                  </TD>
                  <TD>{q.search_query}</TD>
                  <TD className="font-mono">{(q.search_query_volume ?? 0).toLocaleString()}</TD>
                  <TD className="font-mono">{(q.total_query_impression_count ?? 0).toLocaleString()}</TD>
                  <TD className="font-mono">{(q.asin_impression_count ?? 0).toLocaleString()}</TD>
                  <TD className="font-mono font-medium text-gray-700">{myCtr.toFixed(1)}%</TD>
                  <TD className="font-mono">{q.total_click_count.toLocaleString()}</TD>
                  <TD className="font-mono">{q.asin_click_count.toLocaleString()}</TD>
                  <TD className={`font-mono font-medium ${cvrGood ? "text-emerald-600" : "text-red-500"}`}>
                    {fmtPct(q.asin_conversion)}
                  </TD>
                  <TD className="font-mono">{fmtPct(q.total_conversion)}</TD>
                  <TD className="font-mono">{q.asin_purchase_count}</TD>
                  <TD className="font-mono">{q.total_purchase_count}</TD>
                  <TD>
                    <Badge label={cvrGood ? "Yes" : "No"} variant={cvrGood ? "green" : "red"} />
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      {hasBroad && <Badge label="B" variant="blue" />}
                      {hasPhrase && <Badge label="P" variant="blue" />}
                      {hasExact && <Badge label="E" variant="blue" />}
                      {!hasBroad && !hasPhrase && !hasExact && <Badge label="None" variant="gray" />}
                    </div>
                  </TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    {isSuccess && (
                      <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3 shrink-0" /> Created
                      </span>
                    )}
                    {isErr && (
                      <span className="flex items-center gap-1 text-red-500 text-[10px] font-medium whitespace-nowrap" title={rowStatus.error}>
                        <AlertCircle className="h-3 w-3 shrink-0" /> Failed
                      </span>
                    )}
                    {rowStatus?.status === "loading" && (
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    )}
                  </TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    {isSuccess ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); openSingle(i); }}
                        className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                      >
                        + Campaign
                      </button>
                    )}
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
};

// ─── N-gram Tree Row (recursive) ──────────────────────────────────────────────

const NGRAM_PAGE_SIZE = 10;

// ─── N-gram Tree Row (recursive) ──────────────────────────────────────────────

const NgramTreeRow: React.FC<{
  node: NgramTreeNode;
  expandedKeys: Set<string>;
  selectedKeys: Set<string>;
  targetAcos: number;
  currencySymbol: string;
  onToggleExpand: (key: string) => void;
  onToggleSelect: (key: string) => void;
}> = ({
  node,
  expandedKeys,
  selectedKeys,
  targetAcos,
  currencySymbol,
  onToggleExpand,
  onToggleSelect,
}) => {
  const kw = node.keyword;
  const key = `${kw.ASIN}::${kw.Keyword}`;
  const isExpanded = expandedKeys.has(key);
  const isSelected = selectedKeys.has(key);
  const hasChildren = node.children.length > 0;
  const isLeaf = !hasChildren;
  const isNeg = isNegativeKeyword(kw);
  const fmtCurrency = (v: number) => `${currencySymbol}${v.toFixed(2)}`;

  const [showVariants, setShowVariants] = useState(false);
  const [showNegate, setShowNegate] = useState(false);

  const acosRaw =
    typeof kw.ACOS_Value === "number"
      ? kw.ACOS_Value
      : parseFloat(kw.ACOS_Value as string);
  const acosDisplay = isNaN(acosRaw) ? String(kw.ACOS_Value) : fmtPctFraction(acosRaw);
  const acosOverTarget = !isNaN(acosRaw) && acosRaw > targetAcos;
  const acosColor = acosOverTarget || isNeg ? "text-red-500" : "text-emerald-600";
  const type = ngramType(kw.Keyword);
  const indentPx = node.depth * 10;

  return (
    <>
      <tr
        onClick={() => onToggleSelect(key)}
        className={`transition-colors cursor-pointer ${
          isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
        }`}
      >
        <TD className="w-8">
          <Checkbox checked={isSelected} onChange={() => onToggleSelect(key)} />
        </TD>
        <TD>
          <div className="flex items-center" style={{ paddingLeft: `${indentPx}px` }}>
            {isLeaf ? (
              <span className="text-gray-300 text-[11px] mr-2 w-4 shrink-0 select-none font-mono leading-none">
                └
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(key); }}
                className="text-gray-400 text-[9px] mr-2 w-4 shrink-0 hover:text-gray-700 transition-colors leading-none"
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            <span className={`font-medium text-[12px] ${isLeaf ? "text-gray-500" : "text-gray-800"}`}>
              {kw.Keyword}
            </span>
          </div>
        </TD>
        <TD>
          <Badge label={type} variant={type === "unigram" ? "gray" : "blue"} />
        </TD>
        <TD>
          <Badge
            label={kw.match_type}
            variant={
              kw.match_type === "BMM" ? "blue"
              : kw.match_type === "Exact" ? "green"
              : kw.match_type === "Phrase" ? "amber"
              : "gray"
            }
          />
        </TD>
        <TD className={`font-mono font-medium ${acosColor}`}>{acosDisplay}</TD>
        <TD className="font-mono text-gray-400">{fmtPctFraction(targetAcos)}</TD>
        <TD className="font-mono">{fmtCurrency(kw.cost)}</TD>
        <TD className="font-mono">{kw.impressions}</TD>
        <TD className="font-mono">{kw.clicks}</TD>
        <TD className="font-mono">{fmtCurrency(kw.sales_30d)}</TD>
        <TD onClick={(e) => e.stopPropagation()}>
          {acosOverTarget || isNeg ? (
            <button
              onClick={() => setShowNegate(true)}
              className="text-[11px] px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
            >
              − Negate
            </button>
          ) : (
            <button
              onClick={() => setShowVariants(true)}
              className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
            >
              + Find Variants
            </button>
          )}
          {showVariants && (
            <NgramVariantsModal keyword={kw.Keyword} asin={kw.ASIN} onClose={() => setShowVariants(false)} />
          )}
          {showNegate && (
            <NgramNegateModal keyword={kw.Keyword} asin={kw.ASIN} onClose={() => setShowNegate(false)} />
          )}
        </TD>
      </tr>
      {hasChildren && isExpanded &&
        node.children.map((child) => (
          <NgramTreeRow
            key={`${child.keyword.ASIN}::${child.keyword.Keyword}`}
            node={child}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            targetAcos={targetAcos}
            currencySymbol={currencySymbol}
            onToggleExpand={onToggleExpand}
            onToggleSelect={onToggleSelect}
          />
        ))}
    </>
  );
};

const NgramSection: React.FC<{
  label: string;
  items: NgramKeyword[];
  sectionKey: string;
  collapsed: boolean;
  selectedKeys: Set<string>;
  targetAcos: number;
  currencySymbol: string;
  onToggleCollapse: () => void;
  onToggleSelect: (key: string) => void;
  onSelectAll: (checked: boolean) => void;
}> = ({
  label,
  items,
  sectionKey,
  collapsed,
  selectedKeys,
  targetAcos,
  currencySymbol,
  onToggleCollapse,
  onToggleSelect,
  onSelectAll,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const tree = React.useMemo(() => buildNgramTree(items), [items]);

  const { page, totalPages, paged: pagedRoots, setPage, totalItems, pageSize } =
    usePagination(tree, NGRAM_PAGE_SIZE);

  const allKeys = React.useMemo(() => {
    const keys: string[] = [];
    const walk = (nodes: NgramTreeNode[]) => {
      for (const n of nodes) {
        keys.push(`${n.keyword.ASIN}::${n.keyword.Keyword}`);
        walk(n.children);
      }
    };
    walk(tree);
    return keys;
  }, [tree]);

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const sectionSelectedCount = allKeys.filter((k) => selectedKeys.has(k)).length;

  const bulkActions: BulkAction[] = sectionKey === "positive"
    ? [{ label: "+ Find Variants", variant: "green", onClick: () => {} }]
    : [{ label: "− Negate selected", variant: "red", onClick: () => {} }];

  return (
    <>
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          {label}
          <span className="text-[10px] font-normal normal-case text-gray-400">
            ({items.length})
          </span>
        </span>
        <span className={`text-[9px] transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}>▶</span>
      </button>

      {!collapsed && (
        <>
          <BulkActionBar
            selectedCount={sectionSelectedCount}
            totalCount={allKeys.length}
            actions={bulkActions}
            onSelectAll={onSelectAll}
            onClear={() => onSelectAll(false)}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <TH className="w-8">
                    <Checkbox
                      checked={allKeys.length > 0 && sectionSelectedCount === allKeys.length}
                      indeterminate={sectionSelectedCount > 0 && sectionSelectedCount < allKeys.length}
                      onChange={onSelectAll}
                    />
                  </TH>
                  <TH>N-gram</TH>
                  <TH>Type</TH>
                  <TH>Match</TH>
                  <TH>ACOS</TH>
                  <TH>Target ACOS</TH>
                  <TH>Spend</TH>
                  <TH>Impressions</TH>
                  <TH>Clicks</TH>
                  <TH>Sales</TH>
                  <TH>Action</TH>
                </tr>
              </thead>
              <tbody>
                {pagedRoots.map((node) => (
                  <NgramTreeRow
                    key={`${node.keyword.ASIN}::${node.keyword.Keyword}`}
                    node={node}
                    expandedKeys={expandedKeys}
                    selectedKeys={selectedKeys}
                    targetAcos={targetAcos}
                    currencySymbol={currencySymbol}
                    onToggleExpand={toggleExpand}
                    onToggleSelect={onToggleSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => {
              setPage(p);
              setExpandedKeys(new Set()); // collapse all when navigating pages
            }}
          />
        </>
      )}
    </>
  );
};

// ─── N-gram Table (now self-contained per ASIN) ───────────────────────────────

const NgramTable: React.FC<{
  asin: string;
  targetAcos: number;
  currencySymbol: string;
}> = ({ asin, targetAcos, currencySymbol }) => {
  const ngramQuery = useNgramOpportunities(asin);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // NO useEffect — fetch is triggered only when the user opens this card

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  // Not yet fetched — show button
  if (!ngramQuery.isEnabled) {
    return <FetchPrompt label="Load N-gram analysis" onFetch={ngramQuery.fetchData} />;
  }

  if (ngramQuery.isLoading) return <LoadingState />;
  if (ngramQuery.error) return <ErrorState message={ngramQuery.error.message} />;

  const items = ngramQuery.data?.items ?? [];
  const summary = ngramQuery.data?.summary;

  if (!items.length) return <EmptyState />;

  const positiveItems = items.filter((k) => k.keyword_type === "positive");
  const negativeItems = items.filter((k) => k.keyword_type === "negative");

  const sections = [
    { key: "positive", label: "Positive keywords", items: positiveItems },
    { key: "negative", label: "Negative keywords", items: negativeItems },
  ] as const;

  return (
    <div>
      {summary && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex-wrap">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Summary:</span>
          <Badge label={`${summary.positive_count} positive`} variant="green" />
          <Badge label={`${summary.negative_count} negative`} variant="red" />
          {summary.positive_bmm_count > 0 && (
            <Badge label={`${summary.positive_bmm_count} BMM`} variant="blue" />
          )}
          {summary.positive_exact_count > 0 && (
            <Badge label={`${summary.positive_exact_count} exact+`} variant="blue" />
          )}
        </div>
      )}

      {sections.map(({ key, label, items: sectionItems }) => (
        <NgramSection
          key={key}
          label={label}
          items={sectionItems}
          sectionKey={key}
          collapsed={collapsedSections.has(key)}
          selectedKeys={selectedKeys}
          targetAcos={targetAcos}
          currencySymbol={currencySymbol}
          onToggleCollapse={() => toggleSection(key)}
          onToggleSelect={toggleSelect}
          onSelectAll={(checked) => {
            const sectionKeys = sectionItems.map((k) => `${k.ASIN}::${k.Keyword}`);
            setSelectedKeys((prev) => {
              const next = new Set(prev);
              if (checked) sectionKeys.forEach((k) => next.add(k));
              else sectionKeys.forEach((k) => next.delete(k));
              return next;
            });
          }}
        />
      ))}
    </div>
  );
};

interface TargetRowStatus {
  status: "success" | "error" | "loading";
  campaignId?: string;
  error?: string;
}

interface TargetModalState {
  mode: "keyword" | "product";
  kwRows?: TargetKWRow[];
  asinRows?: TargetASINRow[];
}

const MARKETPLACE_DOMAINS: Record<string, string> = {
  ATVPDKIKX0DER: "amazon.com",
  A1F83G8C2ARO7P: "amazon.co.uk",
  A1PA6795UKMFR9: "amazon.de",
  A13V1IB3VIYZZH: "amazon.fr",
  APJ6JRA9NG5V4: "amazon.it",
  A1RKKUPIHCS9HS: "amazon.es",
  A1AM78C64UM0Y8: "amazon.com.mx",
  A2EUQ1WTGCTBG2: "amazon.ca",
  A39IBJ37TRP1C6: "amazon.com.au",
  A21TJRUUN4KGV: "amazon.in",
};

// ─── Paginated ASIN section (reusable for Target + Competitor) ────────────────

const PaginatedAsinSection: React.FC<{
  items: { asin: string; rec: ProductRecommendation }[]; 
  sectionKey: string;
  label: string;
  collapsed: boolean;
  selectedAsins: Record<string, Set<number>>;
  asinStatuses: Record<string, TargetRowStatus>;
  amazonDomain: string;
  onToggleSection: () => void;
  onToggleAsin: (i: number) => void;
  onSelectAll: (checked: boolean) => void;
  onOpenSingle: (i: number, asin: string) => void;
  onOpenBulk: () => void;
}> = ({
  items,
  sectionKey,
  label,
  collapsed,
  selectedAsins,
  asinStatuses,
  amazonDomain,
  onToggleSection,
  onToggleAsin,
  onSelectAll,
  onOpenSingle,
  onOpenBulk,
}) => {
  const { page, totalPages, paged, setPage, totalItems, pageSize } =
    usePagination(items);

  const selected = selectedAsins[sectionKey] ?? new Set<number>();

  const asinBulkActions: BulkAction[] = [
    { label: "+ Add targets", variant: "green", onClick: onOpenBulk },
  ];

  // Map paged items back to their original indices
  const pagedWithIndex = paged.map((item) => ({
    item,
    i: items.indexOf(item),
  }));

  return (
    <>
      <button
        onClick={onToggleSection}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100 hover:bg-gray-100 transition-colors"
      >
        {label}
        <span className={`text-[9px] transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}>▶</span>
      </button>
      {!collapsed && (
        <>
          <BulkActionBar
            selectedCount={selected.size}
            totalCount={items.length}
            actions={asinBulkActions}
            onSelectAll={onSelectAll}
            onClear={() => onSelectAll(false)}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <TH className="w-8">
                    <Checkbox
                      checked={selected.size === items.length && items.length > 0}
                      indeterminate={selected.size > 0 && selected.size < items.length}
                      onChange={onSelectAll}
                    />
                  </TH>
                  <TH>ASIN</TH>
                  <TH>Targeting</TH>  
                  <TH>In campaigns</TH>
                  <TH>Status</TH>
                  <TH />
                </tr>
              </thead>
              <tbody>
                {pagedWithIndex.map(({ item, i }) => {
                  const { asin, rec } = item;
                  const isSel = selected.has(i);
                  const statusKey = `${sectionKey}::${i}`;
                  const rowStatus = asinStatuses[statusKey];
                  const isSuccess = rowStatus?.status === "success";
                  const isErr     = rowStatus?.status === "error";
                  const hasExact    = rec.Exact    !== "doesn't exist";
                  const hasExpanded = rec.Expanded !== "doesn't exist";



                  const rowBg = isSel ? "bg-blue-50 hover:bg-blue-100"
                    : isSuccess ? "bg-emerald-50 hover:bg-emerald-100"
                    : isErr     ? "bg-red-50/50 hover:bg-red-50"
                    : "hover:bg-gray-50";

                  return (
                    <tr key={i} onClick={() => onToggleAsin(i)} className={`transition-colors cursor-pointer ${rowBg}`}>
                      <TD><Checkbox checked={isSel} onChange={() => onToggleAsin(i)} /></TD>
                      <TD onClick={(e) => e.stopPropagation()}>
                        <a href={`https://www.${amazonDomain}/d/${asin}`} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                          {asin}
                          <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4.5 3H3a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V7.5M7 2h3m0 0v3m0-3L5 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </TD>

                      {/* ── Targeting ───────────────────────────────────── */}
                      <TD>
                        <div className="flex gap-1">
                          {hasExact    && <Badge label="Exact"    variant="blue" />}
                          {hasExpanded && <Badge label="Expanded" variant="amber" />}
                          {!hasExact && !hasExpanded && <Badge label="None" variant="gray" />}
                        </div>
                      </TD>
                      {/* ── In campaigns ────────────────────────────────── */}
                      <TD>
                        <Badge
                          label={rec.keyword_exists ? "Exists" : "New"}
                          variant={rec.keyword_exists ? "amber" : "green"}
                        />
                      </TD>

                      <TD onClick={(e) => e.stopPropagation()}>
                        {isSuccess && <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium whitespace-nowrap"><CheckCircle2 className="h-3 w-3 shrink-0" /> Created</span>}
                        {isErr     && <span className="flex items-center gap-1 text-red-500 text-[10px] font-medium whitespace-nowrap" title={rowStatus.error}><AlertCircle className="h-3 w-3 shrink-0" /> Failed</span>}
                      </TD>
                      <TD onClick={(e) => e.stopPropagation()}>
                        {isSuccess
                          ? <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium whitespace-nowrap"><CheckCircle2 className="h-3 w-3" /> Done</span>
                          : <button onClick={(e) => { e.stopPropagation(); onOpenSingle(i, asin); }}
                              className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap">
                              + Add target
                            </button>
                        }
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );
};

// ─── TargetContent ────────────────────────────────────────────────────────────

const TargetContent: React.FC<{ asinId: string; currencySymbol: string }> = ({
  asinId,
  currencySymbol,
}) => {
  const fmtCurrency = (v: number | undefined | null) =>
    `${currencySymbol}${(v ?? 0).toFixed(2)}`;
  const { data: userProfile } = useUserProfile();

  const activeProfile =
    userProfile?.connected_advertising_profiles?.find((p) => p.is_active) ??
    userProfile?.connected_advertising_profiles?.[0];
  const amazonDomain =
    MARKETPLACE_DOMAINS[activeProfile?.marketplace_id ?? ""] ?? "amazon.com";

  const asinSuggest = useAsinSuggestOpportunities(asinId);
  const productRec = useProductRecommendations(asinId);

  const [selectedKw, setSelectedKw] = useState<Set<number>>(new Set());
  const [selectedAsins, setSelectedAsins] = useState<Record<string, Set<number>>>({});
  const [kwStatuses, setKwStatuses] = useState<Record<number, TargetRowStatus>>({});
  const [asinStatuses, setAsinStatuses] = useState<Record<string, TargetRowStatus>>({});
  const [modal, setModal] = useState<TargetModalState | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const handleRowSuccess = useCallback(
    (index: number, category: string | null, campaignId: string) => {
      if (category === null) {
        setKwStatuses((prev) => ({ ...prev, [index]: { status: "success", campaignId } }));
      } else {
        setAsinStatuses((prev) => ({ ...prev, [`${category}::${index}`]: { status: "success", campaignId } }));
      }
    },
    []
  );

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleRowError = useCallback(
    (index: number, category: string | null, error: string) => {
      if (category === null) {
        setKwStatuses((prev) => ({ ...prev, [index]: { status: "error", error } }));
      } else {
        setAsinStatuses((prev) => ({ ...prev, [`${category}::${index}`]: { status: "error", error } }));
      }
    },
    []
  );

  const toggleKw = useCallback((i: number) => {
    setSelectedKw((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const hasFetched = asinSuggest.isEnabled;
  const isLoading = asinSuggest.isLoading || productRec.isLoading;

  const handleFetch = () => {
    asinSuggest.fetchData();
    productRec.fetchData();
  };

  if (!hasFetched)
    return <FetchPrompt label="Load recommendations" onFetch={handleFetch} />;
  if (isLoading) return <LoadingState />;
  if (asinSuggest.error) return <ErrorState message={asinSuggest.error.message} />;

  const rawKeywords = asinSuggest.data?.keywords ?? [];
  const keywords: KeywordRecommendation[] = rawKeywords.map((k) => {
    if (k.keyword && typeof k.keyword === "object") {
      return {
        ...(k.keyword as unknown as KeywordRecommendation),
        // Preserve the top-level campaign coverage fields
        BROAD: k.BROAD,
        PHRASE: k.PHRASE,
        EXACT: k.EXACT,
        keyword_exists: k.keyword_exists,
      };
    }
    return k;
  });
  const recs = productRec.data?.recommendations ?? [];

  const topConverting   = recs.filter((r) => r["Top converting targets"])
    .map((r) => ({ asin: r["Top converting targets"]!, rec: r }));
  const lowRatings      = recs.filter((r) => r["Similar items with low ratings and reviews"])
    .map((r) => ({ asin: r["Similar items with low ratings and reviews"]!, rec: r }));
  const frequentlyViewed = recs.filter((r) => r["Similar items (frequently viewed together)"])
    .map((r) => ({ asin: r["Similar items (frequently viewed together)"]!, rec: r }));

  const hasAnything = keywords.length || topConverting.length || lowRatings.length || frequentlyViewed.length;
  if (!hasAnything) return <EmptyState />;

  const openSingleKW = (i: number) =>
    setModal({ mode: "keyword", kwRows: [{ index: i, keyword: keywords[i] }] });

  const openBulkKW = () => {
    const rows: TargetKWRow[] = [...selectedKw].map((i) => ({ index: i, keyword: keywords[i] }));
    setModal({ mode: "keyword", kwRows: rows });
  };

  const openSingleASIN = (category: string, i: number, asin: string) =>
    setModal({ mode: "product", asinRows: [{ index: i, asin, category }] });

  const openBulkASIN = (category: string, items: { asin: string; rec: ProductRecommendation }[]) => {
    const rows: TargetASINRow[] = [...(selectedAsins[category] ?? new Set())].map((i) => ({
      index: i,
      asin: items[i].asin,
      category,
    }));
    setModal({ mode: "product", asinRows: rows });
  };

  const kwBulkActions: BulkAction[] = [
    { label: "+ Add targets", variant: "green", onClick: openBulkKW },
    { label: "Export", variant: "gray", onClick: () => {} },
  ];

  const asinSections = [
    { label: "Top converting targets",               items: topConverting,    key: "top" },
    { label: "Similar items with low ratings",        items: lowRatings,       key: "low" },
    { label: "Frequently viewed together",            items: frequentlyViewed, key: "fvt" },
  ] as const;

  return (
    <div>
      {modal && (
        <TargetCampaignModal
          asin={asinId}
          mode={modal.mode}
          kwRows={modal.kwRows}
          asinRows={modal.asinRows}
          onClose={() => setModal(null)}
          onRowSuccess={handleRowSuccess}
          onRowError={handleRowError}
        />
      )}

      {/* ── Keyword suggestions ──────────────────────────────────────────── */}
      {keywords.length > 0 && (
        <>
          <button
            onClick={() => toggleSection("keywords")}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100 hover:bg-gray-100 transition-colors"
          >
            Keyword suggestions
            <span className={`text-[9px] transition-transform duration-150 ${collapsedSections.has("keywords") ? "" : "rotate-90"}`}>▶</span>
          </button>

          {!collapsedSections.has("keywords") && (
            <KeywordSuggestionsTable
              keywords={keywords}
              selectedKw={selectedKw}
              kwStatuses={kwStatuses}
              currencySymbol={currencySymbol}
              onToggleKw={toggleKw}
              onSelectAll={(c) => setSelectedKw(c ? new Set(keywords.map((_, i) => i)) : new Set())}
              onOpenSingle={openSingleKW}
              onOpenBulk={openBulkKW}
              bulkActions={kwBulkActions}
            />
          )}
        </>
      )}

      {/* ── ASIN suggestion sections ─────────────────────────────────────── */}
      {asinSections.map(({ label, items, key }) => {
        if (!items.length) return null;
        return (
          <PaginatedAsinSection
            key={key}
            items={items}
            sectionKey={key}
            label={label}
            collapsed={collapsedSections.has(key)}
            selectedAsins={selectedAsins}
            asinStatuses={asinStatuses}
            amazonDomain={amazonDomain}
            onToggleSection={() => toggleSection(key)}
            onToggleAsin={(i) => {
              setSelectedAsins((prev) => {
                const set = new Set(prev[key] ?? []);
                set.has(i) ? set.delete(i) : set.add(i);
                return { ...prev, [key]: set };
              });
            }}
            onSelectAll={(c) =>
              setSelectedAsins((prev) => ({
                ...prev,
                [key]: c ? new Set(items.map((_, i) => i)) : new Set(),
              }))
            }
            onOpenSingle={(i, asin) => openSingleASIN(key, i, asin)}
            onOpenBulk={() => openBulkASIN(key, items)}
          />
        );
      })}
    </div>
  );
};

// ─── Keyword suggestions table (extracted for pagination) ─────────────────────

const KeywordSuggestionsTable: React.FC<{
  keywords: KeywordRecommendation[];
  selectedKw: Set<number>;
  kwStatuses: Record<number, TargetRowStatus>;
  currencySymbol: string;
  onToggleKw: (i: number) => void;
  onSelectAll: (checked: boolean) => void;
  onOpenSingle: (i: number) => void;
  onOpenBulk: () => void;
  bulkActions: BulkAction[];
}> = ({
  keywords,
  selectedKw,
  kwStatuses,
  currencySymbol,
  onToggleKw,
  onSelectAll,
  onOpenSingle,
  onOpenBulk,
  bulkActions,
}) => {
  const fmtCurrency = (v: number | undefined | null) =>
    `${currencySymbol}${(v ?? 0).toFixed(2)}`;
  const { page, totalPages, paged, setPage, totalItems, pageSize } =
    usePagination(keywords);

  const pagedWithIndex = paged.map((k) => ({ k, i: keywords.indexOf(k) }));

  return (
    <>
      <BulkActionBar
        selectedCount={selectedKw.size}
        totalCount={keywords.length}
        actions={bulkActions}
        onSelectAll={onSelectAll}
        onClear={() => onSelectAll(false)}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <TH className="w-8">
                <Checkbox
                  checked={selectedKw.size === keywords.length && keywords.length > 0}
                  indeterminate={selectedKw.size > 0 && selectedKw.size < keywords.length}
                  onChange={onSelectAll}
                />
              </TH>
              <TH>Keyword</TH>
              <TH>Match type</TH>
              <TH>Bid</TH>
              <TH>Bid range</TH>
              <TH>Rank</TH>
              <TH>Coverage</TH>    
              <TH>In campaigns</TH>  
              <TH>Status</TH>
            </tr>
          </thead>
          <tbody>
            {pagedWithIndex.map(({ k, i }) => {
              const isSel = selectedKw.has(i);
              const rowStatus = kwStatuses[i];
              const isSuccess = rowStatus?.status === "success";
              const isErr = rowStatus?.status === "error";
              const hasBroad  = k.BROAD  !== "doesn't exist";
              const hasPhrase = k.PHRASE !== "doesn't exist";
              const hasExact  = k.EXACT  !== "doesn't exist";

              const rowBg = isSel
                ? "bg-blue-50 hover:bg-blue-100"
                : isSuccess
                  ? "bg-emerald-50 hover:bg-emerald-100"
                  : isErr
                    ? "bg-red-50/50 hover:bg-red-50"
                    : "hover:bg-gray-50";

              return (
                <tr
                  key={i}
                  onClick={() => onToggleKw(i)}
                  className={`transition-colors cursor-pointer ${rowBg}`}
                >
                  <TD>
                    <Checkbox checked={isSel} onChange={() => onToggleKw(i)} />
                  </TD>
                  <TD>{k.keyword}</TD>
                  <TD><Badge label={k.matchType} variant="blue" /></TD>
                  <TD className="font-mono">{fmtCurrency(k.bid)}</TD>
                  <TD className="font-mono text-gray-400">
                    {fmtCurrency(k.suggestedBid_rangeStart)} – {fmtCurrency(k.suggestedBid_rangeEnd)}
                  </TD>
                  <TD className="font-mono">#{k.rank}</TD>
                  <TD>
                    <div className="flex gap-1">
                      {hasBroad  && <Badge label="B" variant="blue" />}
                      {hasPhrase && <Badge label="P" variant="blue" />}
                      {hasExact  && <Badge label="E" variant="blue" />}
                      {!hasBroad && !hasPhrase && !hasExact && (
                        <Badge label="None" variant="gray" />
                      )}
                    </div>
                  </TD>
                  {/* ── NEW: keyword_exists pill ──────────────────────────── */}
                  <TD>
                    <Badge
                      label={k.keyword_exists ? "Exists" : "New"}
                      variant={k.keyword_exists ? "amber" : "green"}
                    />
                  </TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    {isSuccess && (
                      <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3 shrink-0" /> Created
                      </span>
                    )}
                    {isErr && (
                      <span className="flex items-center gap-1 text-red-500 text-[10px] font-medium whitespace-nowrap" title={rowStatus.error}>
                        <AlertCircle className="h-3 w-3 shrink-0" /> Failed
                      </span>
                    )}
                  </TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    {isSuccess ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenSingle(i); }}
                        className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                      >
                        + Add target
                      </button>
                    )}
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </>
  );
};

// ─── Competitor Content ───────────────────────────────────────────────────────

const CompetitorContent: React.FC<{
  asinId: string;
  rankRecords: CompetiRankRecord[];
  topCompetitors: TopCompetitor[];
  isLoading: boolean;
  error: Error | null;
  hasFetched: boolean;
  onFetch: () => void;
  currencySymbol: string;
}> = ({
  asinId,
  rankRecords,
  topCompetitors,
  isLoading,
  error,
  hasFetched,
  onFetch,
  currencySymbol,
}) => {
  const [selectedRank, setSelectedRank] = useState<Set<number>>(new Set());
  const [selectedRival, setSelectedRival] = useState<Set<number>>(new Set());
  const { data: userProfile } = useUserProfile();
  const activeProfile =
    userProfile?.connected_advertising_profiles?.find((p) => p.is_active) ??
    userProfile?.connected_advertising_profiles?.[0];
  const amazonDomain =
    MARKETPLACE_DOMAINS[activeProfile?.marketplace_id ?? ""] ?? "amazon.com";

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const [modal, setModal] = useState<{
    mode: "keyword" | "product";
    intent: string;
    kwRows?: TargetKWRow[];
    asinRows?: TargetASINRow[];
  } | null>(null);

  const [rankStatuses, setRankStatuses] = useState<Record<number, { status: "success" | "error"; campaignId?: string; error?: string }>>({});
  const [rivalStatuses, setRivalStatuses] = useState<Record<number, { status: "success" | "error"; campaignId?: string; error?: string }>>({});

  const handleRowSuccess = useCallback(
    (index: number, category: string | null, campaignId: string) => {
      if (category === "rival") {
        setRivalStatuses((prev) => ({ ...prev, [index]: { status: "success", campaignId } }));
      } else {
        setRankStatuses((prev) => ({ ...prev, [index]: { status: "success", campaignId } }));
      }
    },
    []
  );
  const handleRowError = useCallback(
    (index: number, category: string | null, error: string) => {
      if (category === "rival") {
        setRivalStatuses((prev) => ({ ...prev, [index]: { status: "error", error } }));
      } else {
        setRankStatuses((prev) => ({ ...prev, [index]: { status: "error", error } }));
      }
    },
    []
  );

  if (!hasFetched) return <FetchPrompt label="Load competitor intel" onFetch={onFetch} />;
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  const myRankRecords = rankRecords.filter((r) => r.clicked_asin === asinId);
  if (!myRankRecords.length && !topCompetitors.length) return <EmptyState />;

  const toggleRank = (i: number) =>
    setSelectedRank((p) => { const s = new Set(p); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const toggleRival = (i: number) =>
    setSelectedRival((p) => { const s = new Set(p); s.has(i) ? s.delete(i) : s.add(i); return s; });

  const openSingleRankKW = (i: number, record: CompetiRankRecord) => {
    const syntheticKW: KeywordRecommendation = {
      keyword: record.search_term,
      matchType: "EXACT",
      bid: 0,
      rank: record.search_frequency_rank,
      suggestedBid_rangeStart: 0,
      suggestedBid_rangeMedian: 0,
      suggestedBid_rangeEnd: 0,
      asin: asinId,
      region: "",
      valid_data_count: 0,
      average_rank: 0,
      average_bid_lower_range: 0,
      average_bid_higher_range: 0,
      average_suggested_bid: 0,
      BROAD:          "doesn't exist",
      PHRASE:         "doesn't exist",
      EXACT:          "doesn't exist",
      keyword_exists: false,
    };
    setModal({ mode: "keyword", intent: "competitor", kwRows: [{ index: i, keyword: syntheticKW }] });
  };

  const openBulkRankKW = () => {
    const rows: TargetKWRow[] = [...selectedRank].map((i) => {
      const record = myRankRecords[i];
      return {
        index: i,
        keyword: {
          keyword: record.search_term,
          matchType: "EXACT",
          bid: 0,
          rank: record.search_frequency_rank,
          suggestedBid_rangeStart: 0,
          suggestedBid_rangeMedian: 0,
          suggestedBid_rangeEnd: 0,
          asin: asinId,
          region: "",
          valid_data_count: 0,
          average_rank: 0,
          average_bid_lower_range: 0,
          average_bid_higher_range: 0,
          average_suggested_bid: 0,
        } as KeywordRecommendation,
      };
    });
    setModal({ mode: "keyword", intent: "competitor", kwRows: rows });
  };

  const openSingleRivalPT = (i: number, rivalAsin: string) =>
    setModal({ mode: "product", intent: "competitor", asinRows: [{ index: i, asin: rivalAsin, category: "rival" }] });

  const openBulkRivalPT = () => {
    const rows: TargetASINRow[] = [...selectedRival].map((i) => ({
      index: i,
      asin: topCompetitors[i].asin,
      category: "rival",
    }));
    setModal({ mode: "product", intent: "competitor", asinRows: rows });
  };

  const rankBulkActions: BulkAction[] = [
    { label: "+ Target selected", variant: "green", onClick: openBulkRankKW },
    { label: "Export", variant: "gray", onClick: () => {} },
  ];
  const rivalBulkActions: BulkAction[] = [
    { label: "+ Target selected", variant: "green", onClick: openBulkRivalPT },
    { label: "Export", variant: "gray", onClick: () => {} },
  ];

  return (
    <div>
      {modal && (
        <TargetCampaignModal
          asin={asinId}
          mode={modal.mode}
          intent={modal.intent}
          kwRows={modal.kwRows}
          asinRows={modal.asinRows}
          onClose={() => setModal(null)}
          onRowSuccess={handleRowSuccess}
          onRowError={handleRowError}
        />
      )}

      {/* ── Section 1: Keywords where your ASIN appears ───────────────────── */}
      {myRankRecords.length > 0 && (
        <>
          <button
            onClick={() => toggleSection("rank")}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100 hover:bg-gray-100 transition-colors"
          >
            Keywords where your ASIN appears
            <span className={`text-[9px] transition-transform duration-150 ${collapsedSections.has("rank") ? "" : "rotate-90"}`}>▶</span>
          </button>

          {!collapsedSections.has("rank") && (
            <RankRecordsTable
              records={myRankRecords}
              selectedRank={selectedRank}
              rankStatuses={rankStatuses}
              bulkActions={rankBulkActions}
              onToggleRank={toggleRank}
              onSelectAll={(c) => setSelectedRank(c ? new Set(myRankRecords.map((_, i) => i)) : new Set())}
              onOpenSingle={openSingleRankKW}
              onOpenBulk={openBulkRankKW}
            />
          )}
        </>
      )}

      {/* ── Section 2: Top competing ASINs ────────────────────────────────── */}
      {topCompetitors.length > 0 && (
        <>
          <button
            onClick={() => toggleSection("rivals")}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100 hover:bg-gray-100 transition-colors"
          >
            Top competing ASINs
            <span className={`text-[9px] transition-transform duration-150 ${collapsedSections.has("rivals") ? "" : "rotate-90"}`}>▶</span>
          </button>

          {!collapsedSections.has("rivals") && (
            <RivalAsinsTable
              competitors={topCompetitors}
              selectedRival={selectedRival}
              rivalStatuses={rivalStatuses}
              bulkActions={rivalBulkActions}
              amazonDomain={amazonDomain}
              onToggleRival={toggleRival}
              onSelectAll={(c) => setSelectedRival(c ? new Set(topCompetitors.map((_, i) => i)) : new Set())}
              onOpenSingle={openSingleRivalPT}
              onOpenBulk={openBulkRivalPT}
            />
          )}
        </>
      )}
    </div>
  );
};

// ─── Rank Records Table (paginated) ──────────────────────────────────────────

const RankRecordsTable: React.FC<{
  records: CompetiRankRecord[];
  selectedRank: Set<number>;
  rankStatuses: Record<number, { status: "success" | "error"; campaignId?: string; error?: string }>;
  bulkActions: BulkAction[];
  onToggleRank: (i: number) => void;
  onSelectAll: (checked: boolean) => void;
  onOpenSingle: (i: number, record: CompetiRankRecord) => void;
  onOpenBulk: () => void;
}> = ({
  records,
  selectedRank,
  rankStatuses,
  bulkActions,
  onToggleRank,
  onSelectAll,
  onOpenSingle,
}) => {
  const { page, totalPages, paged, setPage, totalItems, pageSize } =
    usePagination(records);
  const pagedWithIndex = paged.map((r) => ({ r, i: records.indexOf(r) }));

  return (
    <>
      <BulkActionBar
        selectedCount={selectedRank.size}
        totalCount={records.length}
        actions={bulkActions}
        onSelectAll={onSelectAll}
        onClear={() => onSelectAll(false)}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <TH className="w-8">
                <Checkbox
                  checked={selectedRank.size === records.length && records.length > 0}
                  indeterminate={selectedRank.size > 0 && selectedRank.size < records.length}
                  onChange={onSelectAll}
                />
              </TH>
              <TH>Search term</TH>
              <TH>SFR</TH>
              <TH>Click share</TH>
              <TH>Conv. share</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </thead>
          <tbody>
            {pagedWithIndex.map(({ r, i }) => {
              const isSel = selectedRank.has(i);
              const rowStatus = rankStatuses[i];
              const isSuccess = rowStatus?.status === "success";
              const isErr = rowStatus?.status === "error";
              const rowBg = isSel
                ? "bg-blue-50 hover:bg-blue-100"
                : isSuccess
                  ? "bg-emerald-50 hover:bg-emerald-100"
                  : isErr
                    ? "bg-red-50/50 hover:bg-red-50"
                    : "hover:bg-gray-50";

              return (
                <tr key={i} onClick={() => onToggleRank(i)} className={`transition-colors cursor-pointer ${rowBg}`}>
                  <TD><Checkbox checked={isSel} onChange={() => onToggleRank(i)} /></TD>
                  <TD>{r.search_term}</TD>
                  <TD className="font-mono">#{r.search_frequency_rank}</TD>
                  <TD className="font-mono">{fmtPctFraction(r.click_share)}</TD>
                  <TD className="font-mono">{fmtPctFraction(r.conversion_share)}</TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    {isSuccess && (
                      <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3 shrink-0" /> Created
                      </span>
                    )}
                    {isErr && (
                      <span className="flex items-center gap-1 text-red-500 text-[10px] font-medium whitespace-nowrap" title={rowStatus.error}>
                        <AlertCircle className="h-3 w-3 shrink-0" /> Failed
                      </span>
                    )}
                  </TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    {isSuccess ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenSingle(i, r); }}
                        className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                      >
                        + Target KW
                      </button>
                    )}
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </>
  );
};

// ─── Rival ASINs Table (paginated) ───────────────────────────────────────────

const RivalAsinsTable: React.FC<{
  competitors: TopCompetitor[];
  selectedRival: Set<number>;
  rivalStatuses: Record<number, { status: "success" | "error"; campaignId?: string; error?: string }>;
  bulkActions: BulkAction[];
  amazonDomain: string;
  onToggleRival: (i: number) => void;
  onSelectAll: (checked: boolean) => void;
  onOpenSingle: (i: number, asin: string) => void;
  onOpenBulk: () => void;
}> = ({
  competitors,
  selectedRival,
  rivalStatuses,
  bulkActions,
  amazonDomain,
  onToggleRival,
  onSelectAll,
  onOpenSingle,
}) => {
  const { page, totalPages, paged, setPage, totalItems, pageSize } =
    usePagination(competitors);
  const pagedWithIndex = paged.map((c) => ({ c, i: competitors.indexOf(c) }));

  return (
    <>
      <BulkActionBar
        selectedCount={selectedRival.size}
        totalCount={competitors.length}
        actions={bulkActions}
        onSelectAll={onSelectAll}
        onClear={() => onSelectAll(false)}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <TH className="w-8">
                <Checkbox
                  checked={selectedRival.size === competitors.length && competitors.length > 0}
                  indeterminate={selectedRival.size > 0 && selectedRival.size < competitors.length}
                  onChange={onSelectAll}
                />
              </TH>
              <TH>Rival ASIN</TH>
              <TH>Shared keywords</TH>
              <TH>Avg click share</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </thead>
          <tbody>
            {pagedWithIndex.map(({ c, i }) => {
              const isSel = selectedRival.has(i);
              const rowStatus = rivalStatuses[i];
              const isSuccess = rowStatus?.status === "success";
              const isErr = rowStatus?.status === "error";
              const rowBg = isSel
                ? "bg-blue-50 hover:bg-blue-100"
                : isSuccess
                  ? "bg-emerald-50 hover:bg-emerald-100"
                  : isErr
                    ? "bg-red-50/50 hover:bg-red-50"
                    : "hover:bg-gray-50";

              return (
                <tr key={i} onClick={() => onToggleRival(i)} className={`transition-colors cursor-pointer ${rowBg}`}>
                  <TD><Checkbox checked={isSel} onChange={() => onToggleRival(i)} /></TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`https://www.${amazonDomain}/d/${c.asin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                    >
                      {c.asin}
                      <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4.5 3H3a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V7.5M7 2h3m0 0v3m0-3L5 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </TD>
                  <TD className="font-mono">{c.occurrence_count}</TD>
                  <TD className="font-mono">{fmtPctFraction(c.avg_click_share)}</TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    {isSuccess && (
                      <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3 shrink-0" /> Created
                      </span>
                    )}
                    {isErr && (
                      <span className="flex items-center gap-1 text-red-500 text-[10px] font-medium whitespace-nowrap" title={rowStatus.error}>
                        <AlertCircle className="h-3 w-3 shrink-0" /> Failed
                      </span>
                    )}
                  </TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    {isSuccess ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenSingle(i, c.asin); }}
                        className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                      >
                        + Target ASIN
                      </button>
                    )}
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </>
  );
};

// ─── ASIN Thumbnail ───────────────────────────────────────────────────────────

const AsinThumbnail: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{ left: number; bottom: number } | null>(null);

  return (
    <div
      ref={ref}
      className="shrink-0"
      onMouseEnter={() => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          setCoords({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
        }
      }}
      onMouseLeave={() => setCoords(null)}
      onClick={(e) => e.stopPropagation()}
    >
      <img src={src} alt={alt} className="w-9 h-9 rounded-md object-contain bg-gray-50 border border-gray-100" />
      {coords && (
        <div
          style={{ position: "fixed", left: coords.left, bottom: coords.bottom, zIndex: 9999 }}
          className="bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 pointer-events-none"
        >
          <img src={src} alt={alt} className="w-[200px] h-[200px] object-contain rounded-lg" />
          <div className="w-2.5 h-2.5 bg-white border-b border-r border-gray-100 rotate-45 ml-3 -mt-[5px]" />
        </div>
      )}
    </div>
  );
};

// ─── ASIN Card ────────────────────────────────────────────────────────────────

interface ASINCardProps {
  asin: ASIN;
  tab: TabKey;
  sqpQueries: SQPSearchQuery[];
  sqpLoading: boolean;
  sqpError: Error | null;
  ngramTargetAcos: number;
  rankRecords: CompetiRankRecord[];
  topCompetitors: TopCompetitor[];
  competitorLoading: boolean;
  competitorError: Error | null;
  competitorFetched: boolean;
  currencySymbol: string;
  onFetchCompetitor: () => void;
}

const ASINCard: React.FC<ASINCardProps> = ({
  asin,
  tab,
  sqpQueries,
  sqpLoading,
  sqpError,
  ngramTargetAcos,
  rankRecords,
  topCompetitors,
  competitorLoading,
  competitorError,
  competitorFetched,
  currencySymbol,
  onFetchCompetitor,
}) => {
  const [open, setOpen] = useState(false);

  const ctrPositive = asin.ctrDelta.startsWith("+");
  const cvrPositive = asin.cvrDelta.startsWith("+");

  const renderBody = () => {
    switch (tab) {
      case "sqp":
        return <SQPTable asin={asin.id} queries={sqpQueries} isLoading={sqpLoading} error={sqpError} />;
      case "ngram":
        return (
          <NgramTable
            asin={asin.id}
            targetAcos={ngramTargetAcos}
            currencySymbol={currencySymbol}
          />
        );
      case "target":
        return <TargetContent asinId={asin.id} currencySymbol={currencySymbol} />;
      case "competitor":
        return (
          <CompetitorContent
            asinId={asin.id}
            rankRecords={rankRecords}
            topCompetitors={topCompetitors}
            isLoading={competitorLoading}
            error={competitorError}
            hasFetched={competitorFetched}
            currencySymbol={currencySymbol}
            onFetch={onFetchCompetitor}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-gray-400 text-xs transition-transform duration-200 shrink-0 ${open ? "rotate-90" : ""}`}>▶</span>
          {asin.imageUrl && <AsinThumbnail src={asin.imageUrl} alt={asin.name || asin.id} />}
          <div className="min-w-0">
            {asin.name && (
              <div
                className="font-medium text-gray-800 text-[13px] truncate leading-tight"
                title={asin.name.length > 50 ? asin.name : undefined}
              >
                {asin.name.length > 50 ? `${asin.name.slice(0, 50)}…` : asin.name}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded leading-tight">
                {asin.id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0 ml-4">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">Avg CTR</div>
            {asin.avgCtr === "–" ? (
              <div className="h-4 w-12 bg-gray-100 rounded animate-pulse mt-0.5" />
            ) : (
              <div className="text-[13px] font-semibold font-mono text-gray-800">
                {asin.avgCtr}
                {asin.ctrDelta && (
                  <span className={`text-[10px] font-normal ml-1 ${ctrPositive ? "text-emerald-600" : "text-red-500"}`}>
                    {asin.ctrDelta}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400">Avg CVR</div>
            {asin.avgCvr === "–" ? (
              <div className="h-4 w-12 bg-gray-100 rounded animate-pulse mt-0.5" />
            ) : (
              <div className="text-[13px] font-semibold font-mono text-gray-800">
                {asin.avgCvr}
                {asin.cvrDelta && (
                  <span className={`text-[10px] font-normal ml-1 ${cvrPositive ? "text-emerald-600" : "text-red-500"}`}>
                    {asin.cvrDelta}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      {open && <div className="border-t border-gray-100">{renderBody()}</div>}
    </div>
  );
};

// ─── Tab Button ───────────────────────────────────────────────────────────────

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
      active ? "border-[#f5a623] text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    {label}
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "sqp", label: "SQP gaps" },
  { key: "ngram", label: "N-gram analysis" },
  { key: "target", label: "Target finder" },
  { key: "competitor", label: "Competitor intel" },
];

export function OpportunityOptimizer() {
  const { data: asinsData, isLoading: asinsLoading } = useAllAsins();
  const { data: userProfile } = useUserProfile();
  const { currencySymbol } = useCampaignDefaults();

  const [activeTab, setActiveTab] = useState<TabKey>("sqp");
  const [asinFilter, setAsinFilter] = useState<string>("all");

  const activeAdProfile =
    userProfile?.connected_advertising_profiles?.find((p) => p.is_active) ??
    userProfile?.connected_advertising_profiles?.[0];

  const ngramTargetAcos = parseTargetAcos(activeAdProfile?.target_acos);

  const ASINS: ASIN[] = (asinsData?.results ?? []).slice(0, 30).map((a) => ({
    id: a.asin,
    name: a.product_name ?? "",
    imageUrl: a.image_url ?? undefined,
    avgCtr: "–",
    ctrDelta: "",
    avgCvr: "–",
    cvrDelta: "",
  }));

  const ALL_ASIN_IDS = ASINS.map((a) => a.id).join(",");

  const sqpQuery = useSQPOpportunities();

  const competiRankQuery = useCompetiRankData({ asins: ALL_ASIN_IDS });
  const competingAsinsQuery = useCompetingAsins({ asins: ALL_ASIN_IDS });

  const handleFetchCompetitor = () => {
    competiRankQuery.fetchData();
    competingAsinsQuery.fetchData();
  };

  const competitorFetched = competiRankQuery.isEnabled;
  const competitorLoading = competiRankQuery.isLoading || competingAsinsQuery.isLoading;
  const competitorError = competiRankQuery.error ?? competingAsinsQuery.error;
  const rankRecords = competiRankQuery.data?.data ?? [];
  const topCompetitors = competingAsinsQuery.data?.top_competitors ?? [];

  const allSQP = sqpQuery.data?.search_queries ?? [];
  // const allNgramPositive = ngramQuery.data?.ngram_positive ?? [];
  // const allNgramNegative = ngramQuery.data?.ngram_negative ?? [];
  // const allNgramObserve = ngramQuery.data?.ngram_observe ?? [];

  const sqpMetricsByAsin = React.useMemo(() => {
    const map: Record<string, { ctrs: number[]; cvrs: number[] }> = {};
    for (const q of allSQP) {
      if (!map[q.asin]) map[q.asin] = { ctrs: [], cvrs: [] };
      if (q.asin_impression_count > 0)
        map[q.asin].ctrs.push((q.asin_click_count / q.asin_impression_count) * 100);
      if (q.asin_conversion != null) map[q.asin].cvrs.push(q.asin_conversion);
    }
    const result: Record<string, { avgCtr: string; avgCvr: string }> = {};
    for (const [asin, { ctrs, cvrs }] of Object.entries(map)) {
      const avgCtr = ctrs.length > 0 ? ctrs.reduce((a, b) => a + b, 0) / ctrs.length : null;
      const avgCvr = cvrs.length > 0 ? cvrs.reduce((a, b) => a + b, 0) / cvrs.length : null;
      result[asin] = {
        avgCtr: avgCtr != null ? `${avgCtr.toFixed(1)}%` : "–",
        avgCvr: avgCvr != null ? `${avgCvr.toFixed(1)}%` : "–",
      };
    }
    return result;
  }, [allSQP]);

  const enrichedASINs: ASIN[] = ASINS.map((a) => {
    const m = sqpMetricsByAsin[a.id];
    return m ? { ...a, avgCtr: m.avgCtr, ctrDelta: "", avgCvr: m.avgCvr, cvrDelta: "" } : a;
  });

  const visibleASINs =
    asinFilter === "all"
      ? enrichedASINs
      : enrichedASINs.filter((a) => a.id === asinFilter);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
  };

  if (asinsLoading) return <LoadingState />;

  const renderCards = () => {

    return visibleASINs.map((asin) => {
      const sqpQueries = allSQP.filter((q) => q.asin === asin.id);

      return (
        <ASINCard
          key={asin.id}
          asin={asin}
          tab={activeTab}
          sqpQueries={sqpQueries}
          sqpLoading={sqpQuery.isLoading}
          sqpError={(sqpQuery.error as Error) ?? null}
          ngramTargetAcos={ngramTargetAcos}
          rankRecords={rankRecords}
          topCompetitors={topCompetitors}
          competitorLoading={competitorLoading}
          competitorError={competitorError}
          competitorFetched={competitorFetched}
          currencySymbol={currencySymbol}
          onFetchCompetitor={handleFetchCompetitor}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-gray-900 flex items-center gap-2">
              🎯 Opportunity Optimizer
            </h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Find gaps, expand winners, kill waste — across your top ASINs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500">Filter ASIN</label>
            <select
              value={asinFilter}
              onChange={(e) => setAsinFilter(e.target.value)}
              className="text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
            >
              <option value="all">All ASINs</option>
              {ASINS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id}{a.name ? ` — ${a.name.length > 50 ? `${a.name.slice(0, 50)}…` : a.name}` : ""}
                </option>
              ))}
            </select>
            <span className="text-[11px] bg-white border border-gray-200 text-gray-400 rounded-full px-2.5 py-0.5 shadow-sm">
              {visibleASINs.length} ASIN{visibleASINs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 px-4 overflow-x-auto">
          {TABS.map((t) => (
            <TabButton
              key={t.key}
              label={t.label}
              active={activeTab === t.key}
              onClick={() => handleTabChange(t.key)}
            />
          ))}
        </div>
        <div className="p-4">{renderCards()}</div>
      </div>

      <div className="h-6" />
    </div>
  );
}