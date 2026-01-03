import { Currency } from 'lucide-react';
import React from 'react';

interface TopItemsListItem {
  id: string;
  currency: string;
  name: string;
  imageUrl?: string;
  value: number | string; // Allow both number and pre-formatted string
  subtitle?: string; // For ASIN code, SKU, etc.
}

interface TopItemsListProps {
  title: string;
  data?: TopItemsListItem[];
  isLoading?: boolean;
  isError?: boolean;
  maxItems?: number;
  emptyStateIcon?: string;
  emptyStateMessage?: string;
  errorIcon?: string;
  errorMessage?: string;
}

const TopItemsList: React.FC<TopItemsListProps> = ({ 
  title,
  data = [], 
  isLoading = false, 
  isError = false,
  maxItems = 5,
  emptyStateIcon = '📊',
  emptyStateMessage = 'No data available',
  errorIcon = '⚠️',
  errorMessage = 'Failed to load data'
}) => {
  // Helper function to get fallback image
  const getImageSrc = (imageUrl: string, itemName: string): string => {
    if (imageUrl && imageUrl.trim() !== '') {
      return imageUrl;
    }
    return `https://via.placeholder.com/48x48/f3f4f6/6b7280?text=${encodeURIComponent(itemName.charAt(0))}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b-2 border-gray-300 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            {title}
          </h6>
        </div>
        
        <div className="p-4 md:p-6 flex-1">
          <div className="space-y-3">
            {[...Array(maxItems)].map((_, index) => (
              <div key={index} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b-2 border-gray-300 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            {title}
          </h6>
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-2">{errorIcon}</div>
            <p className="text-gray-500 text-sm">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-5 border-b-2 border-gray-300 flex-shrink-0">
          <h6 className="text-base font-semibold text-gray-900">
            {title}
          </h6>
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">{emptyStateIcon}</div>
            <p className="text-gray-500 text-sm">{emptyStateMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 md:p-5 border-b-2 border-gray-300 flex-shrink-0">
        <h6 className="text-base font-semibold text-gray-900">
          {title}
        </h6>
      </div>
      
      <div className="p-4 md:p-6 flex-1">
        <div className="space-y-3">
          {data.slice(0, maxItems).map((item) => (
            <div key={item.id} className="flex items-center gap-4 hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {item.imageUrl && item.imageUrl.trim() !== '' ? (
                  <img 
                    src={getImageSrc(item.imageUrl, item.name)}
                    alt={item.name || 'Item'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/48x48/f3f4f6/6b7280?text=${encodeURIComponent((item.name || 'I').charAt(0))}`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs font-medium">
                    {(item.name || 'Item').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate pr-4" title={item.name || 'Unknown Item'}>
                      {item.name || 'Unknown Item'}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500 truncate" title={item.subtitle}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-lg font-bold text-ocean-700">
                      {item.currency}{item.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopItemsList;