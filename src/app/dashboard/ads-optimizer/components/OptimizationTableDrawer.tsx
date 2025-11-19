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
    // { field: 'dynamic_bidding', headerName: 'Bidding Strategy', type: 'text', editable: false, width: 160, autoFitHeader: true },
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
      
  // Bid optimizations (SP, SB, SD)
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
    { field: 'Bid Change (%)', headerName: 'Bid Change (%)', type: 'text', editable: false, width: 140, autoFitHeader: true }
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
    { field: 'Bid Change (%)', headerName: 'Bid Change (%)', type: 'text', editable: false, width: 140, autoFitHeader: true }
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

  // SP Placement optimizations
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

  // SB Placement optimizations
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

  // New campaign suggestions
  sp_new_campaigns: [
    { field: 'ASIN', headerName: 'ASIN', type: 'text', editable: false, pinned: 'left', autoFitHeader: true },
    { field: 'Campaign Name', headerName: 'Campaign Name', type: 'text', editable: true, autoFitHeader: true },
    // { field: 'Campaign Budget', headerName: 'Daily Budget', type: 'number', editable: true, width: 160, autoFitHeader: true },
    { field: 'Targeting', headerName: 'Target', type: 'text', editable: false, width: 250, autoFitHeader: true },
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

  // Negative keywords
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
    { field: 'ad_group_name', headerName: 'Ad Group', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'ad_group_id', headerName: 'Ad Group ID', type: 'text', editable: false, width: 250, autoFitHeader: true },
    { field: 'query', headerName: 'Search Term', type: 'text', editable: false, width: 250, autoFitHeader: true },

  ],
};

// Helper to get column config based on category key
const getColumnsForCategory = (categoryKey: string): ColumnDefinition[] => {
  if (categoryKey === 'sp_budget') return COLUMN_MAPPINGS.sp_budget;
  if (categoryKey === 'sb_budget') return COLUMN_MAPPINGS.sb_budget;
  if (categoryKey === 'sd_budget') return COLUMN_MAPPINGS.sd_budget;
  if (categoryKey === 'sp_bid') return COLUMN_MAPPINGS.sp_bid;
  if (categoryKey === 'sb_bid') return COLUMN_MAPPINGS.sb_bid;
  if (categoryKey === 'sd_bid') return COLUMN_MAPPINGS.sd_bid;
  if (categoryKey === 'sp_placement') return COLUMN_MAPPINGS.sp_placement;
  if (categoryKey === 'sb_placement') return COLUMN_MAPPINGS.sb_placement;
  if (categoryKey === 'sp_new_campaigns') return COLUMN_MAPPINGS.sp_new_campaigns;
  if (categoryKey === 'sb_new_campaigns') return COLUMN_MAPPINGS.sb_new_campaigns;
  if (categoryKey === 'sp_negatives') return COLUMN_MAPPINGS.sp_negatives;
  if (categoryKey === 'sb_negatives') return COLUMN_MAPPINGS.sb_negatives;
  return [];
};

