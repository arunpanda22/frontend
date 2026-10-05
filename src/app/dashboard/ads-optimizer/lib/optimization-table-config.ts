/**
 * optimization-table-config.ts
 * ---------------------------------------------------------------------------
 * Single source of truth for the Ads Optimizer results page's *static* config:
 *
 *   1. SECTION / TAB LAYOUT   – which ad-type sections exist (SP / SB / SD) and
 *                               which category tabs live inside each one.
 *   2. COLUMN_MAPPINGS        – AdvancedDataTable column definitions per category.
 *   3. validateData()         – pre-save / pre-push validation rules per category.
 *   4. generateRowKey()       – guaranteed-unique `_rowKey` for AdvancedDataTable.
 *
 * Consumers:
 *   - results/page.tsx
 *   - components/OptimizationSection.tsx
 *   - components/OptimizationTablePanel.tsx
 *
 * AI-AGENT NOTES
 *   - To add a new category: add its key to OptimizationKey (in
 *     use-ads-optimizer-store), add a COLUMN_MAPPINGS entry, add it to the right
 *     section in OPTIMIZATION_SECTIONS, and add validation if it is editable.
 *   - Field names in COLUMN_MAPPINGS must match the backend response keys
 *     EXACTLY (including odd ones like 'New bid', 'ideal bid', 'Budget Change (%)').
 *   - This file is intentionally JSX-free (.ts) – icons are referenced as
 *     component constructors, not elements.
 */

