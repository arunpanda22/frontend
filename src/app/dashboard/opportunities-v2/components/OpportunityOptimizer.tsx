"use client";

import React, { useState, useCallback } from "react";
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
  useAllAsins,
} from "@/lib/hooks/use-opportunities";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";
import { useCampaignDefaults } from "@/lib/hooks/campaignCreationHooks";

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

const fmtPct         = (v: number) => `${v.toFixed(1)}%`;
const fmtPctFraction = (v: number) => `${(v * 100).toFixed(1)}%`;

// ─── Target ACOS parser ───────────────────────────────────────────────────────
// profile.target_acos arrives as "20", "0.20", or "20%" — normalise to 0–1 range

function parseTargetAcos(raw?: string | number | null): number {
  if (raw == null) return 0.2;
  const str = String(raw);
  const n = parseFloat(str.replace("%", "").trim());
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
  const childWords  = child.toLowerCase().trim().split(/\s+/);
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
  keyword:  NgramKeyword;
  children: NgramTreeNode[];
  depth:    number;
}

function buildNgramTree(keywords: NgramKeyword[]): NgramTreeNode[] {
  // Bucket keywords by word count
  const byN = new Map<number, NgramKeyword[]>();
  for (const kw of keywords) {
    const n      = wordCount(kw.Keyword);
    const bucket = byN.get(n) ?? [];
    bucket.push(kw);
    byN.set(n, bucket);
  }

  const maxN = byN.size ? Math.max(...byN.keys()) : 0;
  if (maxN === 0) return [];

  // Track which keywords have already been placed in the tree
  const placed = new Set<string>();

  function buildNode(kw: NgramKeyword, depth: number): NgramTreeNode {
    const key = `${kw.ASIN}::${kw.Keyword}`;
    placed.add(key);
    const n        = wordCount(kw.Keyword);
    // Children are (n-1)-grams whose words are all contained in this parent
    const children = (byN.get(n - 1) ?? [])
      .filter((child) => isSubsetOf(child.Keyword, kw.Keyword))
      .map((child)   => buildNode(child, depth + 1));
    return { keyword: kw, children, depth };
  }

  // Walk longest-first; orphaned shorter grams become their own root nodes
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
    red:   "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    blue:  "bg-blue-50 text-blue-700 border border-blue-200",
    gray:  "bg-gray-100 text-gray-500 border border-gray-200",
  };
  return (
    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[variant]}`}>
      {label}
    </span>
  );
};

const TH: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <th className={`px-3 py-2 text-left text-[11px] font-medium text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap ${className}`}>
    {children}
  </th>
);

const TD: React.FC<{
  children:  React.ReactNode;
  className?: string;
  onClick?:  (e: React.MouseEvent) => void;
}> = ({ children, className = "", onClick }) => (
  <td
    onClick={onClick}
    className={`px-3 py-2 text-[12px] text-gray-700 border-b border-gray-50 ${className}`}
  >
    {children}
  </td>
);

// ─── Campaign Creation Modal ──────────────────────────────────────────────────

interface CampaignModalContext {
  type: "keyword" | "asin" | "search_query";
  value: string;
  asin?: string;
}

const CampaignModal: React.FC<{
  context: CampaignModalContext | null;
  onClose: () => void;
}> = ({ context, onClose }) => {
  if (!context) return null;

  const typeLabel: Record<CampaignModalContext["type"], string> = {
    keyword:      "Keyword",
    asin:         "ASIN",
    search_query: "Search Query",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900">Create Campaign</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {typeLabel[context.type]}:{" "}
              <span className="font-mono text-gray-600">{context.value}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🚧</span>
          </div>
          <p className="text-[13px] font-medium text-gray-700">Campaign builder coming soon</p>
          <p className="text-[11px] text-gray-400 mt-1">
            The campaign creation API is not yet connected.
            <br />
            This modal will be fully functional once it's ready.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled
            className="px-4 py-1.5 text-[12px] font-medium rounded-lg bg-[#f5a623] text-white opacity-40 cursor-not-allowed"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── State helpers ────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="py-10 text-center text-sm text-gray-400">
    No data available for this ASIN
  </div>
);

const LoadingState = () => (
  <div className="py-10 text-center text-sm text-gray-400 animate-pulse">Loading…</div>
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
  checked:       boolean;
  indeterminate?: boolean;
  onChange:      (checked: boolean) => void;
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
  label:   string;
  variant: "green" | "red" | "gray";
  onClick: (ids: string[]) => void;
}

const BulkActionBar: React.FC<{
  selectedCount: number;
  totalCount:    number;
  actions:       BulkAction[];
  onSelectAll:   (checked: boolean) => void;
  onClear:       () => void;
}> = ({ selectedCount, totalCount, actions, onSelectAll, onClear }) => {
  if (selectedCount === 0) return null;
  const variantStyles: Record<string, string> = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    red:   "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
    gray:  "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
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
            onClick={() => a.onClick([])}
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

// ─── SQP Table ────────────────────────────────────────────────────────────────

const SQPTable: React.FC<{
  queries:   SQPSearchQuery[];
  isLoading: boolean;
  error:     Error | null;
}> = ({ queries, isLoading, error }) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modalCtx, setModalCtx] = useState<CampaignModalContext | null>(null);

  const toggleRow = useCallback((i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const handleSelectAll = (checked: boolean) =>
    setSelected(checked ? new Set(queries.map((_, i) => i)) : new Set());

  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorState message={error.message} />;
  if (!queries.length) return <EmptyState />;

  const sqpBulkActions: BulkAction[] = [
    { label: "+ Add to campaign", variant: "green", onClick: () => {} },
    { label: "Export",            variant: "gray",  onClick: () => {} },
  ];

  return (
    <div>
      <CampaignModal context={modalCtx} onClose={() => setModalCtx(null)} />
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
              <TH />
            </tr>
          </thead>
          <tbody>
            {queries.map((q, i) => {
              const cvrGood    = q["Conversion > Market"];
              const hasBroad   = q.BROAD  !== "doesn't exist";
              const hasPhrase  = q.PHRASE !== "doesn't exist";
              const hasExact   = q.EXACT  !== "doesn't exist";
              const isSelected = selected.has(i);
              const myCtr      =
                q.asin_impression_count > 0
                  ? (q.asin_click_count / q.asin_impression_count) * 100
                  : 0;

              return (
                <tr
                  key={i}
                  onClick={() => toggleRow(i)}
                  className={`transition-colors cursor-pointer ${
                    isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                  }`}
                >
                  <TD>
                    <Checkbox checked={isSelected} onChange={() => toggleRow(i)} />
                  </TD>
                  <TD>{q.search_query}</TD>
                  <TD className="font-mono">
                    {(q.search_query_volume ?? 0).toLocaleString()}
                  </TD>
                  <TD className="font-mono">
                    {(q.total_query_impression_count ?? 0).toLocaleString()}
                  </TD>
                  <TD className="font-mono">
                    {(q.asin_impression_count ?? 0).toLocaleString()}
                  </TD>
                  <TD className="font-mono font-medium text-gray-700">
                    {myCtr.toFixed(1)}%
                  </TD>
                  <TD className="font-mono">{q.total_click_count.toLocaleString()}</TD>
                  <TD className="font-mono">{q.asin_click_count.toLocaleString()}</TD>
                  <TD className={`font-mono font-medium ${cvrGood ? "text-emerald-600" : "text-red-500"}`}>
                    {fmtPct(q.asin_conversion)}
                  </TD>
                  <TD className="font-mono">{fmtPct(q.total_conversion)}</TD>
                  <TD className="font-mono">{q.asin_purchase_count}</TD>
                  <TD className="font-mono">{q.total_purchase_count}</TD>
                  <TD>
                    <Badge
                      label={cvrGood ? "Yes" : "No"}
                      variant={cvrGood ? "green" : "red"}
                    />
                  </TD>
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
                  <TD onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalCtx({ type: "search_query", value: q.search_query });
                      }}
                      className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                    >
                      + Campaign
                    </button>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── N-gram Tree Row (recursive) ──────────────────────────────────────────────

const NgramTreeRow: React.FC<{
  node:           NgramTreeNode;
  expandedKeys:   Set<string>;
  selectedKeys:   Set<string>;
  targetAcos:     number;
  currencySymbol: string;
  onToggleExpand: (key: string) => void;
  onToggleSelect: (key: string) => void;
  onAction:       (kw: NgramKeyword) => void;
}> = ({
  node,
  expandedKeys,
  selectedKeys,
  targetAcos,
  currencySymbol,
  onToggleExpand,
  onToggleSelect,
  onAction,
}) => {
  const kw          = node.keyword;
  const key         = `${kw.ASIN}::${kw.Keyword}`;
  const isExpanded  = expandedKeys.has(key);
  const isSelected  = selectedKeys.has(key);
  const hasChildren = node.children.length > 0;
  const isLeaf      = !hasChildren;
  const isNeg       = isNegativeKeyword(kw);

  const acosRaw        = typeof kw.ACOS_Value === "number"
    ? kw.ACOS_Value
    : parseFloat(kw.ACOS_Value as string);
  const acosDisplay    = isNaN(acosRaw) ? String(kw.ACOS_Value) : fmtPctFraction(acosRaw);
  const acosOverTarget = !isNaN(acosRaw) && acosRaw > targetAcos;
  const acosColor      = acosOverTarget || isNeg ? "text-red-500" : "text-emerald-600";

  const type     = ngramType(kw.Keyword);
  const indentPx = node.depth * 20;

  const fmtCurrency = (v: number) => `${currencySymbol}${v.toFixed(2)}`;

  return (
    <>
      <tr
        onClick={() => onToggleSelect(key)}
        className={`transition-colors cursor-pointer ${
          isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
        }`}
      >
        {/* Checkbox */}
        <TD className="w-8">
          <Checkbox checked={isSelected} onChange={() => onToggleSelect(key)} />
        </TD>

        {/* N-gram name: indented with expand arrow or └ leaf connector */}
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

        {/* Type badge */}
        <TD>
          <Badge label={type} variant={type === "unigram" ? "gray" : "blue"} />
        </TD>

        {/* ACOS */}
        <TD className={`font-mono font-medium ${acosColor}`}>{acosDisplay}</TD>

        {/* Target ACOS — sourced from user's advertising profile */}
        <TD className="font-mono text-gray-400">{fmtPctFraction(targetAcos)}</TD>

        {/* Spend */}
        <TD className="font-mono">{fmtCurrency(kw.cost)}</TD>

        {/* Sales */}
        <TD className="font-mono">{fmtCurrency(kw.sales_30d)}</TD>

        {/* Action */}
        <TD onClick={(e) => e.stopPropagation()}>
          {isLeaf ? (
            // Unigrams: teal text link (matches prototype exactly)
            <button
              onClick={(e) => { e.stopPropagation(); onAction(kw); }}
              className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap"
            >
              View Keywords
            </button>
          ) : !isNeg ? (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(kw); }}
              className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              + Expand
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(kw); }}
              className="text-[11px] px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Negative
            </button>
          )}
        </TD>
      </tr>

      {/* Recursively render children only when this node is expanded */}
      {hasChildren &&
        isExpanded &&
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
            onAction={onAction}
          />
        ))}
    </>
  );
};

// ─── N-gram Table (tree shell) ────────────────────────────────────────────────

const NgramTable: React.FC<{
  keywords:   NgramKeyword[];
  isLoading:  boolean;
  error:      Error | null;
  targetAcos: number;
  currencySymbol: string;
}> = ({ keywords, isLoading, error, targetAcos, currencySymbol  }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [modalCtx, setModalCtx]         = useState<CampaignModalContext | null>(null);

  // Build tree once whenever the keyword list changes
  const tree = React.useMemo(() => buildNgramTree(keywords), [keywords]);

  // Flatten every node key so select-all works across the full tree
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

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleSelectAll = (checked: boolean) =>
    setSelectedKeys(checked ? new Set(allKeys) : new Set());

  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorState message={error.message} />;
  if (!keywords.length) return <EmptyState />;

  const bulkActions: BulkAction[] = [
    { label: "+ Expand selected", variant: "green", onClick: () => {} },
    { label: "Negative selected", variant: "red",   onClick: () => {} },
    { label: "Export",            variant: "gray",  onClick: () => {} },
  ];

  const fmtCurrency = (v: number) => `${currencySymbol}${v.toFixed(2)}`;


  return (
    <div>
      <CampaignModal context={modalCtx} onClose={() => setModalCtx(null)} />
      <BulkActionBar
        selectedCount={selectedKeys.size}
        totalCount={allKeys.length}
        actions={bulkActions}
        onSelectAll={handleSelectAll}
        onClear={() => setSelectedKeys(new Set())}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <TH className="w-8">
                <Checkbox
                  checked={allKeys.length > 0 && selectedKeys.size === allKeys.length}
                  indeterminate={selectedKeys.size > 0 && selectedKeys.size < allKeys.length}
                  onChange={handleSelectAll}
                />
              </TH>
              <TH>N-gram (Trigram)</TH>
              <TH>Type</TH>
              <TH>ACOS</TH>
              <TH>Target ACOS</TH>
              <TH>Spend</TH>
              <TH>Sales</TH>
              <TH>Action</TH>
            </tr>
          </thead>
          <tbody>
            {tree.map((node) => (
              <NgramTreeRow
                key={`${node.keyword.ASIN}::${node.keyword.Keyword}`}
                node={node}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                targetAcos={targetAcos}
                currencySymbol={currencySymbol}
                onToggleExpand={toggleExpand}
                onToggleSelect={toggleSelect}
                onAction={(kw) => setModalCtx({ type: "keyword", value: kw.Keyword })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Target Content ───────────────────────────────────────────────────────────

const TargetContent: React.FC<{ asinId: string, currencySymbol: string; }> = ({ asinId, currencySymbol }) => {
  const asinSuggest = useAsinSuggestOpportunities(asinId);
  const productRec  = useProductRecommendations(asinId);
  const [selectedKw,    setSelectedKw]    = useState<Set<number>>(new Set());
  const [selectedAsins, setSelectedAsins] = useState<Record<string, Set<number>>>({});
  const [modalCtx, setModalCtx]           = useState<CampaignModalContext | null>(null);

  const hasFetched = asinSuggest.isEnabled;
  const isLoading  = asinSuggest.isLoading || productRec.isLoading;

  const handleFetch = () => {
    asinSuggest.fetchData();
    productRec.fetchData();
  };

  if (!hasFetched) return <FetchPrompt label="Load recommendations" onFetch={handleFetch} />;
  if (isLoading)   return <LoadingState />;
  if (asinSuggest.error) return <ErrorState message={asinSuggest.error.message} />;

  const keywords: KeywordRecommendation[] = asinSuggest.data?.keywords ?? [];
  const recs = productRec.data?.recommendations ?? [];

  const topConverting    = recs.map((r) => r["Top converting targets"]).filter(Boolean) as string[];
  const lowRatings       = recs.map((r) => r["Similar items with low ratings and reviews"]).filter(Boolean) as string[];
  const frequentlyViewed = recs.map((r) => r["Similar items (frequently viewed together)"]).filter(Boolean) as string[];

  const hasAnything =
    keywords.length || topConverting.length || lowRatings.length || frequentlyViewed.length;
  if (!hasAnything) return <EmptyState />;

  const toggleKw = (i: number) =>
    setSelectedKw((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const toggleAsin = (category: string, i: number) =>
    setSelectedAsins((prev) => {
      const set = new Set(prev[category] ?? []);
      set.has(i) ? set.delete(i) : set.add(i);
      return { ...prev, [category]: set };
    });

  const kwBulkActions: BulkAction[] = [
    { label: "+ Target selected", variant: "green", onClick: () => {} },
    { label: "Export",            variant: "gray",  onClick: () => {} },
  ];
  const asinBulkActions: BulkAction[] = [
    { label: "+ Target selected", variant: "green", onClick: () => {} },
  ];

  const asinSections = [
    { label: "Top converting targets",         items: topConverting,    key: "top" },
    { label: "Similar items with low ratings", items: lowRatings,       key: "low" },
    { label: "Frequently viewed together",     items: frequentlyViewed, key: "fvt" },
  ] as const;

  const fmtCurrency = (v: number) => `${currencySymbol}${v.toFixed(2)}`;

  return (
    <div>
      <CampaignModal context={modalCtx} onClose={() => setModalCtx(null)} />

      {/* Keyword suggestions */}
      {keywords.length > 0 && (
        <>
          <SectionHeader>Keyword suggestions</SectionHeader>
          <BulkActionBar
            selectedCount={selectedKw.size}
            totalCount={keywords.length}
            actions={kwBulkActions}
            onSelectAll={(c) =>
              setSelectedKw(c ? new Set(keywords.map((_, i) => i)) : new Set())
            }
            onClear={() => setSelectedKw(new Set())}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <TH className="w-8">
                    <Checkbox
                      checked={selectedKw.size === keywords.length && keywords.length > 0}
                      indeterminate={selectedKw.size > 0 && selectedKw.size < keywords.length}
                      onChange={(c) =>
                        setSelectedKw(c ? new Set(keywords.map((_, i) => i)) : new Set())
                      }
                    />
                  </TH>
                  <TH>Keyword</TH>
                  <TH>Match type</TH>
                  <TH>Bid</TH>
                  <TH>Bid range</TH>
                  <TH>Rank</TH>
                  <TH />
                </tr>
              </thead>
              <tbody>
                {keywords.map((k, i) => {
                  const isSel = selectedKw.has(i);
                  return (
                    <tr
                      key={i}
                      onClick={() => toggleKw(i)}
                      className={`transition-colors cursor-pointer ${
                        isSel ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <TD>
                        <Checkbox checked={isSel} onChange={() => toggleKw(i)} />
                      </TD>
                      <TD>{k.keyword}</TD>
                      <TD>
                        <Badge label={k.matchType} variant="blue" />
                      </TD>
                      <TD className="font-mono">{fmtCurrency(k.bid)}</TD>
                      <TD className="font-mono text-gray-400">
                        {fmtCurrency(k.suggestedBid_rangeStart)} –{" "}
                        {fmtCurrency(k.suggestedBid_rangeEnd)}
                      </TD>
                      <TD className="font-mono">#{k.rank}</TD>
                      <TD onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalCtx({ type: "keyword", value: k.keyword });
                          }}
                          className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          + Target
                        </button>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ASIN suggestion sections */}
      {asinSections.map(({ label, items, key }) =>
        items.length > 0 ? (
          <React.Fragment key={key}>
            <SectionHeader>{label}</SectionHeader>
            <BulkActionBar
              selectedCount={(selectedAsins[key] ?? new Set()).size}
              totalCount={items.length}
              actions={asinBulkActions}
              onSelectAll={(c) =>
                setSelectedAsins((prev) => ({
                  ...prev,
                  [key]: c ? new Set(items.map((_, i) => i)) : new Set(),
                }))
              }
              onClear={() =>
                setSelectedAsins((prev) => ({ ...prev, [key]: new Set() }))
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <TH className="w-8">
                      <Checkbox
                        checked={
                          (selectedAsins[key] ?? new Set()).size === items.length &&
                          items.length > 0
                        }
                        indeterminate={
                          (selectedAsins[key] ?? new Set()).size > 0 &&
                          (selectedAsins[key] ?? new Set()).size < items.length
                        }
                        onChange={(c) =>
                          setSelectedAsins((prev) => ({
                            ...prev,
                            [key]: c ? new Set(items.map((_, i) => i)) : new Set(),
                          }))
                        }
                      />
                    </TH>
                    <TH>ASIN</TH>
                    <TH />
                  </tr>
                </thead>
                <tbody>
                  {items.map((asin, i) => {
                    const isSel = (selectedAsins[key] ?? new Set()).has(i);
                    return (
                      <tr
                        key={i}
                        onClick={() => toggleAsin(key, i)}
                        className={`transition-colors cursor-pointer ${
                          isSel ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                        }`}
                      >
                        <TD>
                          <Checkbox checked={isSel} onChange={() => toggleAsin(key, i)} />
                        </TD>
                        <TD>
                          <span className="font-mono text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {asin}
                          </span>
                        </TD>
                        <TD onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalCtx({ type: "asin", value: asin });
                            }}
                            className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            + Target
                          </button>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </React.Fragment>
        ) : null
      )}
    </div>
  );
};

// ─── Competitor Content ───────────────────────────────────────────────────────

const CompetitorContent: React.FC<{
  asinId:           string;
  rankRecords:      CompetiRankRecord[];
  topCompetitors:   TopCompetitor[];
  isLoading:        boolean;
  error:            Error | null;
  hasFetched:       boolean;
  onFetch:          () => void;
}> = ({
  asinId,
  rankRecords,
  topCompetitors,
  isLoading,
  error,
  hasFetched,
  onFetch,
}) => {
  const [selectedRank,  setSelectedRank]  = useState<Set<number>>(new Set());
  const [selectedRival, setSelectedRival] = useState<Set<number>>(new Set());
  const [modalCtx, setModalCtx]           = useState<CampaignModalContext | null>(null);

  if (!hasFetched) return <FetchPrompt label="Load competitor intel" onFetch={onFetch} />;
  if (isLoading)   return <LoadingState />;
  if (error)       return <ErrorState message={error.message} />;

  const myRankRecords = rankRecords.filter((r) => r.clicked_asin === asinId);
  if (!myRankRecords.length && !topCompetitors.length) return <EmptyState />;

  const toggleRank  = (i: number) =>
    setSelectedRank((p) => { const s = new Set(p); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const toggleRival = (i: number) =>
    setSelectedRival((p) => { const s = new Set(p); s.has(i) ? s.delete(i) : s.add(i); return s; });

  const rankBulkActions: BulkAction[] = [
    { label: "+ Target selected", variant: "green", onClick: () => {} },
    { label: "Export",            variant: "gray",  onClick: () => {} },
  ];
  const rivalBulkActions: BulkAction[] = [
    { label: "Analyze selected", variant: "gray", onClick: () => {} },
  ];

  return (
    <div>
      <CampaignModal context={modalCtx} onClose={() => setModalCtx(null)} />

      {/* Keywords where my ASIN appears */}
      {myRankRecords.length > 0 && (
        <>
          <SectionHeader>Keywords where your ASIN appears</SectionHeader>
          <BulkActionBar
            selectedCount={selectedRank.size}
            totalCount={myRankRecords.length}
            actions={rankBulkActions}
            onSelectAll={(c) =>
              setSelectedRank(c ? new Set(myRankRecords.map((_, i) => i)) : new Set())
            }
            onClear={() => setSelectedRank(new Set())}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <TH className="w-8">
                    <Checkbox
                      checked={
                        selectedRank.size === myRankRecords.length && myRankRecords.length > 0
                      }
                      indeterminate={
                        selectedRank.size > 0 && selectedRank.size < myRankRecords.length
                      }
                      onChange={(c) =>
                        setSelectedRank(c ? new Set(myRankRecords.map((_, i) => i)) : new Set())
                      }
                    />
                  </TH>
                  <TH>Search term</TH>
                  <TH>SFR</TH>
                  <TH>Click share</TH>
                  <TH>Conv. share</TH>
                  <TH>Period</TH>
                  <TH />
                </tr>
              </thead>
              <tbody>
                {myRankRecords.map((r, i) => {
                  const isSel = selectedRank.has(i);
                  return (
                    <tr
                      key={i}
                      onClick={() => toggleRank(i)}
                      className={`transition-colors cursor-pointer ${
                        isSel ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <TD>
                        <Checkbox checked={isSel} onChange={() => toggleRank(i)} />
                      </TD>
                      <TD>{r.search_term}</TD>
                      <TD className="font-mono">#{r.search_frequency_rank}</TD>
                      <TD className="font-mono">{fmtPctFraction(r.click_share)}</TD>
                      <TD className="font-mono">{fmtPctFraction(r.conversion_share)}</TD>
                      <TD className="font-mono text-gray-400">{r.report_period}</TD>
                      <TD onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalCtx({ type: "search_query", value: r.search_term });
                          }}
                          className="text-[11px] px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          + Target
                        </button>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Top competing ASINs */}
      {topCompetitors.length > 0 && (
        <>
          <SectionHeader>Top competing ASINs</SectionHeader>
          <BulkActionBar
            selectedCount={selectedRival.size}
            totalCount={topCompetitors.length}
            actions={rivalBulkActions}
            onSelectAll={(c) =>
              setSelectedRival(c ? new Set(topCompetitors.map((_, i) => i)) : new Set())
            }
            onClear={() => setSelectedRival(new Set())}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <TH className="w-8">
                    <Checkbox
                      checked={
                        selectedRival.size === topCompetitors.length && topCompetitors.length > 0
                      }
                      indeterminate={
                        selectedRival.size > 0 && selectedRival.size < topCompetitors.length
                      }
                      onChange={(c) =>
                        setSelectedRival(c ? new Set(topCompetitors.map((_, i) => i)) : new Set())
                      }
                    />
                  </TH>
                  <TH>Rival ASIN</TH>
                  <TH>Shared keywords</TH>
                  <TH>Avg click share</TH>
                  <TH />
                </tr>
              </thead>
              <tbody>
                {topCompetitors.map((c, i) => {
                  const isSel = selectedRival.has(i);
                  return (
                    <tr
                      key={i}
                      onClick={() => toggleRival(i)}
                      className={`transition-colors cursor-pointer ${
                        isSel ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <TD>
                        <Checkbox checked={isSel} onChange={() => toggleRival(i)} />
                      </TD>
                      <TD>
                        <span className="font-mono text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {c.asin}
                        </span>
                      </TD>
                      <TD className="font-mono">{c.occurrence_count}</TD>
                      <TD className="font-mono">{fmtPctFraction(c.avg_click_share)}</TD>
                      <TD onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalCtx({ type: "asin", value: c.asin });
                          }}
                          className="text-[11px] px-2.5 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Analyze
                        </button>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100">
    {children}
  </div>
);

// ─── ASIN Thumbnail (hover popover escapes overflow:hidden) ───────────────────

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
      <img
        src={src}
        alt={alt}
        className="w-9 h-9 rounded-md object-contain bg-gray-50 border border-gray-100"
      />
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
  asin:              ASIN;
  tab:               TabKey;
  sqpQueries:        SQPSearchQuery[];
  sqpLoading:        boolean;
  sqpError:          Error | null;
  ngramKeywords:     NgramKeyword[];
  ngramLoading:      boolean;
  ngramError:        Error | null;
  ngramTargetAcos:   number;          // derived from user's advertising profile
  rankRecords:       CompetiRankRecord[];
  topCompetitors:    TopCompetitor[];
  competitorLoading: boolean;
  competitorError:   Error | null;
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
  ngramKeywords,
  ngramLoading,
  ngramError,
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
        return <SQPTable queries={sqpQueries} isLoading={sqpLoading} error={sqpError} />;
      case "ngram":
        return (
          <NgramTable
            keywords={ngramKeywords}
            isLoading={ngramLoading}
            error={ngramError}
            targetAcos={ngramTargetAcos}
            currencySymbol={currencySymbol}
          />
        );
      case "target":
        return (
          <TargetContent 
          asinId={asin.id} 
          currencySymbol={currencySymbol}
          />
        );
      case "competitor":
        return (
          <CompetitorContent
            asinId={asin.id}
            rankRecords={rankRecords}
            topCompetitors={topCompetitors}
            isLoading={competitorLoading}
            error={competitorError}
            hasFetched={competitorFetched}
            onFetch={onFetchCompetitor}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3 shadow-sm">
      {/* Card header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Left: chevron + thumbnail + name + ASIN pill */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`text-gray-400 text-xs transition-transform duration-200 shrink-0 ${
              open ? "rotate-90" : ""
            }`}
          >
            ▶
          </span>

          {asin.imageUrl && (
            <AsinThumbnail src={asin.imageUrl} alt={asin.name || asin.id} />
          )}

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

        {/* Right: CTR / CVR */}
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

      {open && (
        <div className="border-t border-gray-100">{renderBody()}</div>
      )}
    </div>
  );
};

// ─── Tab Button ───────────────────────────────────────────────────────────────

const TabButton: React.FC<{
  label:   string;
  active:  boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
      active
        ? "border-[#f5a623] text-gray-900"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    {label}
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "sqp",        label: "SQP gaps" },
  { key: "ngram",      label: "N-gram analysis" },
  { key: "target",     label: "Target finder" },
  { key: "competitor", label: "Competitor intel" },
];

export function OpportunityOptimizer() {
  const { data: asinsData,   isLoading: asinsLoading } = useAllAsins();
  const { data: userProfile }                           = useUserProfile();
  const { currencySymbol } = useCampaignDefaults();

  const [activeTab,  setActiveTab]  = useState<TabKey>("sqp");
  const [asinFilter, setAsinFilter] = useState<string>("all");

  // ── Derive target ACOS from the user's active advertising profile ───────────
  // ConnectedAdvertisingProfile.target_acos is a string ("20", "0.20", "20%")
  const activeAdProfile =
    userProfile?.connected_advertising_profiles?.find((p) => p.is_active) ??
    userProfile?.connected_advertising_profiles?.[0];

  const ngramTargetAcos = parseTargetAcos(activeAdProfile?.target_acos);

  // ── Build top-30 ASIN list ──────────────────────────────────────────────────
  const ASINS: ASIN[] = (asinsData?.results ?? []).slice(0, 30).map((a) => ({
    id:       a.asin,
    name:     a.product_name ?? "",
    imageUrl: a.image_url ?? undefined,
    avgCtr:   "–",
    ctrDelta: "",
    avgCvr:   "–",
    cvrDelta: "",
  }));

  const ALL_ASIN_IDS = ASINS.map((a) => a.id).join(",");

  // ── Feature data hooks ──────────────────────────────────────────────────────
  const sqpQuery   = useSQPOpportunities();
  const ngramQuery = useNgramOpportunities();

  const competiRankQuery    = useCompetiRankData({ asins: ALL_ASIN_IDS });
  const competingAsinsQuery = useCompetingAsins({ asins: ALL_ASIN_IDS });

  const handleFetchCompetitor = () => {
    competiRankQuery.fetchData();
    competingAsinsQuery.fetchData();
  };

  const competitorFetched = competiRankQuery.isEnabled;
  const competitorLoading = competiRankQuery.isLoading || competingAsinsQuery.isLoading;
  const competitorError   = competiRankQuery.error ?? competingAsinsQuery.error;
  const rankRecords       = competiRankQuery.data?.data ?? [];
  const topCompetitors    = competingAsinsQuery.data?.top_competitors ?? [];

  const allSQP           = sqpQuery.data?.search_queries ?? [];
  const allNgramPositive = ngramQuery.data?.ngram_positive ?? [];
  const allNgramNegative = ngramQuery.data?.ngram_negative ?? [];

  // ── Per-ASIN CTR/CVR averages from SQP data ─────────────────────────────────
  const sqpMetricsByAsin = React.useMemo(() => {
    const map: Record<string, { ctrs: number[]; cvrs: number[] }> = {};
    for (const q of allSQP) {
      if (!map[q.asin]) map[q.asin] = { ctrs: [], cvrs: [] };
      if (q.asin_impression_count > 0)
        map[q.asin].ctrs.push((q.asin_click_count / q.asin_impression_count) * 100);
      if (q.asin_conversion != null)
        map[q.asin].cvrs.push(q.asin_conversion);
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
    return m
      ? { ...a, avgCtr: m.avgCtr, ctrDelta: "", avgCvr: m.avgCvr, cvrDelta: "" }
      : a;
  });

  const visibleASINs =
    asinFilter === "all"
      ? enrichedASINs
      : enrichedASINs.filter((a) => a.id === asinFilter);

  // ── Tab change: auto-fetch ngram on first visit ─────────────────────────────
  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    if (key === "ngram" && !ngramQuery.isEnabled) {
      ngramQuery.fetchData();
    }
  };

  if (asinsLoading) return <LoadingState />;

  // ── Render ASIN cards ───────────────────────────────────────────────────────
  const renderCards = () => {
    if (activeTab === "ngram") {
      if (!ngramQuery.isEnabled || ngramQuery.isLoading) return <LoadingState />;
      if (ngramQuery.error) return <ErrorState message={ngramQuery.error.message} />;
    }

    return visibleASINs.map((asin) => {
      const sqpQueries = allSQP.filter((q) => q.asin === asin.id);
      const ngramKeywords = [
        ...allNgramPositive.filter((k) => k.ASIN === asin.id),
        ...allNgramNegative.filter((k) => k.ASIN === asin.id),
      ];
      return (
        <ASINCard
          key={asin.id}
          asin={asin}
          tab={activeTab}
          sqpQueries={sqpQueries}
          sqpLoading={sqpQuery.isLoading}
          sqpError={(sqpQuery.error as Error) ?? null}
          ngramKeywords={ngramKeywords}
          ngramLoading={ngramQuery.isLoading}
          ngramError={ngramQuery.error}
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
      {/* Page header */}
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

          {/* ASIN filter dropdown */}
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
                  {a.id}
                  {a.name
                    ? ` — ${a.name.length > 50 ? `${a.name.slice(0, 50)}…` : a.name}`
                    : ""}
                </option>
              ))}
            </select>
            <span className="text-[11px] bg-white border border-gray-200 text-gray-400 rounded-full px-2.5 py-0.5 shadow-sm">
              {visibleASINs.length} ASIN{visibleASINs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="mx-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Global tab bar */}
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

        {/* ASIN card list */}
        <div className="p-4">{renderCards()}</div>
      </div>

      <div className="h-6" />
    </div>
  );
}