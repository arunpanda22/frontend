"use client";

/**
 * FlipkartCampaignPlacementsTable: one row per (campaign, placement type) for the selected date range,
 * e.g. campaign "Summer Sale" x "Top of Search Listings Page".
 *
 * Place at: src/app/flipkart/dashboard/command-center/components/FlipkartCampaignPlacementsTable.tsx
 *
 * DATA: GET /api/v1/fk/dashboard/campaign-placements/ via useFlipkartCampaignPlacements.
 *   The backend sums the fine-grained PlacementsReport rows (ad group, product, banner) per
 *   (campaign, placement type). Units and revenue are direct + indirect combined.
 *
 * ORDER: the backend sends rows of one campaign together (campaigns ordered by total spend, placements
 *   by spend inside a campaign). This table deliberately sets NO initial sort so that grouping is kept;
 *   clicking a column header re-sorts as usual.
 */
import React, { useMemo } from "react";
import type { ColumnDefinition, TableData } from "@/components/dashboard/table/advanced-data-table";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useFlipkartCampaignPlacements } from "@/lib/hooks/queries/use-flipkart-dashboard";
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
  { field: "placement_type", headerName: "Placement", type: "text", editable: false, sortable: true, filterable: true, width: 240, minWidth: 180 },
  { field: "status", headerName: "Status", type: "text", editable: false, sortable: true, filterable: true, autoFitHeader: true },
  { field: "campaign_type", headerName: "Type", type: "text", editable: false, sortable: true, filterable: true, autoFitHeader: true },
  ...buildMetricColumns(),
];

interface FlipkartCampaignPlacementsTableProps {
  /** FlipkartAdAccount UUID. Omit to use the user's oldest active ad account. */
  adsTenant?: string;
}

export default function FlipkartCampaignPlacementsTable({ adsTenant }: FlipkartCampaignPlacementsTableProps) {
  const { dateRange } = useDateRange();
  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const { data, isLoading, isError, error } = useFlipkartCampaignPlacements(
    { start_date: startDate, end_date: endDate, ads_tenant: adsTenant },
    !!(startDate && endDate)
  );

  const rows: TableData[] = useMemo(
    () =>
      (data?.placements ?? []).map((row) => ({
        // (campaign_id, placement_type) is unique in the response: used as the table's row key.
        row_key: `${row.campaign_id}|${row.placement_type}`,
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        placement_type: row.placement_type,
        status: blankIfUnknown(row.status),
        campaign_type: blankIfUnknown(row.campaign_type),
        ...buildMetricCells(row),
      })),
    [data]
  );

  return (
    <FlipkartDataTableCard
      title="Campaign Placement Performance"
      summary={data ? `${rows.length} campaign / placement rows` : undefined}
      dateLabel={`${startDate} to ${endDate}`}
      isLoading={isLoading || (!data && !isError)}
      isError={isError}
      errorMessage={error?.message}
      rows={rows}
      columns={COLUMNS}
      rowKey="row_key"
      filename="flipkart-campaign-placements"
      emptyMessage="No placement data in the selected date range"
      footerNote="Rows are grouped by campaign (highest spend first) and sorted by spend within each campaign; click a column header to re-sort. Units and revenue combine direct and indirect conversions."
    />
  );
}