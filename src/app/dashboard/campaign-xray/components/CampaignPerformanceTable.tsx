"use client";

import { AdvancedDataTable, ColumnDefinition } from "@/components/dashboard/table/dropdown-data-table";
import { useKeywordPerformanceHierarchical, usePushKeywordBids } from "@/lib/hooks/useCampaignQueries";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { Loader2, AlertCircle, Target, Save, X, CheckCircle } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { HierarchicalRow, BidChange, campaignService } from "@/lib/api/services/campaign.service";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const KeywordPerformanceTable = () => {
  const { dateRange } = useDateRange();
  const { toast } = useToast();

  // Fetch hierarchical keyword performance data
  const { data, isLoading, isError, error, refetch } = useKeywordPerformanceHierarchical({
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
  });

  // Mutation for pushing keyword bids
  const pushBidsMutation = usePushKeywordBids();

  // Local state for table data (to handle optimistic updates)
  const [tableData, setTableData] = useState<HierarchicalRow[]>([]);
  
  // Track pending bid changes
  const [pendingChanges, setPendingChanges] = useState<Map<string, BidChange>>(new Map());
  
  // Track edited rows (selected rows)
  const [editedRowIds, setEditedRowIds] = useState<Set<string>>(new Set());
  
  // Push result state
  const [pushResult, setPushResult] = useState<any>(null);

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
    (updatedData: any[]) => {
      const typedUpdatedData = updatedData as HierarchicalRow[];
      
      // Find what changed by comparing with original data
      const changes = findChangedBids(data?.data || [], typedUpdatedData);
      
      if (changes.length === 0) {
        return;
      }

      // Update local state immediately (optimistic update)
      setTableData(typedUpdatedData);

      // Add changes to pending changes map
      setPendingChanges(prev => {
        const newMap = new Map(prev);
        changes.forEach(change => {
          newMap.set(change.keyword_id, change);
        });
        return newMap;
      });

      // Track edited rows
      setEditedRowIds(prev => {
        const newSet = new Set(prev);
        changes.forEach(change => newSet.add(change.keyword_id));
        return newSet;
      });
    },
    [data?.data]
  );

  // Handle edited rows change (when rows are selected/deselected)
  const handleEditedRowsChange = useCallback((editedRows: Set<number>) => {
    // This gets called by the table when rows are selected
  }, []);

  // Save all pending changes
  const handleSaveChanges = useCallback(async (dryrun: boolean = false) => {
    if (pendingChanges.size === 0) {
      toast({
        title: "No Changes",
        description: "There are no pending bid changes to save.",
        variant: "default",
      });
      return;
    }

    const changesArray = Array.from(pendingChanges.values());
    
    try {
      setPushResult(null);
      
      // Show loading toast
      toast({
        title: dryrun ? "Testing Changes" : "Saving Changes",
        description: `${dryrun ? 'Testing' : 'Updating'} ${changesArray.length} keyword bid(s)...`,
      });

      // Transform to API format using service helper
      const bidUpdates = campaignService.transformBidChangesToPayload(pendingChanges);
      
      // Push to API using mutation
      const result = await pushBidsMutation.mutateAsync({
        data: bidUpdates,
        dryrun,
      });
      
      console.log('Push result:', result);
      setPushResult(result);

      if (dryrun) {
        // Dry run - show validation success
        toast({
          title: "Validation Successful",
          description: `${changesArray.length} bid change(s) validated successfully. Ready to push.`,
          variant: "default",
        });
      } else {
        // Actual push - clear pending changes and refetch data
        setPendingChanges(new Map());
        setEditedRowIds(new Set());
        
        // Refetch data to get updated values (query will be invalidated by mutation)
        await refetch();
        
        toast({
          title: "Changes Saved",
          description: `Successfully updated ${changesArray.length} keyword bid(s).`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save bid changes",
        variant: "destructive",
      });
    }
  }, [pendingChanges, toast, refetch, pushBidsMutation]);

  // Cancel all pending changes
  const handleCancelChanges = useCallback(() => {
    // Revert to original data
    if (data?.data) {
      setTableData(data.data);
    }
    setPendingChanges(new Map());
    setEditedRowIds(new Set());
    setPushResult(null);
    
    toast({
      title: "Changes Cancelled",
      description: "All pending bid changes have been reverted.",
      variant: "default",
    });
  }, [data?.data, toast]);

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
      {/* Pending Changes Banner */}
      {pendingChanges.size > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 rounded-full p-2">
                <Save className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {pendingChanges.size} Unsaved Change{pendingChanges.size !== 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-slate-600">
                  Review your bid changes and save when ready
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelChanges}
                disabled={pushBidsMutation.isPending}
                className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveChanges(true)}
                disabled={pushBidsMutation.isPending}
                className="bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-700 font-medium"
              >
                {pushBidsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Dry Run
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveChanges(false)}
                disabled={pushBidsMutation.isPending}
                className="bg-green-500 hover:bg-green-600 text-white font-medium shadow-sm"
              >
                {pushBidsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
          
          {/* Changes Summary */}
          {pendingChanges.size > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <div className="text-xs font-semibold text-slate-700 mb-2">Pending Changes:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {Array.from(pendingChanges.values()).map(change => (
                  <div key={change.keyword_id} className="bg-white rounded px-3 py-2 text-xs border border-amber-200">
                    <div className="font-medium text-slate-800 truncate">{change.keyword}</div>
                    <div className="text-slate-600">
                      ${change.oldBid.toFixed(2)} → ${change.newBid.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Push Result Banner */}
      {pushResult && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-300 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-2">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800">
                {pushResult.message}
              </h3>
              <p className="text-xs text-slate-600">
                Push ID: {pushResult.push_id} • {pushResult.total_items} items • 
                S3: {pushResult.s3_location.bucket}/{pushResult.s3_location.key}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPushResult(null)}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Lambda Response Details */}
          {pushResult.lambda_response && pushResult.lambda_response !== 'Skipped (dryrun mode)' && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <details className="text-xs">
                <summary className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                  View Lambda Response
                </summary>
                <pre className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 overflow-x-auto">
                  {JSON.stringify(pushResult.lambda_response, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

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
        onEditedRowsChange={handleEditedRowsChange}
        className="shadow-sm"
      />

      {/* Helper text */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Click on ASIN or Campaign rows to expand and view keywords. 
          Click on a bid value to edit it. Use "Dry Run" to test changes without applying them, 
          or "Save Changes" to push all changes at once.
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
): BidChange[] {
  const changes: BidChange[] = [];

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
          ad_group_id: oldKeyword.ad_group_id,
          match_type: oldKeyword.match_type,
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