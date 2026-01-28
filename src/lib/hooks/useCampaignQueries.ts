// hooks/useCampaignQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  campaignService,
  CampaignSegmentationOptions,
  XrayDataOptions,
  KeywordPerformanceOptions,
  KeywordBidPushPayload,
} from '../api/services/campaign.service';
import { useMemo } from 'react';

/**
 * Hook to fetch campaign segmentation data
 * Categorizes campaigns into 4 segments: Scalers, Efficient Low-Scale, 
 * Inefficient/Wasteful, and Decline/Diagnostic
 */
export function useCampaignSegmentation(options?: CampaignSegmentationOptions) {
  console.log('useCampaignSegmentation called with:', options);

  // Create stable query key
  const queryKey = ['campaigns', 'segments'];
  
  if (options?.start_date) {
    queryKey.push(options.start_date);
  }
  
  if (options?.end_date) {
    queryKey.push(options.end_date);
  }

  return useQuery({
    queryKey,
    queryFn: () => {
      console.log('Fetching campaign segments with options:', options);
      return campaignService.getCampaignSegments(options);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - segmentation data changes less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for this data
  });
}

/**
 * Hook to fetch campaign X-ray data
 * Provides detailed metrics for selected campaigns
 */
export function useCampaignXrayData(options: XrayDataOptions) {
  console.log('useCampaignXrayData called with:', options);

  // Create a stable query key that doesn't depend on exact campaign order
  // Use a hash or sorted string representation for better cache hits
  const campaignsKey = useMemo(() => {
    if (!options.campaign_names || options.campaign_names.length === 0) {
      return 'all';
    }
    // Sort and join for consistent cache key regardless of order
    return options.campaign_names.slice().sort().join('|');
  }, [options.campaign_names]);

  return useQuery({
    queryKey: [
      'campaigns',
      'xray',
      options.focus_level || 'all',
      campaignsKey,
    ],
    queryFn: () => {
      console.log('Query function executing with campaigns:', 
        options.campaign_names?.length || 'all');
      return campaignService.getXrayData(options);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    // Prevent refetch on window focus for this data
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch hierarchical keyword performance data
 * Returns ASIN/Campaign groups with expandable keyword children
 * Includes comparison to previous period for trend analysis
 */
export function useKeywordPerformanceHierarchical(options?: KeywordPerformanceOptions) {
  console.log('useKeywordPerformanceHierarchical called with:', options);

  // Create stable query key
  const queryKey = ['keywords', 'performance', 'hierarchical'];
  
  if (options?.start_date) {
    queryKey.push('start', options.start_date);
  }
  
  if (options?.end_date) {
    queryKey.push('end', options.end_date);
  }

  if (options?.comparison_start_date) {
    queryKey.push('comp_start', options.comparison_start_date);
  }

  if (options?.comparison_end_date) {
    queryKey.push('comp_end', options.comparison_end_date);
  }

  return useQuery({
    queryKey,
    queryFn: () => {
      console.log('Fetching hierarchical keyword performance with options:', options);
      return campaignService.getKeywordPerformanceHierarchical(options);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to push keyword bid updates
 * Supports batch updates and dry-run mode
 * Invalidates keyword performance queries on success
 * NOW HANDLES: Separate SP and SB push results
 */
export function usePushKeywordBids() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: KeywordBidPushPayload) => {
      console.log('Mutation function called with:', {
        count: payload.data.length,
        dryrun: payload.dryrun || false
      });
      return campaignService.pushKeywordBids(payload);
    },
    onSuccess: (data, variables) => {
      console.log('Keyword bids pushed successfully:', {
        message: data.message,
        sp_items: data.summary.sp_items,
        sb_items: data.summary.sb_items,
        dryrun: data.summary.dryrun,
        sp_push_id: data.push_results.sp?.push_id,
        sb_push_id: data.push_results.sb?.push_id,
      });
      
      // Only invalidate queries if not a dry run
      if (!variables.dryrun) {
        // Invalidate and refetch keyword performance queries
        queryClient.invalidateQueries({
          queryKey: ['keywords', 'performance']
        });
      }
    },
    onError: (error, variables) => {
      console.error('Failed to push keyword bids:', error, variables);
      // Error handling is done in the component using onError callback
    }
  });
}

/**
 * Combined hook for pages that need both segmentation and X-ray data
 * Useful for campaign analysis pages
 */
export function useCampaignAnalysis(
  segmentOptions?: CampaignSegmentationOptions,
  xrayOptions?: XrayDataOptions
) {
  const segmentation = useCampaignSegmentation(segmentOptions);
  const xrayData = useCampaignXrayData(xrayOptions || { focus_level: 'all' });

  return {
    segmentation,
    xrayData,
    isLoading: segmentation.isLoading || xrayData.isLoading,
    isError: segmentation.isError || xrayData.isError,
    error: segmentation.error || xrayData.error,
  };
}