// ==================== VALIDATION ====================
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
      const rawBudget = row['New Budget'];
      // Check if the field has a value before converting to number
      if (rawBudget !== undefined && rawBudget !== null && rawBudget !== '') {
        const newBudget = Number(rawBudget);
        if (isNaN(newBudget) || newBudget < 0) {
          errors.push({ row: index, field: 'New Budget', message: 'Must be a positive number' });
        } else if (newBudget < 1) {
          errors.push({ row: index, field: 'New Budget', message: 'Budget must be at least $1' });
        }
      }
    }

    // Bid validations - Handle different field names
    if (categoryKey.includes('bid')) {
      let rawBidValue: any;
      let bidFieldName: string;

      // SP and SB use 'New bid', SD uses 'ideal bid'
      if (categoryKey === 'sd_bid') {
        rawBidValue = row['ideal bid'];
        bidFieldName = 'ideal bid';
      } else {
        rawBidValue = row['New bid'];
        bidFieldName = 'New bid';
      }

      if (rawBidValue !== undefined && rawBidValue !== null && rawBidValue !== '') {
        const bidValue = Number(rawBidValue);
        if (isNaN(bidValue) || bidValue < 0) {
          errors.push({ row: index, field: bidFieldName, message: 'Must be a positive number' });
        } else if (bidValue < 0.02) {
          errors.push({ row: index, field: bidFieldName, message: 'Bid must be at least $0.02' });
        }
      }
    }

    // Placement validations
    if (categoryKey.includes('placement')) {
      const rawAdjustment = row['Percentage'];
      if (rawAdjustment !== undefined && rawAdjustment !== null && rawAdjustment !== '') {
        const adjustment = Number(rawAdjustment);
        if (isNaN(adjustment) || adjustment < -99 || adjustment > 900) {
          errors.push({ 
            row: index, 
            field: 'Percentage', 
            message: 'Must be between -99% and 900%' 
          });
        }
      }
    }

    // New campaign validations
    if (categoryKey.includes('new_campaigns')) {
      const rawBudget = row['Campaign Budget'];
      if (rawBudget !== undefined && rawBudget !== null && rawBudget !== '') {
        const budget = Number(rawBudget);
        if (isNaN(budget) || budget < 1) {
          errors.push({ row: index, field: 'Campaign Budget', message: 'Budget must be at least $1' });
        }
      }
      
      const rawBid = row['Bid'];
      if (rawBid !== undefined && rawBid !== null && rawBid !== '') {
        const bid = Number(rawBid);
        if (isNaN(bid) || bid < 0.02) {
          errors.push({ row: index, field: 'Bid', message: 'Bid must be at least $0.02' });
        }
      }
      
      if (!row['Campaign Name'] || String(row['Campaign Name']).trim() === '') {
        errors.push({ row: index, field: 'Campaign Name', message: 'Campaign name is required' });
      }


    }

    // Negative keywords validations
    if (categoryKey.includes('negatives')) {
      // SP uses 'search_term', SB uses 'query'
      const searchTermField = categoryKey === 'sp_negatives' ? 'search_term' : 'query';
      const searchTerm = row[searchTermField];
      
      if (!searchTerm || String(searchTerm).trim() === '') {
        errors.push({ 
          row: index, 
          field: searchTermField === 'search_term' ? 'Search Term' : 'Query', 
          message: 'Search term is required' 
        });
      }

      if (!row['campaign_id']) {
        errors.push({ row: index, field: 'campaign_id', message: 'Campaign ID is required' });
      }

      if (!row['ad_group_id']) {
        errors.push({ row: index, field: 'ad_group_id', message: 'Ad Group ID is required' });
      }
    }
  });

  return errors;
};

// Helper function to check if a value is empty/null/undefined
const isEmpty = (value: any): boolean => {
  return value === undefined || value === null || value === '';
};

// Enhanced validation with specific field mappings
const FIELD_VALIDATIONS: Record<string, {
  minValue?: number;
  maxValue?: number;
  required?: boolean;
  allowedValues?: string[];
  customMessage?: string;
}> = {
  // Budget fields
  'New Budget': {
    minValue: 1,
    customMessage: 'Budget must be at least $1'
  },
  
  // Bid fields
  'New bid': {
    minValue: 0.02,
    customMessage: 'Bid must be at least $0.02'
  },
  'ideal bid': {
    minValue: 0.02,
    customMessage: 'Bid must be at least $0.02'
  },
  'Bid': {
    minValue: 0.02,
    customMessage: 'Bid must be at least $0.02'
  },
  
  // Placement fields
  'Percentage': {
    minValue: -99,
    maxValue: 900,
    customMessage: 'Must be between -99% and 900%'
  },
  
  // Campaign fields
  'Campaign Budget': {
    minValue: 1,
    customMessage: 'Campaign budget must be at least $1'
  },
  'Campaign Name': {
    required: true,
    customMessage: 'Campaign name is required'
  },
  
  // Placement adjustments
  'Top of Search Amazon': {
    minValue: 0,
    maxValue: 900,
    customMessage: 'Must be between 0% and 900%'
  },
  'Rest of Search Amazon': {
    minValue: 0,
    maxValue: 900,
    customMessage: 'Must be between 0% and 900%'
  },
  'Product Pages Amazon': {
    minValue: 0,
    maxValue: 900,
    customMessage: 'Must be between 0% and 900%'
  },
  
  // Bidding strategy
  'Bidding Strategy': {
    allowedValues: ['Dynamic bids - down only', 'Dynamic bids - up and down', 'Fixed bids'],
    customMessage: 'Must be a valid bidding strategy'
  },

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
              {tableData.length} optimization{tableData.length !== 1 ? 's' : ''}
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