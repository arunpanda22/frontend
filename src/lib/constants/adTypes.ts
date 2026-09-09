// lib/constants/adTypes.ts

import { AdType } from '@/lib/hooks/useRealtimeAdsRevenueData';

export const AD_TYPE_META: Record<
  AdType,
  {
    label: string;
    shortLabel: string;
    chartColor: string;
    badgeBg: string;
    badgeText: string;
    dotColor: string;
  }
> = {
  sp: {
    label: 'Sponsored Products',
    shortLabel: 'SP',
    chartColor: '#3B82F6',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-600',
    dotColor: 'bg-blue-500',
  },
  sb: {
    label: 'Sponsored Brands',
    shortLabel: 'SB',
    chartColor: '#F59E0B',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
    dotColor: 'bg-amber-500',
  },
  sd: {
    label: 'Sponsored Display',
    shortLabel: 'SD',
    chartColor: '#10B981',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    dotColor: 'bg-emerald-500',
  },
};

export const AD_TYPE_ORDER: AdType[] = ['sp', 'sb', 'sd'];