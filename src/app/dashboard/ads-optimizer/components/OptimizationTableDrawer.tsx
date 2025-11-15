import React, { useState, useMemo, useCallback } from 'react';
import { X, Save, Send, AlertCircle } from 'lucide-react';
import { AdvancedDataTable } from '@/components/dashboard/table/advanced-data-table';
import type { ColumnDefinition, TableData } from '@/components/dashboard/table/advanced-data-table';
import type { 
  AdsOptimizerResponse,
  BudgetOptimization,
  BidOptimization,
  PlacementOptimization,
  NewCampaignSuggestion,
  NegativeKeywordSuggestion 
} from '../lib/types';

// ==================== COLUMN MAPPINGS ====================

type OptimizationKey = keyof AdsOptimizerResponse;

interface ColumnMapping {
  [key: string]: ColumnDefinition[];
}

const COLUMN_MAPPINGS: ColumnMapping = {
  // Budget optimizations (SP, SB, SD)
  budget: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', width: 160 },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'dynamic_bidding', headerName: 'Bidding Strategy', type: 'text', editable: false, width: 160, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS (%)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'New Budget', headerName: 'Revised Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Budget Change (%)', headerName: 'Budget Change (%)', type: 'text', editable: false, width: 160, autoFitHeader: true },
    { field: 'cost', headerName: 'Spend', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'sales_30d', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 140, autoFitHeader: true },
  ],
      
  // Bid optimizations (SP, SB, SD)
  bid: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group Name', type: 'text', editable: false, autoFitHeader: true },
    { field: 'keyword', headerName: 'Keyword', type: 'text', editable: false, autoFitHeader: true },
    { field: 'targeting', headerName: 'Targeting', type: 'text', editable: false, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'purchases_30d', headerName: 'Orders (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales_30d', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'keyword_bid', headerName: 'Present Bid', type: 'number', editable: false, width: 130, autoFitHeader: true },
    // Note: field names containing spaces are included exactly as in your payload
    { field: 'New bid', headerName: 'Revised Bid', type: 'number', editable: true, width: 150, autoFitHeader: true },
    { field: 'Bid Change (%)', headerName: 'Bid Change (%)', type: 'text', editable: false, width: 140, autoFitHeader: true }
  ],

  // Placement optimizations
  placement: [
    { field: 'ASIN_Derived', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'placement_classification', headerName: 'Placement', type: 'text', editable: false, autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales_30d', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'purchases_30d', headerName: 'Orders (30d)', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'Percentage', headerName: 'Bid Adjustment (%)', type: 'number', editable: false, width: 160, autoFitHeader: true }
  ],

  // New campaign suggestions
  new_campaigns: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'Campaign Name', headerName: 'Campaign Name', type: 'text', editable: true, autoFitHeader: true },
    { field: 'Campaign Budget', headerName: 'Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Targeting', headerName: 'Target', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, width: 130, autoFitHeader: true },
    { field: 'Ad Type', headerName: 'Ad Type', type: 'text', editable: false, width: 150, autoFitHeader: true },
    { field: 'Bid', headerName: 'Bid', type: 'number', editable: true, width: 120, autoFitHeader: true },
  ],

  // Negative keywords
  negatives: [
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_id', headerName: 'Campaign ID', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'ad_group_id', headerName: 'Ad Group ID', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'search_term', headerName: 'Search Term', type: 'text', editable: false, width: 250, autoFitHeader: true },

  ],
};

// Helper to get column config based on category key
const getColumnsForCategory = (categoryKey: string): ColumnDefinition[] => {
  if (categoryKey.includes('budget')) return COLUMN_MAPPINGS.budget;
  if (categoryKey.includes('bid')) return COLUMN_MAPPINGS.bid;
  if (categoryKey.includes('placement')) return COLUMN_MAPPINGS.placement;
  if (categoryKey.includes('new_campaigns')) return COLUMN_MAPPINGS.new_campaigns;
  if (categoryKey.includes('negatives')) return COLUMN_MAPPINGS.negatives;
  return [];
};

// ==================== VALIDATION ====================

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const validateOptimizationData = (
  data: TableData[],
  categoryKey: string
): ValidationError[] => {
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    // Budget validations
    if (categoryKey.includes('budget')) {
      const newBudget = Number(row['New Budget']);
      if (newBudget !== undefined && (isNaN(newBudget) || newBudget < 0)) {
        errors.push({ row: index, field: 'New Budget', message: 'Must be a positive number' });
      }
      if (newBudget !== undefined && newBudget < 1) {
        errors.push({ row: index, field: 'New Budget', message: 'Budget must be at least $1' });
      }
    }

    // Bid validations
    if (categoryKey.includes('bid')) {
      const recommendedBid = Number(row['recommended_bid']);
      if (recommendedBid !== undefined && (isNaN(recommendedBid) || recommendedBid < 0)) {
        errors.push({ row: index, field: 'recommended_bid', message: 'Must be a positive number' });
      }
      if (recommendedBid !== undefined && recommendedBid < 0.02) {
        errors.push({ row: index, field: 'recommended_bid', message: 'Bid must be at least $0.02' });
      }
    }

    // Placement validations
    if (categoryKey.includes('placement')) {
      const adjustment = Number(row['recommended_adjustment']);
      if (adjustment !== undefined && (isNaN(adjustment) || adjustment < -99 || adjustment > 900)) {
        errors.push({ 
          row: index, 
          field: 'recommended_adjustment', 
          message: 'Must be between -99% and 900%' 
        });
      }
    }

    // New campaign validations
    if (categoryKey.includes('new_campaigns')) {
      const budget = Number(row['recommended_budget']);
      const bid = Number(row['recommended_bid']);
      
      if (budget !== undefined && (isNaN(budget) || budget < 1)) {
        errors.push({ row: index, field: 'recommended_budget', message: 'Budget must be at least $1' });
      }
      if (bid !== undefined && (isNaN(bid) || bid < 0.02)) {
        errors.push({ row: index, field: 'recommended_bid', message: 'Bid must be at least $0.02' });
      }
      if (!row['suggested_name'] || String(row['suggested_name']).trim() === '') {
        errors.push({ row: index, field: 'suggested_name', message: 'Campaign name is required' });
      }
    }
  });

  return errors;
};

