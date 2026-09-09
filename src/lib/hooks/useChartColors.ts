// Hook to convert Tailwind color classes to hex values for ApexCharts

import { useMemo } from 'react';

interface UseChartColorsProps {
  chartColors: string;
  chartDarkColors?: string;
}

// Tailwind color mappings (add more as needed)
const tailwindColors: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-blue-400': '#60a5fa',
  'bg-purple-500': '#a855f7',
  'bg-purple-400': '#c084fc',
  'bg-pink-500': '#ec4899',
  'bg-pink-400': '#f472b6',
  'bg-green-500': '#22c55e',
  'bg-green-400': '#4ade80',
  'bg-red-500': '#ef4444',
  'bg-red-400': '#f87171',
  'bg-orange-500': '#f97316',
  'bg-orange-400': '#fb923c',
  'bg-yellow-500': '#eab308',
  'bg-yellow-400': '#facc15',
  'bg-indigo-500': '#6366f1',
  'bg-indigo-400': '#818cf8',
  'bg-gray-500': '#6b7280',
  'bg-gray-400': '#9ca3af',
  'bg-gray-200': '#e5e7eb',
  'bg-primary-500': '#3b82f6', // Default to blue
};

/**
 * Convert Tailwind color classes to hex values for ApexCharts
 * @param chartColors - String like "[bg-blue-500, bg-purple-500]"
 * @param chartDarkColors - Optional dark mode colors
 * @returns Array of hex color values
 */
export default function useChartColors({ 
  chartColors, 
  chartDarkColors 
}: UseChartColorsProps): string[] {
  return useMemo(() => {
    // Parse the color string (remove brackets and split by comma)
    const colorString = chartColors.replace(/[\[\]]/g, '').trim();
    const colorClasses = colorString.split(',').map(c => c.trim());
    
    // Map Tailwind classes to hex values
    const hexColors = colorClasses.map(colorClass => {
      return tailwindColors[colorClass] || '#3b82f6'; // Default to blue
    });
    
    return hexColors;
  }, [chartColors, chartDarkColors]);
}