import {
  DollarSign, Target, MapPin, Sparkles, XCircle,
  Tag, Award, Pin, Star, StopCircle,
  Monitor, Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import type { OptimizationKey } from "@/lib/hooks/use-ads-optimizer-store";

// ==================== SECTION / TAB LAYOUT ====================

/** One tab inside a section. */
export interface CategoryTabConfig {
  /** Store key – also the key into COLUMN_MAPPINGS. */
  key: OptimizationKey;
  /** Full title – used in panel header, confirm dialogs, failed-items modal. */
  title: string;
  /** Short label – used on the tab itself (the section already says SP/SB/SD). */
  shortLabel: string;
  icon: LucideIcon;
}

/** One vertically-stacked section (Sponsored Products / Brands / Display). */
export interface SectionConfig {
  prefix: "sp" | "sb" | "sd";
  label: string;
  categories: CategoryTabConfig[];
}

/** Cast helper – keeps the config readable without repeating `as OptimizationKey`. */
const k = (key: string) => key as OptimizationKey;

/**
 * Render order = top-to-bottom on the page.
 * SP and SB have 5 tabs each; SD has 2 (no placement / new campaigns / negatives).
 */
export const OPTIMIZATION_SECTIONS: SectionConfig[] = [
  {
    prefix: "sp",
    label: "Sponsored Products",
    categories: [
        { key: k("sp_bid"),           title: "SP Bid Optimizations",        shortLabel: "Bids",          icon: Target     },
        { key: k("sp_placement"),     title: "SP Placement Adjustments",    shortLabel: "Placement",     icon: MapPin     },
        { key: k("sp_new_campaigns"), title: "SP New Campaign Suggestions", shortLabel: "New Campaigns", icon: Sparkles   },
        { key: k("sp_negatives"),     title: "SP Negative Keywords",        shortLabel: "Negatives",     icon: XCircle    },
        { key: k("sp_budget"),        title: "SP Budget Adjustments",       shortLabel: "Budget",        icon: DollarSign },
    ],
  },
  {
    prefix: "sb",
    label: "Sponsored Brands",
    categories: [
        { key: k("sb_bid"),           title: "SB Bid Optimizations",        shortLabel: "Bids",          icon: Award      },
        { key: k("sb_placement"),     title: "SB Placement Adjustments",    shortLabel: "Placement",     icon: Pin        },
        { key: k("sb_new_campaigns"), title: "SB New Campaign Suggestions", shortLabel: "New Campaigns", icon: Star       },
        { key: k("sb_negatives"),     title: "SB Negative Keywords",        shortLabel: "Negatives",     icon: StopCircle },
        { key: k("sb_budget"),        title: "SB Budget Adjustments",       shortLabel: "Budget",        icon: Tag        },
    ],
  },
  {
    prefix: "sd",
    label: "Sponsored Display",
    categories: [
        { key: k("sd_bid"),    title: "SD Bid Optimizations",  shortLabel: "Bids",   icon: Palette },
        { key: k("sd_budget"), title: "SD Budget Adjustments", shortLabel: "Budget", icon: Monitor },
    ],
  },
];

/** Flat list of every category key across all sections. */
export const ALL_CATEGORY_KEYS: OptimizationKey[] = OPTIMIZATION_SECTIONS.flatMap(
  (s) => s.categories.map((c) => c.key),
);

/** Lookup: category key → full title ("" if unknown). */
export function getCategoryTitle(key: OptimizationKey | null): string {
  if (!key) return "";
  for (const section of OPTIMIZATION_SECTIONS) {
    const hit = section.categories.find((c) => c.key === key);
    if (hit) return hit.title;
  }
  return "";
}

// ==================== COLUMN MAPPINGS ====================

export const COLUMN_MAPPINGS: Record<string, ColumnDefinition[]> = {
  sp_budget: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', width: 160 },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'dynamic_bidding', headerName: 'Bidding Strategy', type: 'text', editable: false, width: 160, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS (%)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'New Budget', headerName: 'Revised Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Budget Change (%)', headerName: 'Budget Change (%)', type: 'text', editable: false, width: 160, autoFitHeader: true },
    { field: 'cost', headerName: 'Spend', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'sales_30d', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 140, autoFitHeader: true },
  ],
  sb_budget: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', width: 160 },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'dynamic_bidding', headerName: 'Bidding Strategy', type: 'text', editable: false, width: 160, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS (%)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'New Budget', headerName: 'Revised Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Budget Change (%)', headerName: 'Budget Change (%)', type: 'text', editable: false, width: 160, autoFitHeader: true },
    { field: 'cost', headerName: 'Spend', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 140, autoFitHeader: true },
  ],
  sd_budget: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', width: 160 },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS (%)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'New Budget', headerName: 'Revised Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Budget Change (%)', headerName: 'Budget Change (%)', type: 'text', editable: false, width: 160, autoFitHeader: true },
    { field: 'cost', headerName: 'Spend', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 140, autoFitHeader: true },
  ],
  sp_bid: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group Name', type: 'text', editable: false, autoFitHeader: true },
    { field: 'keyword', headerName: 'Keyword', type: 'text', editable: false, autoFitHeader: true },
    { field: 'targeting', headerName: 'Targeting', type: 'text', editable: false, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'purchases_30d', headerName: 'Orders (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales_30d', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'keyword_bid', headerName: 'Present Bid', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'New bid', headerName: 'Revised Bid', type: 'number', editable: true, width: 150, autoFitHeader: true },
    { field: 'Bid Change (%)', headerName: 'Bid Change (%)', type: 'text', editable: false, width: 140, autoFitHeader: true },
  ],
  sb_bid: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group Name', type: 'text', editable: false, autoFitHeader: true },
    { field: 'keyword_text', headerName: 'Keyword', type: 'text', editable: false, autoFitHeader: true },
    { field: 'targeting_expression', headerName: 'Targeting', type: 'text', editable: false, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'purchases', headerName: 'Orders (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'keyword_bid', headerName: 'Present Bid', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'New bid', headerName: 'Revised Bid', type: 'number', editable: true, width: 150, autoFitHeader: true },
    { field: 'Bid Change (%)', headerName: 'Bid Change (%)', type: 'text', editable: false, width: 140, autoFitHeader: true },
  ],
  sd_bid: [
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group Name', type: 'text', editable: false, autoFitHeader: true },
    { field: 'targeting_expression', headerName: 'Targeting', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'cpc', headerName: 'CPC', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'purchases', headerName: 'Orders (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'acos', headerName: 'ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'bid', headerName: 'Present Bid', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'ideal bid', headerName: 'Revised Bid', type: 'number', editable: true, width: 150, autoFitHeader: true },
  ],
  sp_placement: [
    { field: 'ASIN_Derived', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'placement_classification', headerName: 'Placement', type: 'text', editable: false, autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales_30d', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'purchases_30d', headerName: 'Orders (30d)', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'Percentage', headerName: 'Bid Adjustment (%)', type: 'number', editable: true, width: 180, autoFitHeader: true },
  ],
  sb_placement: [
    { field: 'ASIN_Derived', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'placement_classification', headerName: 'Placement', type: 'text', editable: false, autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'purchases', headerName: 'Orders', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'units_sold', headerName: 'Units Sold', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'Percentage', headerName: 'Bid Adjustment (%)', type: 'number', editable: true, width: 180, autoFitHeader: true },
  ],
  sp_new_campaigns: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'Campaign Name', headerName: 'Campaign Name', type: 'text', editable: true, autoFitHeader: true },
    { field: 'Targeting', headerName: 'Target', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'Type', headerName: 'Targeting Type', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, width: 130, autoFitHeader: true },
    { field: 'Bid', headerName: 'Bid', type: 'number', editable: true, width: 120, autoFitHeader: true },
    { field: 'Campaign Budget', headerName: 'Campaign Budget', type: 'number', editable: true, width: 120, autoFitHeader: true },
    { field: 'Bidding Strategy', headerName: 'Bidding Strategy', type: 'text', editable: true, width: 120, autoFitHeader: true },
    { field: 'Top of Search Amazon', headerName: 'Top of Search Amazon', type: 'number', editable: true, width: 120, autoFitHeader: true },
    { field: 'Rest of Search Amazon', headerName: 'Rest of Search Amazon', type: 'number', editable: true, width: 120, autoFitHeader: true },
    { field: 'Product Pages Amazon', headerName: 'Product Pages Amazon', type: 'number', editable: true, width: 120, autoFitHeader: true },
  ],
  sb_new_campaigns: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'Campaign Name', headerName: 'Campaign Name', type: 'text', editable: true, autoFitHeader: true },
    { field: 'Campaign Budget', headerName: 'Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Targeting', headerName: 'Target', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, width: 130, autoFitHeader: true },
    { field: 'Ad Type', headerName: 'Ad Type', type: 'text', editable: false, width: 150, autoFitHeader: true },
    { field: 'video_asset_id', headerName: 'Asset id', type: 'text', editable: false, width: 150, autoFitHeader: true },
    { field: 'Bid', headerName: 'Bid', type: 'number', editable: true, width: 120, autoFitHeader: true },
  ],
  sp_negatives: [
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_id', headerName: 'Campaign ID', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'ad_group_id', headerName: 'Ad Group ID', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'search_term', headerName: 'Search Term', type: 'text', editable: false, width: 250, autoFitHeader: true },
  ],
  sb_negatives: [
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_id', headerName: 'Campaign ID', type: 'text', editable: false, autoFitHeader: true },
    // { field: 'ad_group_name', headerName: 'Ad Group', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'ad_group_id', headerName: 'Ad Group ID', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'search_term', headerName: 'Search Term', type: 'text', editable: false, width: 250, autoFitHeader: true },
  ],
};

