"use client";

import { AdvancedDataTable, ColumnDefinition } from "@/components/dashboard/table/dropdown-data-table";
import { useKeywordPerformanceHierarchical, usePushKeywordBids } from "@/lib/hooks/useCampaignQueries";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { Loader2, AlertCircle, Target, Save, X, CheckCircle, Info } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { 
  HierarchicalRow, 
  BidChange, 
  campaignService,
  KeywordMetrics,
  getSourceLabel,
  getSourceColor,
  isSponsoredBrand,
  KeywordSource,
} from "@/lib/api/services/campaign.service";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  // Track pending bid changes (Map: keyword_id -> BidChange)
  const [pendingChanges, setPendingChanges] = useState<Map<string, BidChange>>(new Map());
  
  // Track edited rows for highlighting (Set of keyword_ids)
  const [editedRowIds, setEditedRowIds] = useState<Set<string>>(new Set());
  
  // Push result state
  const [pushResult, setPushResult] = useState<any>(null);

  // Update local state when data changes and add highlighting flags
  useMemo(() => {
    if (data?.data) {
      const processedData = data.data.map(group => {
        if (!group._children) return group;
        
        const processedChildren = group._children.map(keyword => {
          // Add highlight flag for edited keywords
          if (editedRowIds.has(keyword.keyword_id)) {
            return { ...keyword, _highlighted: true };
          }
          return keyword;
        });
        
        return { ...group, _children: processedChildren };
      });
      
      setTableData(processedData);
    }
  }, [data, editedRowIds]);

  // Custom cell renderer for Source badge
  const renderSourceCell = useCallback((row: any) => {
    if (row.type !== "keyword" || !row.source) return null;
    
    const source = row.source as KeywordSource;
    const label = getSourceLabel(source);
    const colorClass = getSourceColor(source);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`text-xs font-medium px-2 py-0.5 ${colorClass}`}
            >
              {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {source === "sp_keyword" && "Sponsored Product - Keyword Targeting"}
              {source === "sp_expression" && "Sponsored Product - Auto/Product Targeting"}
              {source === "sb" && "Sponsored Brand Campaign"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }, []);

  // Custom cell renderer for Cost Type (SB only)
  const renderCostTypeCell = useCallback((row: any) => {
    if (row.type !== "keyword" || !row.cost_type) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
              {row.cost_type}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {row.cost_type === "CPC" && "Cost Per Click"}
              {row.cost_type === "CPM" && "Cost Per Mille (1000 impressions)"}
              {row.cost_type === "vCPM" && "Viewable Cost Per Mille"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }, []);

  // Custom cell renderer for Name with product image (for ASIN groups)
  // Shows an "Edited" badge for modified keywords
  const renderNameCell = useCallback((row: any) => {
    const isHighlighted = row.type === "keyword" && row._highlighted;
    
    if (row.type === "asin_group" && row.image_url) {
      return (
        <div className="flex items-center gap-3">
          <img 
            src={row.image_url} 
            alt={row.product_name || row.name}
            className="w-10 h-10 object-cover rounded border border-slate-200"
            onError={(e) => {
              // Hide image on error
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{row.name}</span>
            {row.product_name && (
              <span className="text-xs text-slate-500 truncate max-w-xs">
                {row.product_name}
              </span>
            )}
          </div>
        </div>
      );
    }
    
    if (isHighlighted) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.name}</span>
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs px-1.5 py-0">
            Edited
          </Badge>
        </div>
      );
    }
    
    return <span className="font-medium">{row.name}</span>;
  }, []);


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
        cellRenderer: renderNameCell,
      },
      {
        field: "source",
        headerName: "Source",
        type: "text",
        sortable: true,
        filterable: true,
        width: 150,
        cellRenderer: renderSourceCell,
      },
      {
        field: "cost_type",
        headerName: "Cost Type",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
        cellRenderer: renderCostTypeCell,
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
        editable: ((row: any) => {
          // Allow editing for all keywords (SP and SB)
          return row.is_editable;
        }) as any,
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
        field: "sales",
        headerName: "Sales",
        type: "number",
        sortable: true,
        filterable: true,
        width: 140,
      },
      {
        field: "purchases",
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
    [renderNameCell, renderSourceCell, renderCostTypeCell]
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

      // Track edited rows for highlighting
      setEditedRowIds(prev => {
        const newSet = new Set(prev);
        changes.forEach(change => newSet.add(change.keyword_id));
        return newSet;
      });
    },
    [data?.data]
  );

  // Handle deselection - revert individual changes
  const handleDeselectRow = useCallback((keywordId: string) => {
    // Remove from pending changes
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(keywordId);
      return newMap;
    });

    // Remove from edited rows
    setEditedRowIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(keywordId);
      return newSet;
    });

    // Revert to original value in tableData
    if (data?.data) {
      setTableData(prev => {
        return revertKeywordBid(prev, data.data, keywordId);
      });
    }

    toast({
      title: "Change Reverted",
      description: "Bid change has been removed.",
      variant: "default",
    });
  }, [data?.data, toast]);

  // Handle edited rows change (called by table when rows are selected/deselected)
  const handleEditedRowsChange = useCallback((editedRows: Set<number>) => {
    // This callback is for future use if the table component supports selection tracking
    // Currently, deselection is handled via individual row actions
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

  // Get statistics about pending changes by source
  const changesBySource = useMemo(() => {
    const stats = {
      sp_keyword: 0,
      sp_expression: 0,
      sb: 0,
    };
    
    pendingChanges.forEach(change => {
      if (change.source in stats) {
        stats[change.source]++;
      }
    });
    
    return stats;
  }, [pendingChanges]);

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
      {/* Data Source Info Banner */}
      {/* <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Combined Data Sources
            </h3>
            <p className="text-xs text-slate-600 mb-2">
              This table combines data from Sponsored Products (Keywords & Expressions) and Sponsored Brands campaigns.
              <span className="font-semibold text-slate-700"> All keyword types are editable.</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                SP Keyword
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                SP Expression
              </Badge>
              <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                Sponsored Brand
              </Badge>
            </div>
          </div>
        </div>
      </div> */}

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
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-slate-600">
                    Review your bid changes and save when ready
                  </p>
                  {changesBySource.sp_keyword > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                      {changesBySource.sp_keyword} SP Keyword
                    </Badge>
                  )}
                  {changesBySource.sp_expression > 0 && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                      {changesBySource.sp_expression} SP Expression
                    </Badge>
                  )}
                  {changesBySource.sb > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      {changesBySource.sb} SB
                    </Badge>
                  )}
                </div>
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
          
          {/* Changes Summary with Individual Revert */}
          {pendingChanges.size > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <div className="text-xs font-semibold text-slate-700 mb-2">Pending Changes:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {Array.from(pendingChanges.values()).map(change => (
                  <div key={change.keyword_id} className="bg-white rounded px-3 py-2 text-xs border border-amber-200 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-slate-800 truncate flex-1">{change.keyword}</div>
                        <Badge className={`${getSourceColor(change.source)} text-xs px-1 py-0`}>
                          {change.source === 'sp_keyword' ? 'SP-K' : change.source === 'sp_expression' ? 'SP-E' : 'SB'}
                        </Badge>
                      </div>
                      <div className="text-slate-600">
                        ${change.oldBid.toFixed(2)} → ${change.newBid.toFixed(2)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeselectRow(change.keyword_id)}
                      className="ml-2 h-6 w-6 p-0 hover:bg-red-100"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
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
              
              {/* Display results for SP and SB separately */}
              <div className="mt-2 space-y-1">
                {pushResult.push_results?.sp && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">SP:</span> Push ID: {pushResult.push_results.sp.push_id} • 
                    {pushResult.push_results.sp.total_items} items • 
                    S3: {pushResult.push_results.sp.s3_location.bucket}/{pushResult.push_results.sp.s3_location.key}
                  </p>
                )}
                {pushResult.push_results?.sb && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">SB:</span> Push ID: {pushResult.push_results.sb.push_id} • 
                    {pushResult.push_results.sb.total_items} items • 
                    S3: {pushResult.push_results.sb.s3_location.bucket}/{pushResult.push_results.sb.s3_location.key}
                  </p>
                )}
              </div>
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
          {pushResult.push_results && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <details className="text-xs">
                <summary className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                  View Lambda Responses
                </summary>
                <div className="mt-2 space-y-2">
                  {pushResult.push_results.sp && (
                    <div>
                      <div className="font-semibold text-slate-600">SP Response:</div>
                      <pre className="p-3 bg-slate-50 rounded border border-slate-200 overflow-x-auto">
                        {JSON.stringify(pushResult.push_results.sp.lambda_response, null, 2)}
                      </pre>
                    </div>
                  )}
                  {pushResult.push_results.sb && (
                    <div>
                      <div className="font-semibold text-slate-600">SB Response:</div>
                      <pre className="p-3 bg-slate-50 rounded border border-slate-200 overflow-x-auto">
                        {JSON.stringify(pushResult.push_results.sb.lambda_response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
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
          Edit keyword bids by clicking on the bid value. 
          Edited keywords show an "Edited" badge. Click the × icon next to a change to revert it individually,
          or use "Cancel All" to revert everything. Use "Dry Run" to test changes, or "Save Changes" to apply them.
          Changes are automatically separated by campaign type (SP/SB) during push.
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
          source: oldKeyword.source,
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

// Helper function to revert a specific keyword bid to original value
function revertKeywordBid(
  currentData: HierarchicalRow[],
  originalData: HierarchicalRow[],
  keywordId: string
): HierarchicalRow[] {
  return currentData.map(group => {
    // Find matching original group
    const originalGroup = originalData.find(og => og.id === group.id);
    if (!originalGroup || !group._children || !originalGroup._children) {
      return group;
    }

    // Revert the specific keyword
    const revertedChildren = group._children.map(keyword => {
      if (keyword.keyword_id === keywordId) {
        const originalKeyword = originalGroup._children?.find(
          ok => ok.keyword_id === keywordId
        );
        if (originalKeyword) {
          return { ...keyword, keyword_bid: originalKeyword.keyword_bid };
        }
      }
      return keyword;
    });

    return { ...group, _children: revertedChildren };
  });
}