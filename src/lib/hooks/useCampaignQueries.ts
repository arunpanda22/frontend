// hooks/useCampaignQueries.ts
import { useQuery } from '@tanstack/react-query';
import { 
  campaignService,
  CampaignSegmentationOptions,
  XrayDataOptions,
  KeywordPerformanceOptions
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
 * Hook to fetch keyword and expression performance data
 * Returns keyword-level metrics with comparison to previous period
 */
export function useKeywordPerformance(options?: KeywordPerformanceOptions) {
  console.log('useKeywordPerformance called with:', options);

  // Create stable query key
  const queryKey = ['keywords', 'performance'];
  
  if (options?.start_date) {
    queryKey.push(options.start_date);
  }
  
  if (options?.end_date) {
    queryKey.push(options.end_date);
  }

  return useQuery({
    queryKey,
    queryFn: () => {
      console.log('Fetching keyword performance with options:', options);
      return campaignService.getKeywordPerformance(options);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
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