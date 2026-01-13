"use client";

import { AdvancedDataTable, ColumnDefinition } from "@/components/dashboard/table/dropdown-data-table";
import { useKeywordPerformanceHierarchical, useUpdateKeywordBid } from "@/lib/hooks/useCampaignQueries";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { Loader2, AlertCircle, TrendingUp, DollarSign, Target } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { HierarchicalRow, KeywordMetrics } from "@/lib/api/services/campaign.service";
import { useToast } from "@/components/ui/use-toast";

const KeywordPerformanceTable = () => {
  const { dateRange } = useDateRange();
  const { toast } = useToast();

  // Fetch hierarchical keyword performance data
  const { data, isLoading, isError, error } = useKeywordPerformanceHierarchical({
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
  });

  // Mutation for updating keyword bids
  const updateBidMutation = useUpdateKeywordBid();

  // Local state for table data (to handle optimistic updates)
  const [tableData, setTableData] = useState<HierarchicalRow[]>([]);

  // Update local state when data changes
  useMemo(() => {
    if (data?.data) {
      setTableData(data.data);
    }
  }, [data]);

  // Define columns for the hierarchical table
  const columns: ColumnDefinition[] = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        type: "text",
        sortable: true,
        filterable: true,
        pinned: "left",
        width: 350,
        minWidth: 250,
      },
      {
        field: "campaign_name",
        headerName: "Campaign Name",
        type: "text",
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "match_type",
        headerName: "Match Type",
        type: "text",
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "last_day_top_of_search_impression_share",
        headerName: "TOS %",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
        autoFitHeader: true,
      },
      {
        field: "keyword_bid",
        headerName: "Bid",
        type: "number",
        sortable: true,
        filterable: true,
        editable: true, 
        autoFitHeader: true,
        minWidth: 180,
      },
      {
        field: "impressions",
        headerName: "Impressions",
        type: "number",
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "clicks",
        headerName: "Clicks",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "ctr",
        headerName: "CTR %",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
      },
      {
        field: "cost",
        headerName: "Spend",
        type: "number",
        sortable: true,
        filterable: true,
        width: 130,
      },
      {
        field: "cpc",
        headerName: "CPC",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
      },
      {
        field: "sales_30d",
        headerName: "Sales (30d)",
        type: "number",
        sortable: true,
        filterable: true,
        width: 140,
      },
      {
        field: "purchases_30d",
        headerName: "Orders",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "acos",
        headerName: "ACOS %",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "roas",
        headerName: "ROAS",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
      },
      {
        field: "cvr",
        headerName: "CVR %",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
      },
      {
        field: "cpa",
        headerName: "CPA",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
      },
      
    ],
    []
  );

  // Handle data changes (when user edits a bid)
  const handleDataChange = useCallback(
  async (updatedData: any[]) => {  // Change to any[] or TableData[]
    console.log('Data changed:', updatedData);

    // Cast to your specific type for type safety within the function
    const typedUpdatedData = updatedData as HierarchicalRow[];

    // Find what changed by comparing with current data
    const changes = findChangedBids(tableData, typedUpdatedData);

    if (changes.length === 0) {
      console.log('No bid changes detected');
      return;
    }

    // Update local state immediately (optimistic update)
    setTableData(typedUpdatedData);

    // Process each change
    for (const change of changes) {
      try {
        console.log('Updating bid for keyword:', change.keyword_id, 'from', change.oldBid, 'to', change.newBid);

        await updateBidMutation.mutateAsync({
          keyword_id: change.keyword_id,
          new_bid: change.newBid,
          campaign_id: change.campaign_id,
        });

        toast({
          title: "Bid Updated",
          description: `${change.keyword}: ${change.oldBid} → ${change.newBid}`,
          variant: "default",
        });
      } catch (error) {
        console.error('Failed to update bid:', error);

        // Revert optimistic update on error
        setTableData(tableData);

        toast({
          title: "Update Failed",
          description: error instanceof Error ? error.message : "Failed to update keyword bid",
          variant: "destructive",
        });
      }
    }
  },
  [tableData, updateBidMutation, toast]
);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-600 font-medium">Loading keyword performance data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
        <div className="flex flex-col items-center justify-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div className="text-red-500 text-lg font-semibold">Error Loading Data</div>
          <p className="text-slate-600 text-sm">
            {error instanceof Error ? error.message : "Failed to load keyword performance data"}
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!tableData || tableData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <Target className="h-12 w-12 text-slate-300" />
          <div className="text-slate-700 text-lg font-semibold">No Data Available</div>
          <p className="text-slate-500 text-sm">
            No keyword performance data found for the selected date range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">


      {/* Period Info Card */}
      {data?.period_info && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Current Period</h3>
              <p className="text-xs text-slate-600">
                {data.period_info.current_start} to {data.period_info.current_end} (
                {data.period_info.period_days} days)
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-slate-700">Compared To</h3>
              <p className="text-xs text-slate-600">
                {data.period_info.comparison_start} to {data.period_info.comparison_end}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hierarchical Data Table */}
      <AdvancedDataTable
        data={tableData}
        columns={columns}
        onDataChange={handleDataChange}
        className="shadow-sm"
      />

      {/* Helper text */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Click on ASIN or Campaign rows to expand and view keywords. 
          Click on a bid value to edit it. Changes are saved automatically.
        </p>
      </div>
    </div>
  );
};

export default KeywordPerformanceTable;

// Helper function to find changed bids
function findChangedBids(
  oldData: HierarchicalRow[],
  newData: HierarchicalRow[]
): Array<{
  keyword_id: string;
  keyword: string;
  campaign_id: string;
  oldBid: number;
  newBid: number;
}> {
  const changes: Array<{
    keyword_id: string;
    keyword: string;
    campaign_id: string;
    oldBid: number;
    newBid: number;
  }> = [];

  // Function to check keywords in a group
  const checkKeywords = (oldGroup: HierarchicalRow, newGroup: HierarchicalRow) => {
    if (!oldGroup._children || !newGroup._children) return;

    for (let i = 0; i < oldGroup._children.length; i++) {
      const oldKeyword = oldGroup._children[i];
      const newKeyword = newGroup._children[i];

      if (
        oldKeyword &&
        newKeyword &&
        oldKeyword.keyword_id === newKeyword.keyword_id &&
        oldKeyword.keyword_bid !== newKeyword.keyword_bid
      ) {
        changes.push({
          keyword_id: oldKeyword.keyword_id,
          keyword: oldKeyword.keyword,
          campaign_id: oldKeyword.campaign_id,
          oldBid: oldKeyword.keyword_bid,
          newBid: newKeyword.keyword_bid,
        });
      }
    }
  };

  // Compare each group
  for (let i = 0; i < oldData.length && i < newData.length; i++) {
    if (oldData[i].id === newData[i].id) {
      checkKeywords(oldData[i], newData[i]);
    }
  }

  return changes;
}