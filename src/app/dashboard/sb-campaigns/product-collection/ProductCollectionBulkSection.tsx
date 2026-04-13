"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ClipboardPaste,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useBulkCampaignStore, today } from "@/lib/store/sbCampaignStore";
import { useSBProductCollectionBulkSubmit } from "@/lib/hooks/sbCampaignHooks";
import { useCampaignDefaults, useSBAssets } from "@/lib/hooks/sbCampaignHooks";
import { useBrands } from "@/lib/hooks/queries/use-assets-brands";
import { CampaignDataTable } from "@/components/dashboard/table/campaign-data-table";
import type {
  CampaignColumnDefinition,
  CampaignTableData,
} from "@/components/dashboard/table/campaign-data-table";
import { AssetSelect } from "../shared/SBFormComponents";

export interface SBProductCollectionBulkRow {
  _id: string;
  _status: "idle" | "loading" | "success" | "error";
  _error?: string;
  _name_edited?: boolean;
  headline: string;
  campaign_name: string;
  brand_name: string;
  brand_entity_id: string;
  ad_asin: string;
  keyword: string;
  match_type: string;
  bid: number;
  brand_logo_asset_id: string;
  custom_image_asset_id: string;
  intent: string;
  budget: number;
  start_date: string;
}

interface SharedDefaults {
  start_date: string;
  brand_name: string;
  brand_entity_id: string; // ← new
  brand_logo_asset_id: string;
}

// ── Columns ───────────────────────────────────────────────────────────────────

const MATCH_OPTIONS = [
  { value: "exact", label: "Exact" },
  { value: "phrase", label: "Phrase" },
  { value: "broad", label: "Broad" },
];