// ==================== VALIDATION ====================

/** A single validation failure. `row` is the 0-based index in the working copy. */
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Validate the working copy of a category before Save / Push.
 * Rules are keyed off substrings of `categoryKey` ('budget', 'bid',
 * 'placement', 'new_campaigns', 'negatives'). Returns [] when everything is valid.
 */
export function validateData(data: TableData[], categoryKey: string): ValidationError[] {
  const errors: ValidationError[] = [];
  data.forEach((row, index) => {
    if (categoryKey.includes('budget')) {
      const v = row['New Budget'];
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (isNaN(n) || n < 1)
          errors.push({ row: index, field: 'New Budget', message: 'Budget must be at least $1' });
      }
    }
    if (categoryKey.includes('bid')) {
      const field = categoryKey === 'sd_bid' ? 'ideal bid' : 'New bid';
      const v = row[field];
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (isNaN(n) || n < 0.02)
          errors.push({ row: index, field, message: 'Bid must be at least $0.02' });
      }
    }
    if (categoryKey.includes('placement')) {
      const v = row['Percentage'];
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (isNaN(n) || n < -99 || n > 900)
          errors.push({ row: index, field: 'Percentage', message: 'Must be between -99% and 900%' });
      }
    }
    if (categoryKey.includes('new_campaigns')) {
      const budget = Number(row['Campaign Budget']);
      if (isNaN(budget) || budget < 1)
        errors.push({ row: index, field: 'Campaign Budget', message: 'Budget must be at least $1' });
      const bid = Number(row['Bid']);
      if (isNaN(bid) || bid < 0.02)
        errors.push({ row: index, field: 'Bid', message: 'Bid must be at least $0.02' });
      if (!row['Campaign Name'] || String(row['Campaign Name']).trim() === '')
        errors.push({ row: index, field: 'Campaign Name', message: 'Campaign name is required' });
    }
    if (categoryKey.includes('negatives')) {
      // NOTE: sb_negatives validates 'query' while its column shows 'search_term'.
      // Preserved from the original drawer – verify against the SB negatives payload.
      const field = categoryKey === 'sp_negatives' ? 'search_term' : 'query';
      if (!row[field] || String(row[field]).trim() === '')
        errors.push({ row: index, field, message: 'Search term is required' });
      if (!row['campaign_id'])
        errors.push({ row: index, field: 'campaign_id', message: 'Campaign ID is required' });
      if (!row['ad_group_id'])
        errors.push({ row: index, field: 'ad_group_id', message: 'Ad Group ID is required' });
    }
  });
  return errors;
}

// ==================== UNIQUE ROW KEY ====================

/**
 * Build the `_rowKey` that AdvancedDataTable uses for selection / deletion.
 * Always appends `|idx:{index}` so keys stay unique even when the business
 * fields (campaign_id + ad_group_id, ...) are identical across rows.
 */
export function generateRowKey(row: TableData, categoryKey: string, index: number): string {
  const parts: string[] = [];
  if (row.campaign_id) parts.push(`c:${row.campaign_id}`);
  if ((categoryKey.includes('bid') || categoryKey.includes('negatives')) && row.ad_group_id)
    parts.push(`ag:${row.ad_group_id}`);
  if (categoryKey.includes('bid') && row.targeting_id)
    parts.push(`t:${row.targeting_id}`);
  if (categoryKey.includes('negatives') && row.keyword_text)
    parts.push(`kw:${row.keyword_text}`);
  if (categoryKey.includes('placement') && row.placement_type)
    parts.push(`p:${row.placement_type}`);
  parts.push(`idx:${index}`);
  return parts.join('|');
}