// ==================== UNIQUE KEY GENERATION ====================

const generateUniqueKey = (row: TableData, categoryKey: string): string => {
  const parts: string[] = [];
  
  // Always include campaign_id if present
  if (row.campaign_id) parts.push(`c:${row.campaign_id}`);
  
  // Add ad_group_id for bid and negative keywords
  if ((categoryKey.includes('bid') || categoryKey.includes('negatives')) && row.ad_group_id) {
    parts.push(`ag:${row.ad_group_id}`);
  }
  
  // Add targeting_id for bids
  if (categoryKey.includes('bid') && row.targeting_id) {
    parts.push(`t:${row.targeting_id}`);
  }
  
  // Add keyword_text for negatives
  if (categoryKey.includes('negatives') && row.keyword_text) {
    parts.push(`kw:${row.keyword_text}`);
  }
  
  // Add placement_type for placements
  if (categoryKey.includes('placement') && row.placement_type) {
    parts.push(`p:${row.placement_type}`);
  }
  
  // Fallback: use index if no unique identifiers found
  return parts.length > 0 ? parts.join('|') : `row:${Math.random()}`;
};

// ==================== OPTIMIZATION TABLE DRAWER ====================

interface OptimizationTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryKey: OptimizationKey;
  categoryTitle: string;
  data: any[];
  onSave: (categoryKey: OptimizationKey, updatedData: any[]) => void;
  onPush: (categoryKey: OptimizationKey, data: any[]) => void;
}

export const OptimizationTableDrawer: React.FC<OptimizationTableDrawerProps> = ({
  isOpen,
  onClose,
  categoryKey,
  categoryTitle,
  data,
  onSave,
  onPush,
}) => {
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isPushing, setIsPushing] = useState(false);

  // Initialize table data when drawer opens
  React.useEffect(() => {
    if (isOpen && data) {
      const transformedData = data.map((item, index) => ({
        ...item,
        _uniqueKey: generateUniqueKey(item, categoryKey),
        _originalIndex: index,
      }));
      setTableData(transformedData);
      setValidationErrors([]);
    }
  }, [isOpen, data, categoryKey]);

  const columns = useMemo(() => getColumnsForCategory(categoryKey), [categoryKey]);

  const handleSave = useCallback(() => {
    // Validate data
    const errors = validateOptimizationData(tableData, categoryKey);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Remove internal fields before saving
    const cleanedData = tableData.map(({ _uniqueKey, _originalIndex, ...rest }) => rest);
    
    onSave(categoryKey, cleanedData);
    setValidationErrors([]);
    onClose();
  }, [tableData, categoryKey, onSave, onClose]);

  const handlePush = useCallback(async () => {
    // Validate data
    const errors = validateOptimizationData(tableData, categoryKey);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsPushing(true);
    
    try {
      // Remove internal fields before pushing
      const cleanedData = tableData.map(({ _uniqueKey, _originalIndex, ...rest }) => rest);
      
      await onPush(categoryKey, cleanedData);
      setValidationErrors([]);
      onClose();
    } catch (error) {
      console.error('Push failed:', error);
    } finally {
      setIsPushing(false);
    }
  }, [tableData, categoryKey, onPush, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 pt-16 z-50 w-[82vw] max-w-[1500px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{categoryTitle}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {/* {tableData.length} optimization{tableData.length !== 1 ? 's' : ''} • Edit recommended values */}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-2">
                  Validation Errors ({validationErrors.length})
                </h3>
                <ul className="text-sm text-red-800 space-y-1 max-h-32 overflow-y-auto">
                  {validationErrors.slice(0, 5).map((error, idx) => (
                    <li key={idx}>
                      Row {error.row + 1}, {error.field}: {error.message}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li className="font-medium">
                      ... and {validationErrors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-2">
          <AdvancedDataTable
            data={tableData}
            columns={columns}
            onDataChange={setTableData}
            rowsPerPage={10}
            showExportCard={false} 
            showCheckboxColumn={true}
            className="h-full"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">

            <button
              onClick={handleSave}
              disabled={isPushing}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            
            <button
              onClick={handlePush}
              disabled={isPushing}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPushing ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Push Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Add slide-in animation styles (add to global CSS or inline styles)
const styles = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}