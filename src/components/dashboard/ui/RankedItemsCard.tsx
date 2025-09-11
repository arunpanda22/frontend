import React from "react";

// Types
interface RankedItem {
  id: string;
  name: string;
  percentage: number;
  value?: string | number;
  color?: string;
}

interface RankedItemsCardProps {
  title: string;
  items: RankedItem[];
  showValues?: boolean;
  maxItems?: number;
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

const RankedItemsCard: React.FC<RankedItemsCardProps> = ({
  title,
  items = [],
  showValues = false,
  maxItems = 7,
  className = "",
  isLoading = false,
  emptyMessage = "No data available",
}) => {
  // Default colors for progress bars if not provided
  const defaultColors = [
    "bg-blue-500",
    "bg-green-500", 
    "bg-purple-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-emerald-500"
  ];

  // Get color for item (use provided color or default)
  const getItemColor = (item: RankedItem, index: number): string => {
    return item.color || defaultColors[index % defaultColors.length];
  };

  // Format value if it's a number
  const formatValue = (value: string | number): string => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return value.toString();
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: maxItems }, (_, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-gray-300 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="mb-6">
          <h6 className="text-lg font-semibold text-gray-900">{title}</h6>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 transition-all duration-300 hover:shadow-md ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h6 className="text-lg font-semibold text-gray-900">{title}</h6>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.slice(0, maxItems).map((item, index) => (
          <div key={item.id}>
            {/* Item header with name, percentage, and optional value */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h6 className="text-sm font-medium text-gray-900 truncate" title={item.name}>
                  {item.name}
                </h6>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {showValues && item.value && (
                  <span className="text-sm text-gray-600">
                    {formatValue(item.value)}
                  </span>
                )}
                <span className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getItemColor(item, index)}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankedItemsCard;