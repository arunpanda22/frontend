import React, { useState, useMemo, useCallback } from 'react';
import { X, Save, Send, AlertCircle } from 'lucide-react';
import { AdvancedDataTable } from '@/components/dashboard/table/advanced-data-table';
import type { ColumnDefinition, TableData } from '@/components/dashboard/table/advanced-data-table';
import { ConfirmationDialog } from './ConfirmationDialog';
import type { AdsOptimizerResponse } from '../lib/types';
import type { OptimizationKey } from '@/lib/hooks/use-ads-optimizer-store';

// ==================== COLUMN MAPPINGS ====================

const COLUMN_MAPPINGS: Record<string, ColumnDefinition[]> = {
  sp_budget: [
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
  sb_budget: [
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
    { field: 'sales', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 140, autoFitHeader: true },
  ],
  sd_budget: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', width: 160 },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS (%)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'New Budget', headerName: 'Revised Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Budget Change (%)', headerName: 'Budget Change (%)', type: 'text', editable: false, width: 160, autoFitHeader: true },
    { field: 'cost', headerName: 'Spend', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 140, autoFitHeader: true },
  ],
  sp_bid: [
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
    { field: 'New bid', headerName: 'Revised Bid', type: 'number', editable: true, width: 150, autoFitHeader: true },
    { field: 'Bid Change (%)', headerName: 'Bid Change (%)', type: 'text', editable: false, width: 140, autoFitHeader: true },
  ],
  sb_bid: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group Name', type: 'text', editable: false, autoFitHeader: true },
    { field: 'keyword_text', headerName: 'Keyword', type: 'text', editable: false, autoFitHeader: true },
    { field: 'targeting_expression', headerName: 'Targeting', type: 'text', editable: false, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'CPC', headerName: 'CPC', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'purchases', headerName: 'Orders (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'ACOS', headerName: 'ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'campaign_budget_amount', headerName: 'Daily Budget', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'keyword_bid', headerName: 'Present Bid', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'New bid', headerName: 'Revised Bid', type: 'number', editable: true, width: 150, autoFitHeader: true },
    { field: 'Bid Change (%)', headerName: 'Bid Change (%)', type: 'text', editable: false, width: 140, autoFitHeader: true },
  ],
  sd_bid: [
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group Name', type: 'text', editable: false, autoFitHeader: true },
    { field: 'targeting_expression', headerName: 'Targeting', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'cpc', headerName: 'CPC', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'purchases', headerName: 'Orders (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue (30d)', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'acos', headerName: 'ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'bid', headerName: 'Present Bid', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'ideal bid', headerName: 'Revised Bid', type: 'number', editable: true, width: 150, autoFitHeader: true },
  ],
  sp_placement: [
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
    { field: 'Percentage', headerName: 'Bid Adjustment (%)', type: 'number', editable: true, width: 180, autoFitHeader: true },
  ],
  sb_placement: [
    { field: 'ASIN_Derived', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'placement_classification', headerName: 'Placement', type: 'text', editable: false, autoFitHeader: true },
    { field: 'start_date', headerName: 'Start Date', type: 'text', editable: false, autoFitHeader: true },
    { field: 'impressions', headerName: 'Impressions', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'clicks', headerName: 'Clicks', type: 'number', editable: false, width: 100, autoFitHeader: true },
    { field: 'cost', headerName: 'Cost', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'sales', headerName: 'Revenue', type: 'number', editable: false, width: 140, autoFitHeader: true },
    { field: 'purchases', headerName: 'Orders', type: 'number', editable: false, width: 130, autoFitHeader: true },
    { field: 'units_sold', headerName: 'Units Sold', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'target_acos', headerName: 'Target ACOS', type: 'number', editable: false, width: 120, autoFitHeader: true },
    { field: 'Percentage', headerName: 'Bid Adjustment (%)', type: 'number', editable: true, width: 180, autoFitHeader: true },
  ],
  sp_new_campaigns: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'Campaign Name', headerName: 'Campaign Name', type: 'text', editable: true, autoFitHeader: true },
    { field: 'Targeting', headerName: 'Target', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'Type', headerName: 'Targeting Type', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, width: 130, autoFitHeader: true },
    { field: 'Bid', headerName: 'Bid', type: 'number', editable: true, width: 120, autoFitHeader: true },
    { field: 'Campaign Budget', headerName: 'Campaign Budget', type: 'number', editable: true, width: 120, autoFitHeader: true },
    { field: 'Bidding Strategy', headerName: 'Bidding Strategy', type: 'text', editable: true, width: 120, autoFitHeader: true },
    { field: 'Top of Search Amazon', headerName: 'Top of Search Amazon', type: 'number', editable: true, width: 120, autoFitHeader: true },
    { field: 'Rest of Search Amazon', headerName: 'Rest of Search Amazon', type: 'number', editable: true, width: 120, autoFitHeader: true },
    { field: 'Product Pages Amazon', headerName: 'Product Pages Amazon', type: 'number', editable: true, width: 120, autoFitHeader: true },
  ],
  sb_new_campaigns: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'Campaign Name', headerName: 'Campaign Name', type: 'text', editable: true, autoFitHeader: true },
    { field: 'Campaign Budget', headerName: 'Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Targeting', headerName: 'Target', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'match_type', headerName: 'Match Type', type: 'text', editable: false, width: 130, autoFitHeader: true },
    { field: 'Ad Type', headerName: 'Ad Type', type: 'text', editable: false, width: 150, autoFitHeader: true },
    { field: 'Bid', headerName: 'Bid', type: 'number', editable: true, width: 120, autoFitHeader: true },
  ],
  sp_negatives: [
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_id', headerName: 'Campaign ID', type: 'text', editable: false, autoFitHeader: true },
    { field: 'ad_group_name', headerName: 'Ad Group', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'ad_group_id', headerName: 'Ad Group ID', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'search_term', headerName: 'Search Term', type: 'text', editable: false, width: 250, autoFitHeader: true },
  ],
  sb_negatives: [
    { field: 'campaign_name', headerName: 'Campaign Name', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'campaign_id', headerName: 'Campaign ID', type: 'text', editable: false, autoFitHeader: true },
    // { field: 'ad_group_name', headerName: 'Ad Group', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'ad_group_id', headerName: 'Ad Group ID', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'search_term', headerName: 'Search Term', type: 'text', editable: false, width: 250, autoFitHeader: true },
  ],
};

