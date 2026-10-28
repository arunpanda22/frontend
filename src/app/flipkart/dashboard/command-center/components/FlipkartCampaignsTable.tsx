"use client";

/**
 * FlipkartCampaignsTable: one row per campaign for the selected date range.
 * Flipkart counterpart of Amazon's CampaignAdsSummary.
 *
 * Place at: src/app/flipkart/dashboard/command-center/components/FlipkartCampaignsTable.tsx
 *
 * DATA: GET /api/v1/fk/dashboard/campaigns/ via useFlipkartCampaigns (date range from DateRangeContext).
 *   Each row already has the derived metrics computed by the backend from the campaign's own sums.
 *
 * DIFFERENCES FROM THE AMAZON TABLE
 *   - No Tag column (Flipkart has no campaign tags).
 *   - Extra Status and Type columns from CampaignName. A campaign with no CampaignName row yet has
 *     status / type "UNKNOWN": those cells are shown as "-" and the name falls back to the campaign id.
 *   - Numeric cells are real numbers so sorting and number filters work (see flipkart-table-utils.ts).
 *   - The default sort is Revenue, highest first (the backend order is by impressions).
 */
import React, { useMemo } from "react";
import type { ColumnDefinition, TableData } from "@/components/dashboard/table/advanced-data-table";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useFlipkartCampaigns } from "@/lib/hooks/queries/use-flipkart-dashboard";
import FlipkartDataTableCard from "./FlipkartDataTableCard";
import { blankIfUnknown, buildMetricCells, buildMetricColumns } from "./flipkart-table-utils";

const COLUMNS: ColumnDefinition[] = [
  {
    field: "campaign_name",
    headerName: "Campaign",
    type: "text",
    editable: false,
    sortable: true,
    filterable: true,
    width: 280,
    minWidth: 200,
    pinned: "left",
  },
  { field: "status", headerName: "Status", type: "text", editable: false, sortable: true, filterable: true, autoFitHeader: true },
  { field: "campaign_type", headerName: "Type", type: "text", editable: false, sortable: true, filterable: true, autoFitHeader: true },
  ...buildMetricColumns(),
];

interface FlipkartCampaignsTableProps {
  /** FlipkartAdAccount UUID. Omit to use the user's oldest active ad account. */
  adsTenant?: string;
}

export default function FlipkartCampaignsTable({ adsTenant }: FlipkartCampaignsTableProps) {
  const { dateRange } = useDateRange();
  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const { data, isLoading, isError, error } = useFlipkartCampaigns(
    { start_date: startDate, end_date: endDate, ads_tenant: adsTenant },
    !!(startDate && endDate)
  );

  const rows: TableData[] = useMemo(
    () =>
      (data?.campaigns ?? []).map((campaign) => ({
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        status: blankIfUnknown(campaign.status),
        campaign_type: blankIfUnknown(campaign.campaign_type),
        ...buildMetricCells(campaign),
      })),
    [data]
  );

  return (
    <FlipkartDataTableCard
      title="Campaign Ads Summary"
      summary={data ? `${rows.length} campaigns` : undefined}
      dateLabel={`${startDate} to ${endDate}`}
      isLoading={isLoading || (!data && !isError)}
      isError={isError}
      errorMessage={error?.message}
      rows={rows}
      columns={COLUMNS}
      rowKey="campaign_id"
      initialSort={[{ field: "revenue", direction: "desc" }]}
      filename="flipkart-campaigns"
      emptyMessage="No campaigns had activity in the selected date range"
      footerNote="Metrics are summed over the selected date range. Units and revenue combine direct and indirect conversions. CTR, CVR and ACOS are percentages; ROAS is revenue per rupee spent. A dash in Status or Type means that campaign's details have not synced yet."
    />
  );
}