/**
 * flipkart-table-utils.ts: pure helpers shared by the two Flipkart tables
 * (FlipkartCampaignsTable and FlipkartCampaignPlacementsTable).
 *
 * WHY THIS EXISTS
 * Both tables show the same ten metric columns for a different row grain (campaign, or
 * campaign x placement). The column definitions and the metric-to-cell mapping live here once.
 *
 * HOW AdvancedDataTable BEHAVES (it drives every choice below)
 *   - A cell is displayed with String(value) and there is no custom cell renderer.
 *   - Sorting and number filters read the SAME field that is displayed. So numeric columns get
 *     real numbers (they sort and filter correctly) and are NOT pre-formatted strings like "1,234"
 *     (those sort alphabetically and break number filters).
 *   - An empty string is shown as "-". That is how an UNKNOWN status / type is hidden.
 *   - Money and ratios are rounded to 2 decimals here so the raw numbers stay readable.
 *
 * Optional improvement (not applied): adding a `valueFormatter` to ColumnDefinition in
 * advanced-data-table.tsx would allow "1,234" style display while sorting on the raw number.
 */
import type { ColumnDefinition, TableData } from "@/components/dashboard/table/advanced-data-table";
import type { FlipkartMetrics } from "@/lib/api/services/flipkart-dashboard.service";
import { CURRENCY_SYMBOL, UNKNOWN_VALUE } from "./flipkart-constants";

/** Rounds to 2 decimals and returns a number (not a string), so sorting / filtering stay numeric. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

/** "UNKNOWN" (or empty) becomes "" so the table shows "-" instead of printing the sentinel. */
export function blankIfUnknown(value: string | null | undefined): string {
  return !value || value === UNKNOWN_VALUE ? "" : value;
}

/** The ten metric columns, in display order. Field names are lower-case versions of the API keys. */
export function buildMetricColumns(): ColumnDefinition[] {
  const numberColumn = (field: string, headerName: string): ColumnDefinition => ({
    field,
    headerName,
    type: "number",
    editable: false,
    sortable: true,
    filterable: true,
    autoFitHeader: true,
  });

  return [
    numberColumn("impressions", "Impressions"),
    numberColumn("clicks", "Clicks"),
    numberColumn("ctr", "CTR %"),
    numberColumn("spend", `Spend (${CURRENCY_SYMBOL})`),
    numberColumn("cpc", `CPC (${CURRENCY_SYMBOL})`),
    numberColumn("units", "Units"),
    numberColumn("cvr", "CVR %"),
    numberColumn("revenue", `Revenue (${CURRENCY_SYMBOL})`),
    numberColumn("roas", "ROAS"),
    numberColumn("acos", "ACOS %"),
  ];
}

/** Maps one API row's metrics to the table cells created by buildMetricColumns(). */
export function buildMetricCells(row: FlipkartMetrics): TableData {
  return {
    impressions: row.Impressions,
    clicks: row.Clicks,
    ctr: round2(row.CTR),
    spend: round2(row.Spend),
    cpc: round2(row.CPC),
    units: row.Units,
    cvr: round2(row.CVR),
    revenue: round2(row.Revenue),
    roas: round2(row.ROAS),
    acos: round2(row.ACOS),
  };
}