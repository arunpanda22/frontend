import React from 'react';
import TopItemsList from '@/components/dashboard/ui/TopItemsCard';
import { TopAsinByRevenue } from '@/lib/api/services/dashboard.service';
import { useCurrency } from "@/lib/context/CurrencyContext";

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
  const { formatCurrencyNoDecimal, getCurrencySymbol } = useCurrency();

  const currencySymbol = getCurrencySymbol()
  
  // Transform API data - format currency in the transformation
  const transformedData = data?.map(asin => ({
    id: asin.asin,
    currency: currencySymbol,
    name: asin.product_name || 'Unknown Product',
    imageUrl: asin.image_url,
    value: formatCurrencyNoDecimal(asin.revenue), // Pre-format the currency
    subtitle: `ASIN: ${asin.asin}`,
  })) || [];

  return (
    <TopItemsList
      title="Top 5 ASINs by Revenue"
      data={transformedData}
      isLoading={isLoading}
      isError={isError}
      maxItems={5}
      emptyStateMessage="No revenue data available"
    />
  );
};

export default TopAsinsRevenue;