function buildColumns(cur: string): CampaignColumnDefinition[] {
  return [
    {
      field: "campaign_name",
      headerName: "Campaign Name",
      type: "text",
      span: true,
      editable: true,
      sortable: true,
      width: 260,
      minWidth: 180,
      maxWidth: 420,
    },
    {
      field: "headline",
      headerName: "Headline",
      type: "text",
      span: true,
      editable: true,
      filterable: true,
      width: 220,
      minWidth: 160,
    },
    {
      field: "intent",
      headerName: "Intent",
      type: "text",
      span: true,
      editable: true,
      width: 130,
      minWidth: 90,
    },
    {
      field: "custom_image_asset_id",
      headerName: "Custom Image Asset",
      type: "text",
      span: true,
      editable: true,
      width: 200,
      minWidth: 140,
    },
    {
      field: "budget",
      headerName: `Budget (${cur})`,
      type: "number",
      span: true,
      editable: true,
      width: 110,
      minWidth: 80,
    },
    {
      field: "start_date",
      headerName: "Start Date",
      type: "date",
      span: true,
      editable: true,
      width: 140,
    },
    {
      field: "ad_asin",
      headerName: "Ad ASIN",
      type: "text",
      span: false,
      editable: true,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 110,
    },
    {
      field: "keyword",
      headerName: "Keyword",
      type: "text",
      span: false,
      editable: true,
      sortable: true,
      filterable: true,
      width: 180,
      minWidth: 140,
    },
    {
      field: "match_type",
      headerName: "Match",
      type: "dropdown",
      span: false,
      editable: true,
      width: 110,
      minWidth: 90,
      options: MATCH_OPTIONS,
    },
    {
      field: "bid",
      headerName: `Bid (${cur})`,
      type: "number",
      span: false,
      editable: true,
      width: 90,
      minWidth: 70,
    },
    {
      field: "_statusLabel",
      headerName: "Status",
      type: "text",
      span: true,
      editable: false,
      width: 120,
      minWidth: 100,
    },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCampaignName(
  brand: string,
  headline: string,
  kwCount: number,
  intent: string,
): string {
  const label = brand.trim() || headline.trim();
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : "";
  const kwSuffix = kwCount === 1 ? "SK" : "MK";
  return `${label} - SB - PC - ${kwSuffix}${intentSuffix}`;
}

function toStatusLabel(s: string, e?: string) {
  if (s === "loading") return "⏳ Creating…";
  if (s === "success") return "✓ Created";
  if (s === "error") return `✗ ${e ?? "Error"}`;
  return "";
}

function parseLine(
  line: string,
  d: SharedDefaults,
): SBProductCollectionBulkRow | null {
  const cols = line.split("\t").map((c) => c.trim());
  const [
    headline,
    ad_asin,
    keyword,
    matchRaw,
    bidRaw,
    customImageRaw,
    intentRaw,
  ] = cols;
  if (!headline || !ad_asin || !keyword) return null;
  return {
    _id: nanoid(),
    _status: "idle",
    headline,
    campaign_name: "",
    brand_name: d.brand_name,
    brand_entity_id: d.brand_entity_id,
    ad_asin,
    keyword,
    match_type: matchRaw?.toLowerCase() || "exact",
    bid: parseFloat(bidRaw) || 0,
    brand_logo_asset_id: d.brand_logo_asset_id,
    custom_image_asset_id: customImageRaw ?? "",
    intent: intentRaw ?? "",
    budget: 0,
    start_date: d.start_date || today(),
  };
}

function withComputedNames(
  rows: SBProductCollectionBulkRow[],
  brand: string,
): SBProductCollectionBulkRow[] {
  const kwCounts = new Map<string, number>();
  const intentByHeadline = new Map<string, string>();
  for (const r of rows) {
    kwCounts.set(r.headline, (kwCounts.get(r.headline) ?? 0) + 1);
    if (!intentByHeadline.has(r.headline))
      intentByHeadline.set(r.headline, r.intent ?? "");
  }
  return rows.map((r) => ({
    ...r,
    campaign_name: r._name_edited
      ? r.campaign_name // preserve manual edit
      : buildCampaignName(
          brand,
          r.headline,
          kwCounts.get(r.headline) ?? 1,
          intentByHeadline.get(r.headline) ?? "",
        ),
  }));
}

// ── Shared Settings Panel ─────────────────────────────────────────────────────

function SharedSettingsPanel({
  defaults,
  onChange,
}: {
  defaults: SharedDefaults;
  onChange: (p: Partial<SharedDefaults>) => void;
}) {
  const { data: brands = [] } = useBrands();
  const { logos } = useSBAssets(); // ← add this

  const inp =
    "w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition";
  const sel =
    "w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition cursor-pointer";

  function handleBrandChange(brandName: string) {
    const brand = brands.find((b) => b.brand_name === brandName);
    onChange({
      brand_name: brandName,
      brand_entity_id: brand?.brand_entity_id ?? "",
    });
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Default Settings
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Applied to all rows on paste — budget, bid, custom image, and intent
          are set per-campaign in the table
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Brand dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Brand *
            </label>
            <select
              value={defaults.brand_name}
              onChange={(e) => handleBrandChange(e.target.value)}
              className={sel}
            >
              <option value="">Select brand…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.brand_name}>
                  {b.brand_name}
                </option>
              ))}
            </select>
            {defaults.brand_entity_id ? (
              <p
                className="text-[11px] text-slate-400 font-mono truncate"
                title={defaults.brand_entity_id}
              >
                {defaults.brand_entity_id}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Select a brand to auto-fill entity ID
              </p>
            )}
          </div>

          {/* Brand logo asset — now a searchable dropdown */}
          <AssetSelect
            label="Brand Logo Asset *"
            assets={logos.data ?? []}
            value={defaults.brand_logo_asset_id}
            onChange={(v) => onChange({ brand_logo_asset_id: v })}
          />

          {/* Start date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Start Date
            </label>
            <input
              type="date"
              value={defaults.start_date}
              onChange={(e) => onChange({ start_date: e.target.value })}
              className={inp}
            />
            <p className="text-[11px] text-slate-400">
              Applied to all rows on paste
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Paste area ────────────────────────────────────────────────────────────────

function PasteArea({ onPaste }: { onPaste: (t: string) => void }) {
  const [drag, setDrag] = useState(false);
  const [flash, setFlash] = useState(false);
  const handle = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const t = e.clipboardData.getData("text");
      if (t.trim()) {
        onPaste(t);
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
    },
    [onPaste],
  );
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      className={`relative rounded-xl border-2 border-dashed transition-all
        ${drag ? "border-indigo-400 bg-indigo-50" : flash ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-indigo-300"}`}
    >
      <div className="flex flex-col items-center justify-center gap-2 py-8 px-6 pointer-events-none select-none">
        <ClipboardPaste
          className={`h-7 w-7 transition-colors ${drag || flash ? "text-indigo-500" : "text-slate-300"}`}
        />
        <p className="text-sm font-semibold text-slate-600">
          Paste Excel data here
        </p>
        <p className="text-xs text-slate-400 text-center font-mono font-semibold">
          Headline · Ad ASIN · Keyword · Match Type · Bid · Custom Image Asset
          ID · Intent
        </p>
        <div className="flex flex-col items-center gap-1 mt-0.5">
          <p className="text-[11px] text-slate-400 text-center">
            Same Headline = one campaign &nbsp;·&nbsp; Ad ASINs deduplicated, minimum 3 required (last ASIN repeated if needed)
          </p>
          <p className="text-[11px] text-slate-400 text-center">
            Keywords are unlimited — one per row, any number for the same
            headline
          </p>
        </div>
      </div>
      <textarea
        onPaste={handle}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
        readOnly
      />
    </div>
  );
}

function WarningItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs text-amber-600">
      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function SummaryBanner({
  summary,
  onDismiss,
}: {
  summary: { total: number; success: number; failed: number };
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3
      ${summary.failed === 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
    >
      <div className="flex items-center gap-3">
        {summary.failed === 0 ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        )}
        <p className="text-sm font-medium text-slate-700">
          {summary.success} of {summary.total} campaigns created
          {summary.failed > 0 && ` · ${summary.failed} failed`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {summary.failed > 0 && (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Retry Failed
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-2 py-1.5 text-slate-400 hover:text-slate-600"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ProductCollectionBulkSection() {
  const store = useBulkCampaignStore();
  const { minBid, currencySymbol } = useCampaignDefaults();
  const {
    rows,
    submitAll,
    clearSummary,
    isSubmitting,
    summary,
    rowFailedCount,
    rowSuccessCount,
    groupPendingCount,
  } = useSBProductCollectionBulkSubmit();

  const [parseInfo, setParseInfo] = useState<{
    added: number;
    skipped: number;
  } | null>(null);
  const [defaults, setDefaults] = useState<SharedDefaults>(() => ({
    start_date: today(),
    brand_name: "",
    brand_entity_id: "",
    brand_logo_asset_id: "",
  }));
  
  useEffect(() => {
    if (typedRows.length === 0) return
    const updated = typedRows.map((r) => ({
      ...r,
      brand_name:          defaults.brand_name,
      brand_entity_id:     defaults.brand_entity_id,
      brand_logo_asset_id: defaults.brand_logo_asset_id,
    }))
    store.setRows('sb_product_collection' as any, updated as any)
  }, [defaults.brand_name, defaults.brand_entity_id, defaults.brand_logo_asset_id])

  const COLUMNS = useMemo(() => buildColumns(currencySymbol), [currencySymbol]);
  const typedRows = rows as SBProductCollectionBulkRow[];

  const uniqueHeadlines = useMemo(
    () => new Set(typedRows.map((r) => r.headline)).size,
    [rows],
  );

  const underLimitHeadlines = useMemo(() => {
  const map = new Map<string, Set<string>>()
  for (const r of typedRows) {
    if (!map.has(r.headline)) map.set(r.headline, new Set())
    map.get(r.headline)!.add(r.ad_asin)
  }
  return [...map.entries()].filter(([, s]) => s.size < 3).length
}, [rows])

  const missingImageCount = useMemo(
    () =>
      new Set(
        typedRows
          .filter((r) => !r.custom_image_asset_id?.trim())
          .map((r) => r.headline),
      ).size,
    [rows],
  );

  const tableData: CampaignTableData[] = typedRows.map((r) => ({
    _id: r._id,
    campaign_name: r.campaign_name,
    headline: r.headline,
    intent: r.intent,
    custom_image_asset_id: r.custom_image_asset_id,
    budget: r.budget,
    start_date: r.start_date,
    ad_asin: r.ad_asin,
    keyword: r.keyword,
    match_type: r.match_type,
    bid: r.bid,
    _statusLabel: toStatusLabel(r._status, r._error),
  }));

  function handlePaste(text: string) {
    const lines = text.trim().split("\n").filter(Boolean);
    let added = 0,
      skipped = 0;
    const newRows: SBProductCollectionBulkRow[] = [];
    for (const line of lines) {
      const row = parseLine(line, defaults);
      if (!row) {
        skipped++;
        continue;
      }
      newRows.push(row);
      added++;
    }
    const merged = withComputedNames(
      [...typedRows, ...newRows],
      defaults.brand_name,
    );

    // Auto-calculate budget per headline: max(bid) × 15, floor at minBid × 15
    const headlineBids = new Map<string, number[]>();
    for (const r of merged) {
      if (!headlineBids.has(r.headline)) headlineBids.set(r.headline, []);
      if (r.bid > 0) headlineBids.get(r.headline)!.push(r.bid);
    }
    const withBudgets = merged.map((r) => {
      if (r.budget > 0) return r;
      const bids = headlineBids.get(r.headline) ?? [];
      const maxBid = bids.length > 0 ? Math.max(...bids) : 0;
      return {
        ...r,
        budget: maxBid > 0 ? Math.max(minBid * 15, maxBid * 15) : 0,
      };
    });

    store.setRows("sb_product_collection" as any, withBudgets as any);
    setParseInfo({ added, skipped });
    setTimeout(() => setParseInfo(null), 4000);
  }

  function handleTableChange(updated: CampaignTableData[]) {
    const rawRows = updated.map((row) => {
      const existing = typedRows.find((r) => r._id === row._id);
      const nameChanged =
        existing && String(row.campaign_name ?? "") !== existing.campaign_name;
      const intentChanged =
        existing && String(row.intent ?? "") !== existing.intent;

      return {
        _id: String(row._id),
        campaign_name: String(row.campaign_name ?? ""),
        headline: String(row.headline ?? ""),
        intent: String(row.intent ?? ""),
        brand_name: defaults.brand_name,
        brand_entity_id: defaults.brand_entity_id,
        ad_asin: String(row.ad_asin ?? ""),
        keyword: String(row.keyword ?? ""),
        match_type: String(row.match_type ?? "exact"),
        bid: Number(row.bid) || 0,
        custom_image_asset_id: String(row.custom_image_asset_id ?? ""),
        budget: Number(row.budget) || 0,
        start_date: String(row.start_date ?? ""),
        brand_logo_asset_id: defaults.brand_logo_asset_id,
        _status: existing?._status ?? "idle",
        _error: existing?._error,
        // if intent changed, clear the lock so name recomputes from new intent
        _name_edited: intentChanged
          ? false
          : existing?._name_edited || nameChanged,
      };
    });
    const recomputed = withComputedNames(
      rawRows as SBProductCollectionBulkRow[],
      defaults.brand_name,
    );
    store.setRows("sb_product_collection" as any, recomputed as any);
  }

  return (
    <div className="flex flex-col gap-5">
      <SharedSettingsPanel
        defaults={defaults}
        onChange={(p) => setDefaults((prev) => ({ ...prev, ...p }))}
      />

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Paste Excel Data
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            SB Product Collection · Same Headline = one campaign · Ad ASINs
            capped at 3 · Keywords unlimited
          </p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <PasteArea onPaste={handlePaste} />
          {parseInfo && (
            <p className="text-xs text-emerald-600 font-medium">
              ✓ Added {parseInfo.added} row{parseInfo.added !== 1 ? "s" : ""}
              {parseInfo.skipped > 0 &&
                ` · ${parseInfo.skipped} skipped (missing headline, ad ASIN, or keyword)`}
            </p>
          )}
          {underLimitHeadlines > 0 && (
            <WarningItem>
              {underLimitHeadlines} campaign{underLimitHeadlines > 1 ? 's have' : ' has'} fewer than 3 unique Ad ASINs — the last ASIN will be repeated to meet Amazon's minimum of 3.
            </WarningItem>
          )}
          {missingImageCount > 0 && (
            <WarningItem>
              {missingImageCount} campaign
              {missingImageCount !== 1 ? "s are" : " is"} missing a Custom Image
              Asset ID — fill column 6 in your paste or edit in the table.
            </WarningItem>
          )}
          {!defaults.brand_name && (
            <WarningItem>
              Select a brand in Default Settings before pasting — brand name and
              entity ID are required.
            </WarningItem>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-slate-800">
                {uniqueHeadlines} campaign{uniqueHeadlines !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">
                {rows.length} keyword row{rows.length !== 1 ? "s" : ""}
              </span>
              {rowSuccessCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {rowSuccessCount}{" "}
                  created
                </span>
              )}
              {rowFailedCount > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-3.5 w-3.5" /> {rowFailedCount} failed
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                store.clearRows("sb_product_collection" as any);
                clearSummary();
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          <CampaignDataTable
            data={tableData}
            columns={COLUMNS}
            groupByFields={["headline"]}
            onDataChange={handleTableChange}
            showCheckboxColumn
            showDeleteOption
            rowsPerPage={20}
          />

          {summary && (
            <SummaryBanner
              summary={summary}

              onDismiss={clearSummary}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => submitAll("grouped")}
              disabled={
                groupPendingCount === 0 || isSubmitting || !defaults.brand_name
              }
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Creating campaigns…"
                : `Create ${groupPendingCount} Campaign${groupPendingCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
