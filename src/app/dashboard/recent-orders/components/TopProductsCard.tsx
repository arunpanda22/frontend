import React from 'react';
import { Package } from 'lucide-react';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useUserProfile } from '@/lib/hooks/queries/use-user-profile';

interface TopProduct {
  asin: string;
  product_name: string;
  image_url: string | null;
  seller_revenue: number;
  vendor_revenue: number;
  total_revenue: number;
  seller_units: number;
  vendor_units: number;
  total_units: number;
  orders: number;
  asp: number;
  price: number;
}

interface TopProductsCardProps {
  topProducts: TopProduct[] | null;
  isLoading?: boolean;
}

const TopProductsCard = ({ topProducts, isLoading = false }: TopProductsCardProps) => {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { data: userProfile } = useUserProfile();
  const hasVendorAccounts = (userProfile?.connected_vendor_accounts?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-pulse flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="p-4 md:p-6 flex-1">
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center gap-4">
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

  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-pulse flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="p-4 md:p-6 flex-1">
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center gap-4">
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

  return (
    <div className="h-full rounded-xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-base font-semibold text-gray-900">
          Top Products Today
        </h6>
        {/* <p className="text-xs text-gray-500 mt-1">
          {hasVendorAccounts ? 'Combined seller and vendor sales' : 'Seller sales'}
        </p> */}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {topProducts.map((product, index) => (
            <div key={`${product.asin}-${index}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors ">
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {index + 1}
              </div>

              {/* Product Image */}
              <div className="flex-shrink-0">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.product_name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={product.product_name}>
                  {product.product_name}
                </p>
                <p className="text-xs text-gray-500 truncate" title={product.asin}>
                  ASIN: {product.asin}
                </p>
                
                {/* Combined Metrics */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-xs">
                    <span className="text-gray-500">Revenue:</span>
                    <span className="font-semibold text-green-600 ml-1">
                      {getCurrencySymbol()}{formatCurrency(product.total_revenue)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Units:</span>
                    <span className="font-semibold text-blue-600 ml-1">
                      {product.total_units}
                    </span>
                  </div>
                </div>

                {/* Split Info - Only show if user has vendor accounts */}
                {hasVendorAccounts && (
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span>Seller: {product.seller_units}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span>Vendor: {product.vendor_units}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopProductsCard;