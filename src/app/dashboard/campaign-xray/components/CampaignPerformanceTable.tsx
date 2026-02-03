"use client";

import { AdvancedDataTable, ColumnDefinition } from "@/components/dashboard/table/dropdown-data-table";
import { useKeywordPerformanceHierarchical, usePushKeywordBids } from "@/lib/hooks/useCampaignQueries";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useKeywordBidStore } from "@/lib/hooks/useKeywordBidStore";
import { Loader2, AlertCircle, Target, Save, X, CheckCircle, Undo, Redo } from "lucide-react";
import { useMemo, useState, useCallback, useEffect } from "react";
import { PeriodSelector } from "@/components/dashboard/ui/PeriodSlector";
import { 
  getSourceColor,
} from "@/lib/api/services/campaign.service";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";

const KeywordPerformanceTable = () => {
  const { dateRange } = useDateRange();
  const { toast } = useToast();

  const [customPeriodEnabled, setCustomPeriodEnabled] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<{ start: Date; end: Date }>(() => {
    const end = subDays(new Date(), 1);
    const start = subDays(end, 6);
    return { start, end };
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<{ start: Date; end: Date }>(() => {
    const end = subDays(new Date(), 1);
    const start = subDays(end, 6);
    const compEnd = subDays(start, 1);
    const compStart = subDays(compEnd, 6);
    return { start: compStart, end: compEnd };
  });

  const apiDates = useMemo(() => {
    if (customPeriodEnabled) {
      return {
        start_date: format(currentPeriod.start, 'yyyy-MM-dd'),
        end_date: format(currentPeriod.end, 'yyyy-MM-dd'),
        comparison_start_date: format(comparisonPeriod.start, 'yyyy-MM-dd'),
        comparison_end_date: format(comparisonPeriod.end, 'yyyy-MM-dd'),
      };
    }
    return {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
    };
  }, [customPeriodEnabled, currentPeriod, comparisonPeriod, dateRange]);

  const {
    setServerData,
    updateKeyword,
    revertKeyword,
    markAsPushed,
    getDisplayData,
    getPendingChanges,
    undo,
    redo,
    canUndo,
    canRedo,
    clearSelection,
  } = useKeywordBidStore();

  const { data, isLoading, isError, error, refetch } = useKeywordPerformanceHierarchical(apiDates);
  const pushBidsMutation = usePushKeywordBids();

  // ✅ DEBUG: Log the raw API response
  useEffect(() => {
    console.log('🔍 RAW API RESPONSE:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : null,
      dataDataArray: data?.data,
      dataDataLength: data?.data?.length,
      firstItem: data?.data?.[0],
      summary: data?.summary,
    });
  }, [data]);

  // ✅ FIX: Update server data whenever API data changes
  useEffect(() => {
    if (data?.data) {
      console.log('📥 Setting server data from API:', {
        groups: data.data.length,
        firstGroup: data.data[0],
        hasChildren: data.data[0]?._children?.length,
      });
      setServerData(data.data);
    }
  }, [data, setServerData]);

  // ✅ FIX: Force re-render when store updates by subscribing to store changes
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  // Subscribe to store changes to force component re-render
  useEffect(() => {
    const unsubscribe = useKeywordBidStore.subscribe((state) => {
      // Trigger re-render when edited keywords change
      setRenderTrigger(prev => prev + 1);
    });
    
    return unsubscribe;
  }, []);

  // Get display data - this will update when renderTrigger changes
  const displayData = useMemo(() => {
    const data = getDisplayData();
    console.log('🔄 Display data generated:', {
      length: data?.length,
      isArray: Array.isArray(data),
      firstItem: data?.[0],
      trigger: renderTrigger
    });
    return data;
  }, [getDisplayData, renderTrigger]);

  // ✅ DEBUG: Log displayData whenever it changes
  useEffect(() => {
    console.log('📊 DISPLAY DATA UPDATED:', {
      displayData,
      length: displayData?.length,
      isNull: displayData === null,
      isUndefined: displayData === undefined,
      isEmpty: displayData?.length === 0,
    });
  }, [displayData]);

  // Get pending changes - this will also update when renderTrigger changes
  const pendingChanges = useMemo(() => {
    const changes = getPendingChanges();
    console.log('📝 Pending changes:', changes.length);
    return changes;
  }, [getPendingChanges, renderTrigger]);

  const handlePeriodChange = useCallback((
    current: { start: Date; end: Date },
    comparison: { start: Date; end: Date }
  ) => {
    setCurrentPeriod(current);
    setComparisonPeriod(comparison);
    setCustomPeriodEnabled(true);
    
    toast({
      title: "Period Updated",
      description: `Comparing ${format(current.start, 'MMM dd')} - ${format(current.end, 'MMM dd')} with ${format(comparison.start, 'MMM dd')} - ${format(comparison.end, 'MMM dd')}`,
    });
  }, [toast]);

  const columns: ColumnDefinition[] = useMemo(() => [
    {
      field: "name",
      headerName: "Name",
      type: "text",
      sortable: true,
      filterable: true,
      pinned: "left",
      width: 350,
      minWidth: 200,
    },
    {
      field: "source",
      headerName: "Source",
      type: "text",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
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
      field: "keyword_bid",
      headerName: "Keyword Bid",
      type: "number",
      sortable: true,
      filterable: true,
      editable: true,
      autoFitHeader: true,
      minWidth: 100,
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
      autoFitHeader: true,
    },
    {
      field: "cost",
      headerName: "Spend",
      type: "number",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    },
    {
      field: "cpc",
      headerName: "CPC",
      type: "number",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    },
    {
      field: "sales",
      headerName: "Sales",
      type: "number",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    },
    {
      field: "purchases",
      headerName: "Orders",
      type: "number",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    },
    {
      field: "acos",
      headerName: "ACOS %",
      type: "number",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    },
    {
      field: "roas",
      headerName: "ROAS",
      type: "number",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    },
    {
      field: "cvr",
      headerName: "CVR %",
      type: "number",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    },
    {
      field: "cpa",
      headerName: "CPA",
      type: "number",
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    },
  ], []);

  // ✅ FIX: Simplified cell edit handler
  const handleCellEdit = useCallback((keywordId: string, field: string, value: any) => {
    console.log('🎯 Cell Edit Called:', { keywordId, field, value, type: typeof value });
    updateKeyword(keywordId, field, value);
  }, [updateKeyword]);

  const handleRevert = useCallback((keywordId: string) => {
    revertKeyword(keywordId);
    toast({
      title: "Change Reverted",
      description: "Bid change has been removed.",
      variant: "default",
    });
  }, [revertKeyword, toast]);

  const handleSave = useCallback(async (dryrun: boolean = false) => {
    if (pendingChanges.length === 0) {
      toast({
        title: "No Changes",
        description: "There are no pending bid changes to save.",
        variant: "default",
      });
      return;
    }

    try {
      toast({
        title: dryrun ? "Testing Changes" : "Saving Changes",
        description: `${dryrun ? 'Testing' : 'Updating'} ${pendingChanges.length} keyword bid(s)...`,
      });

      const bidUpdates = pendingChanges
        .filter(c => c.field === 'keyword_bid')
        .map(c => ({
          keyword_id: c.keyword_id,
          campaign_id: c.campaign_id,
          ad_group_id: c.ad_group_id,
          match_type: c.match_type,
          "New bid": c.newValue,
          source: c.source,
        }));

      console.log('💾 Saving bid updates:', bidUpdates);

      const result = await pushBidsMutation.mutateAsync({
        data: bidUpdates,
        dryrun,
      });

      if (dryrun) {
        toast({
          title: "Validation Successful",
          description: `${pendingChanges.length} bid change(s) validated successfully. Ready to push.`,
          variant: "default",
        });
      } else {
        const pushedIds = bidUpdates.map(u => u.keyword_id);
        markAsPushed(pushedIds);
        clearSelection();
        
        await refetch();
        
        toast({
          title: "Changes Saved",
          description: `Successfully updated ${pendingChanges.length} keyword bid(s).`,
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
  }, [pendingChanges, toast, refetch, pushBidsMutation, markAsPushed, clearSelection]);

  const changesBySource = useMemo(() => {
    const stats = {
      sp_keyword: 0,
      sp_expression: 0,
      sb: 0,
    };
    
    pendingChanges.forEach(change => {
      if (change.source in stats) {
        stats[change.source as keyof typeof stats]++;
      }
    });
    
    return stats;
  }, [pendingChanges]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PeriodSelector
          currentStart={currentPeriod.start}
          currentEnd={currentPeriod.end}
          comparisonStart={comparisonPeriod.start}
          comparisonEnd={comparisonPeriod.end}
          onPeriodChange={handlePeriodChange}
        />
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-slate-600 font-medium">Loading keyword performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load keyword performance data";
    const isDateError = errorMessage.includes("start_date") || errorMessage.includes("end_date");
    
    return (
      <div className="space-y-4">
        <PeriodSelector
          currentStart={currentPeriod.start}
          currentEnd={currentPeriod.end}
          comparisonStart={comparisonPeriod.start}
          comparisonEnd={comparisonPeriod.end}
          onPeriodChange={handlePeriodChange}
        />
        
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="text-red-500 text-lg font-semibold">Error Loading Data</div>
            <p className="text-slate-600 text-sm">
              {isDateError 
                ? "Invalid date range. Please adjust the date range above and try again."
                : errorMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIX: Check both null and empty array
  const hasNoData = !displayData || displayData.length === 0;
  
  console.log('🚨 RENDER CHECK:', {
    hasNoData,
    displayDataExists: !!displayData,
    displayDataLength: displayData?.length,
    displayDataType: typeof displayData,
    displayDataIsArray: Array.isArray(displayData),
  });

  if (hasNoData) {
    return (
      <div className="space-y-4">
        <PeriodSelector
          currentStart={currentPeriod.start}
          currentEnd={currentPeriod.end}
          comparisonStart={comparisonPeriod.start}
          comparisonEnd={comparisonPeriod.end}
          onPeriodChange={handlePeriodChange}
        />
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Target className="h-12 w-12 text-slate-300" />
            <div className="text-slate-700 text-lg font-semibold">No Data Available</div>
            <p className="text-slate-500 text-sm">
              No keyword performance data found for the selected date range.
            </p>
            {/* ✅ DEBUG INFO */}
            <div className="mt-4 p-4 bg-slate-100 rounded text-xs text-left">
              <div className="font-bold mb-2">Debug Info:</div>
              <div>API Data: {data?.data?.length || 0} groups</div>
              <div>Display Data: {displayData?.length || 0} items</div>
              <div>Has Data: {!!data ? 'Yes' : 'No'}</div>
              <div>Data Type: {typeof displayData}</div>
              <div>Is Array: {Array.isArray(displayData) ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PeriodSelector
        currentStart={currentPeriod.start}
        currentEnd={currentPeriod.end}
        comparisonStart={comparisonPeriod.start}
        comparisonEnd={comparisonPeriod.end}
        onPeriodChange={handlePeriodChange}
      />

      {pendingChanges.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 rounded-full p-2">
                <Save className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {pendingChanges.length} Unsaved Change{pendingChanges.length !== 1 ? 's' : ''}
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
                onClick={() => undo()}
                disabled={!canUndo()}
                className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Undo className="h-4 w-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => redo()}
                disabled={!canRedo()}
                className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Redo className="h-4 w-4 mr-2" />
                Redo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(true)}
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
                onClick={() => handleSave(false)}
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
          
          <div className="mt-3 pt-3 border-t border-amber-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">Pending Changes:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {pendingChanges.map(change => (
                <div key={change.keyword_id} className="bg-white rounded px-3 py-2 text-xs border border-amber-200 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-slate-800 truncate flex-1">{change.keyword}</div>
                      <Badge className={`${getSourceColor(change.source)} text-xs px-1 py-0`}>
                        {change.source === 'sp_keyword' ? 'SP-K' : change.source === 'sp_expression' ? 'SP-E' : 'SB'}
                      </Badge>
                    </div>
                    <div className="text-slate-600">
                      ${Number(change.oldValue).toFixed(2)} → ${Number(change.newValue).toFixed(2)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevert(change.keyword_id)}
                    className="ml-2 h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AdvancedDataTable
        data={displayData}
        columns={columns}
        onCellEdit={handleCellEdit}
        className="shadow-sm"
      />

      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Click on ASIN or Campaign rows to expand and view keywords. 
          Edit keyword bids by clicking on the bid value. Press Enter or click outside to save.
          Use Undo/Redo to manage changes. Click × next to a change to revert it individually.
        </p>
      </div>
    </div>
  );
};

export default KeywordPerformanceTable;