// Usage example: TopAsinsRevenue using the generic TopItemsList component

import React from 'react';
import TopItemsList from '@/components/dashboard/ui/TopItemsCard'; // Adjust path as needed
import { TopAsinByRevenue } from '@/lib/api/services/dashboard.service';

interface TopAsinsRevenueProps {
  data?: TopAsinByRevenue[]
  isLoading?: boolean
  isError?: boolean
}

const TopAsinsRevenue: React.FC<TopAsinsRevenueProps> = ({ 
  data = [], 
  isLoading = false, 
  isError = false 
}) => {
  // Transform your API data to match the generic interface
  const transformedData = data?.map(asin => ({
    id: asin.asin,
    name: asin.product_name || 'Unknown Product',
    imageUrl: asin.image_url,
    value: asin.revenue,
    subtitle: `ASIN: ${asin.asin}`, // Optional subtitle for additional info
  })) || [];

  return (
    <TopItemsList
      title="Top 5 ASINs by Revenue"
      data={transformedData}
      isLoading={isLoading}
      isError={isError}
      maxItems={5}
      valueType="currency"
      currency="INR"
      emptyStateMessage="No revenue data available"
    />
  );
};

export default TopAsinsRevenue;