// ==================== VALIDATION ====================

interface ValidationError { row: number; field: string; message: string; }

function validateData(data: TableData[], categoryKey: string): ValidationError[] {
  const errors: ValidationError[] = [];
  data.forEach((row, index) => {
    if (categoryKey.includes('budget')) {
      const v = row['New Budget'];
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (isNaN(n) || n < 1)
          errors.push({ row: index, field: 'New Budget', message: 'Budget must be at least $1' });
      }
    }
    if (categoryKey.includes('bid')) {
      const field = categoryKey === 'sd_bid' ? 'ideal bid' : 'New bid';
      const v = row[field];
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (isNaN(n) || n < 0.02)
          errors.push({ row: index, field, message: 'Bid must be at least $0.02' });
      }
    }
    if (categoryKey.includes('placement')) {
      const v = row['Percentage'];
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (isNaN(n) || n < -99 || n > 900)
          errors.push({ row: index, field: 'Percentage', message: 'Must be between -99% and 900%' });
      }
    }
    if (categoryKey.includes('new_campaigns')) {
      const budget = Number(row['Campaign Budget']);
      if (isNaN(budget) || budget < 1)
        errors.push({ row: index, field: 'Campaign Budget', message: 'Budget must be at least $1' });
      const bid = Number(row['Bid']);
      if (isNaN(bid) || bid < 0.02)
        errors.push({ row: index, field: 'Bid', message: 'Bid must be at least $0.02' });
      if (!row['Campaign Name'] || String(row['Campaign Name']).trim() === '')
        errors.push({ row: index, field: 'Campaign Name', message: 'Campaign name is required' });
    }
    if (categoryKey.includes('negatives')) {
      const field = categoryKey === 'sp_negatives' ? 'search_term' : 'query';
      if (!row[field] || String(row[field]).trim() === '')
        errors.push({ row: index, field, message: 'Search term is required' });
      if (!row['campaign_id'])
        errors.push({ row: index, field: 'campaign_id', message: 'Campaign ID is required' });
      if (!row['ad_group_id'])
        errors.push({ row: index, field: 'ad_group_id', message: 'Ad Group ID is required' });
    }
  });
  return errors;
}

// ==================== UNIQUE KEY ====================
// Always append |idx:{index} to guarantee uniqueness even when business
// fields (campaign_id + ad_group_id) are identical across rows.
function generateRowKey(row: TableData, categoryKey: string, index: number): string {
  const parts: string[] = [];
  if (row.campaign_id) parts.push(`c:${row.campaign_id}`);
  if ((categoryKey.includes('bid') || categoryKey.includes('negatives')) && row.ad_group_id)
    parts.push(`ag:${row.ad_group_id}`);
  if (categoryKey.includes('bid') && row.targeting_id)
    parts.push(`t:${row.targeting_id}`);
  if (categoryKey.includes('negatives') && row.keyword_text)
    parts.push(`kw:${row.keyword_text}`);
  if (categoryKey.includes('placement') && row.placement_type)
    parts.push(`p:${row.placement_type}`);
  parts.push(`idx:${index}`);
  return parts.join('|');
}

// ==================== PROPS ====================

