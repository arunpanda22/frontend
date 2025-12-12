import React, { useState, useMemo } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AdvancedDataTable } from '@/components/dashboard/table/advanced-data-table';
import type { ColumnDefinition } from '@/components/dashboard/table/advanced-data-table';

interface FailedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryTitle: string;
  categoryKey?: string;
  failedItems: any[];
  duplicateItems?: any[];
  errorItems?: any[];
  successfulItems?: any[];
}

// Helper to generate columns from data dynamically (shows ALL fields)
const generateColumnsFromData = (items: any[]): ColumnDefinition[] => {
  if (!items || items.length === 0) return [];
  
  const firstItem = items[0];
  const columns: ColumnDefinition[] = [];
  
  // Get all keys from the first item
  Object.keys(firstItem).forEach((key) => {
    // Skip internal fields
    if (key.startsWith('_')) return;
    
    const value = firstItem[key];
    const isNumber = typeof value === 'number';
    
    columns.push({
      field: key,
      headerName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: isNumber ? 'number' : 'text',
      editable: false,
      autoFitHeader: true,
      width: 150,
    });
  });
  
  return columns;
};

export const FailedItemsModal: React.FC<FailedItemsModalProps> = ({
  isOpen,
  onClose,
  categoryTitle,
  categoryKey,
  failedItems,
  duplicateItems = [],
  errorItems = [],
  successfulItems = [],
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "successful" | "duplicates" | "errors">("all");

  

  const hasSuccessful = successfulItems.length > 0;
  const hasDuplicates = duplicateItems.length > 0;
  const hasErrors = errorItems.length > 0;
  const hasMultipleTabs = hasSuccessful || hasDuplicates || hasErrors;

  // Determine which items to show based on active tab
  const getDisplayItems = () => {
    switch (activeTab) {
      case "successful":
        return successfulItems;
      case "duplicates":
        return duplicateItems;
      case "errors":
        return errorItems;
      default:
        return failedItems;
    }
  };

  const displayItems = getDisplayItems();
  
  // Generate columns dynamically from the data (shows ALL fields)
  const columns = useMemo(() => generateColumnsFromData(displayItems), [displayItems]);
  
  // Add row numbers
  const tableData = useMemo(() => 
    displayItems.map((item, index) => ({
      _row: index + 1,
      ...item,
    })),
    [displayItems]
  );

  if (!isOpen) return null;

//   const hasSuccessful = successfulItems.length > 0;
//   const hasDuplicates = duplicateItems.length > 0;
//   const hasErrors = errorItems.length > 0;
//   const hasMultipleTabs = hasSuccessful || hasDuplicates || hasErrors;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[90vw] w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Push Results Details
              </h2>
              <p className="text-sm text-gray-600">{categoryTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        {hasMultipleTabs && (
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "all"
                  ? "bg-white text-gray-900 border-t-2 border-x-2 border-gray-200 -mb-px"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Failed ({failedItems.length})
            </button>
            
            {hasSuccessful && (
              <button
                onClick={() => setActiveTab("successful")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === "successful"
                    ? "bg-white text-gray-900 border-t-2 border-x-2 border-gray-200 -mb-px"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Successful ({successfulItems.length})
              </button>
            )}
            
            {hasDuplicates && (
              <button
                onClick={() => setActiveTab("duplicates")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "duplicates"
                    ? "bg-white text-gray-900 border-t-2 border-x-2 border-gray-200 -mb-px"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Duplicates ({duplicateItems.length})
              </button>
            )}
            
            {hasErrors && (
              <button
                onClick={() => setActiveTab("errors")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "errors"
                    ? "bg-white text-gray-900 border-t-2 border-x-2 border-gray-200 -mb-px"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Errors ({errorItems.length})
              </button>
            )}
          </div>
        )}

        {/* Content - Table */}
        <div className="flex-1 overflow-auto p-6">
          {displayItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No items in this category
            </div>
          ) : (
            <div className="h-full">
              <AdvancedDataTable
                data={tableData}
                columns={columns}
                onDataChange={() => {}} // Read-only
                rowsPerPage={20}
                showCheckboxColumn={false}
                className="h-full"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {displayItems.length} item{displayItems.length !== 1 ? "s" : ""}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};