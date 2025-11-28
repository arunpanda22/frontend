"use client";

import React, { useState, useMemo, memo } from "react";
import { ChevronLeft, ChevronRight, Package, Calendar, Hash, CheckCircle, Clock, XCircle, Truck, AlertCircle } from "lucide-react";

interface Order {
  AmazonOrderId: string;
  OrderStatus: string | null;
  product_name: string;
  PurchaseDate: string | null;
  FulfillmentType: string | null;
  OrderType: string | null;
  EventTime?: string | null;
  ChangeReason?: string | null;
  seller_sku?: string | null;
  image_url?: string | null;
}

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 20;

const ImageCell = memo(function ImageCell({ imageUrl }: { imageUrl: string | null | undefined }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return null;
  }

  return (
    <div className="relative inline-block mr-3">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={imageUrl}
          alt="Product"
          className="w-12 h-12 rounded-md object-cover border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
          onError={() => setImageError(true)}
        />

        {isHovered && (
          <div
            className="absolute z-[9999] bg-white p-2 rounded-lg shadow-xl border border-gray-300"
            style={{
              left: "100%",
              top: "50%",
              transform: "translateY(-50%)",
              marginLeft: "8px",
              width: "204px",
              height: "204px",
            }}
            onMouseEnter={() => setIsHovered(true)}
          >
            <img
              src={imageUrl}
              alt="Expanded view"
              className="w-48 h-48 rounded-md object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Sort orders by most recent first (EventTime or PurchaseDate)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = a.PurchaseDate || '';
      const dateB = b.PurchaseDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [orders]);

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrders = sortedOrders.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'Shipped': { bg: 'bg-green-100', text: 'text-green-800', icon: <Truck className="w-3 h-3" /> },
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      'Canceled': { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-3 h-3" /> },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-3 h-3" /> },
      'Unshipped': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Package className="w-3 h-3" /> },
      'PartiallyShipped': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: <Truck className="w-3 h-3" /> },
      'InvoiceUnconfirmed': { bg: 'bg-orange-100', text: 'text-orange-800', icon: <AlertCircle className="w-3 h-3" /> },
      'PendingAvailability': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Clock className="w-3 h-3" /> },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <CheckCircle className="w-3 h-3" /> };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";

  try {
    // Input: 2025-11-28T02:13:23.558000-05:00
    const [datePart, timeAndZone] = dateStr.split("T");

    const [year, month, day] = datePart.split("-").map(Number);

    // Extract time and timezone
    const match = timeAndZone.match(/(\d{2}:\d{2}:\d{2})\.\d+([+-]\d{2}:\d{2})/);
    if (!match) return dateStr;

    const time = match[1];                 // "02:13:23"
    const timezone = match[2];             // "-05:00"

    let [hour, minute, second] = time.split(":").map(Number);

    // Convert to AM/PM formatting (just formatting — NOT timezone shifting)
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 1; // convert 0 → 12

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return `${monthNames[month - 1]} ${day}, ${year}, ${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")} ${ampm}`;
  } catch {
    return dateStr;
  }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 text-sm">Loading orders...</p>
        </div>
      </div>
      // <div className="text-center py-12">
      //   <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      //   <p className="text-gray-500 text-lg font-medium">No orders yet</p>
      //   <p className="text-gray-400 text-sm mt-2">Orders will appear here in real-time</p>
      // </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Order ID
                </div>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Status
                </div>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product
                </div>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Purchase Date
                </div>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Fulfillment
                </div>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order, index) => (
              <tr 
                key={`${order.AmazonOrderId}-${order.seller_sku || index}`}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index === 0 && currentPage === 1 ? 'animate-fadeIn bg-blue-50' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="font-mono text-sm text-gray-900 font-medium">
                    {order.AmazonOrderId}
                  </div>
                  {order.EventTime && (
                    <div className="text-xs text-gray-400 mt-1">
                      Updated: {formatDate(order.EventTime)}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  {getStatusBadge(order.OrderStatus)}
                  {order.ChangeReason && (
                    <div className="text-xs text-gray-500 mt-1">
                      {order.ChangeReason}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    {order.image_url && <ImageCell imageUrl={order.image_url} />}
                    <div 
                      className="text-sm text-gray-600 max-w-40 truncate cursor-help" 
                      title={order.product_name}
                    >
                      {order.product_name}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-900">
                    {formatDate(order.PurchaseDate)}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    order.FulfillmentType === 'AFN' || order.FulfillmentType === 'Amazon' 
                      ? 'bg-purple-100 text-purple-800' 
                      : order.FulfillmentType === 'MFN'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.FulfillmentType || 'N/A'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs text-gray-600">
                    {order.OrderType || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, sortedOrders.length)}</span> of <span className="font-semibold">{sortedOrders.length}</span> orders
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first page, last page, current page, and pages around current
                const showPage = page === 1 || 
                                page === totalPages || 
                                (page >= currentPage - 1 && page <= currentPage + 1);
                
                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile-friendly info bar */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
        <p className="text-xs text-blue-800">
          Real-time updates enabled • New orders will appear automatically
        </p>
      </div>
    </div>
  );
}