interface OptimizationTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryKey: OptimizationKey;
  categoryTitle: string;
  /** Current data from the store — read once on open */
  initialData: any[];
  /** Persist changes back to the store */
  onSave: (key: OptimizationKey, data: any[]) => void;
  onPush: (key: OptimizationKey, data: any[], dryrun?: boolean) => Promise<void>;
}

// ==================== COMPONENT ====================

export const OptimizationTableDrawer: React.FC<OptimizationTableDrawerProps> = ({
  isOpen,
  onClose,
  categoryKey,
  categoryTitle,
  initialData,
  onSave,
  onPush,
}) => {
  // ── Local working copy ───────────────────────────────────────────────────
  // tableData is initialised from initialData when the drawer opens and is
  // the ONLY state the table reads/writes. Nothing in here touches the store
  // until the user explicitly clicks Save or Push Changes.
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isPushing, setIsPushing] = useState(false);
  const [showPushConfirm, setShowPushConfirm] = useState(false);

  // Initialise local copy whenever the drawer opens.
  // We use a key-based approach: the parent unmounts/remounts the drawer
  // (via {selectedCategory && <Drawer>}) so this effect always sees a fresh
  // component with the current initialData from the store.
  React.useEffect(() => {
    if (!isOpen) return;
    const transformed = initialData.map((item, index) => ({
      ...item,
      _rowKey: generateRowKey(item, categoryKey, index),
    }));
    setTableData(transformed);
    setValidationErrors([]);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ Intentionally only [isOpen] — initialData is captured at open time.
  //   Because the parent conditionally mounts this component, every open is
  //   a fresh mount so initialData is always the latest store value.

  const columns = useMemo(
    () => COLUMN_MAPPINGS[categoryKey] ?? [],
    [categoryKey],
  );

  // ── Clean data (strip internal fields before writing to store) ───────────
  const getCleanData = useCallback(
    () => tableData.map(({ _rowKey, ...rest }) => rest),
    [tableData],
  );

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const errors = validateData(tableData, categoryKey);
    if (errors.length > 0) { setValidationErrors(errors); return; }

    onSave(categoryKey, getCleanData());
    toast_success(`Saved ${tableData.length} ${categoryTitle} optimizations`);
    setValidationErrors([]);
    onClose();
  }, [tableData, categoryKey, categoryTitle, onSave, onClose, getCleanData]);

  // ── Push ─────────────────────────────────────────────────────────────────
  const handlePushConfirm = useCallback(() => {
    const errors = validateData(tableData, categoryKey);
    if (errors.length > 0) { setValidationErrors(errors); return; }
    setShowPushConfirm(true);
  }, [tableData, categoryKey]);

  const handlePush = useCallback(async (dryrun = false) => {
    setIsPushing(true);
    setShowPushConfirm(false);
    try {
      const clean = getCleanData();
      // Save to store first so the card count reflects the pushed data
      onSave(categoryKey, clean);
      await onPush(categoryKey, clean, dryrun);
      setValidationErrors([]);
      onClose();
    } catch (err) {
      console.error('Push failed:', err);
    } finally {
      setIsPushing(false);
    }
  }, [categoryKey, getCleanData, onSave, onPush, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 pt-16 z-50 w-[82vw] max-w-[1500px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{categoryTitle}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {tableData.length} optimization{tableData.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-2">
                  Validation Errors ({validationErrors.length})
                </h3>
                <ul className="text-sm text-red-800 space-y-1 max-h-32 overflow-y-auto">
                  {validationErrors.slice(0, 5).map((e, i) => (
                    <li key={i}>Row {e.row + 1}, {e.field}: {e.message}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li className="font-medium">…and {validationErrors.length - 5} more</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto p-2">
          <AdvancedDataTable
            data={tableData}
            columns={columns}
            onDataChange={setTableData}
            rowsPerPage={10}
            showCheckboxColumn={true}
            className="h-full"
            filename={categoryTitle.replace(/\s+/g, '_')}
            rowKey="_rowKey"
          />
        </div>

        {/* Footer */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={handlePushConfirm}
              disabled={isPushing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
            >
              {isPushing ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Pushing...</>
              ) : (
                <><Send className="w-3 h-3" />Push Changes</>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showPushConfirm}
        onClose={() => setShowPushConfirm(false)}
        onConfirm={handlePush}
        title="Push Optimizations"
        message={`Push ${tableData.length} ${categoryTitle} optimizations? Choose "Dry Run" to test without applying changes.`}
        variant="info"
        confirmText="Push"
        cancelText="Cancel"
        showDryRun={true}
      />
    </>
  );
};

// Tiny inline toast helper so the drawer doesn't need to import react-hot-toast
function toast_success(msg: string) {
  try { (window as any).__toastSuccess?.(msg); } catch {}
}

// Slide-in animation
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
  `;
  document.head.appendChild(s);
}