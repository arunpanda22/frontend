// hooks/useCampaignQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  campaignService,
  CampaignSegmentationOptions,
  XrayDataOptions,
  KeywordPerformanceOptions,
  UpdateKeywordBidRequest
} from '../api/services/campaign.service';

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

  // Sort campaign names for consistent query key
  const sortedCampaigns = options.campaign_names
    ? [...options.campaign_names].sort()
    : [];

  return useQuery({
    queryKey: [
      'campaigns',
      'xray',
      options.focus_level || 'all',
      // Use comma-separated string for array comparison
      sortedCampaigns.length > 0 ? sortedCampaigns.join(',') : 'none',
    ],
    queryFn: () => {
      console.log('Query function executing with campaigns:', options.campaign_names);
      return campaignService.getXrayData(options);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
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
 * Hook to update keyword bid
 * Optimistically updates the UI and refetches data on success
 */
export function useUpdateKeywordBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateKeywordBidRequest) => {
      console.log('Mutation function called with:', request);
      return campaignService.updateKeywordBid(request);
    },
    onSuccess: (data, variables) => {
      console.log('Keyword bid updated successfully:', data);
      
      // Invalidate and refetch keyword performance queries
      queryClient.invalidateQueries({
        queryKey: ['keywords', 'performance']
      });
      
      // You could also do optimistic updates here
      // queryClient.setQueryData(['keywords', 'performance', 'hierarchical'], (old) => {
      //   // Update the specific keyword's bid in the cache
      //   return updateKeywordBidInCache(old, variables.keyword_id, variables.new_bid);
      // });
    },
    onError: (error, variables) => {
      console.error('Failed to update keyword bid:', error, variables);
      // Error handling can be done in the component using onError callback
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