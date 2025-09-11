"use client"

import { useMemo, useState } from 'react'
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material'
import { useAdsTrend } from '@/lib/hooks/queries/use-dashboard'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { AdvancedDataTable, type ColumnDefinition, type TableData } from '@/components/dashboard/table/advanced-data-table'

function formatTrend(val: any): { text: string; color?: string } {
  if (!val) return { text: '→' };
  
  const strVal = String(val).trim();
  
  // Handle complex trend strings like "-32.6% ↓" or "0.0% →"
  if (strVal.includes('↑')) {
    return { text: strVal, color: 'success.main' };
  } else if (strVal.includes('↓')) {
    return { text: strVal, color: 'error.main' };
  } else if (strVal.includes('→')) {
    return { text: strVal, color: 'text.secondary' };
  }
  
  // Fallback: try to parse as number
  const numVal = Number(val);
  if (!isNaN(numVal)) {
    if (numVal > 0) {
      return { text: `+${numVal.toFixed(2)}%`, color: 'success.main' };
    } else if (numVal < 0) {
      return { text: `${numVal.toFixed(2)}%`, color: 'error.main' };
    }
    return { text: '0%', color: 'text.secondary' };
  }
  
  return { text: strVal };
}

// Helper function to detect if a field is a current date field
function isCurrentDateField(fieldName: string): boolean {
  // Matches patterns like "ACOS_20 Aug", "CTR_15 Dec", etc.
  const datePattern = /_\d{1,2}\s[A-Za-z]{3}$/;
  return datePattern.test(fieldName);
}

// Helper function to extract metric name from field
function extractMetricName(fieldName: string): string | null {
  const metrics = ['ACOS', 'CTR', 'Clicks', 'Conversion', 'Impressions', 'Orders', 'Sales', 'Spend'];
  
  for (const metric of metrics) {
    if (fieldName.startsWith(metric + '_')) {
      return metric;
    }
  }
  return null;
}

// Helper function to determine field type based on metric name
function getFieldType(metricName: string): 'percentage' | 'currency' | 'number' | 'trend' {
  switch (metricName) {
    case 'ACOS':
    case 'CTR': 
    case 'Conversion':
      return 'percentage';
    case 'Sales':
      return 'currency';
    case 'Spend':
      return 'currency';
    case 'Impressions':
    case 'Clicks':
    case 'Orders':
      return 'number';
    default:
      return 'number';
  }
}

export default function CampaignXRayTable() {
  const [selectedDays, setSelectedDays] = useState(90);
  
  // Use the same currency formatting as Campaign Summary table
  const { formatCurrency, formatNumber, formatPercentage } = useCurrency();

  // Available days options
  const daysOptions = [
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
    { value: 120, label: '120 Days' },
    { value: 180, label: '180 Days' }
  ];

  // Fetch ads trend data
  const { data: adsTrendData, isLoading, isError, error } = useAdsTrend(selectedDays);

  // Transform data to match AdvancedDataTable format
  const transformedData: TableData[] = useMemo(() => {
    if (!adsTrendData || adsTrendData.length === 0) return [];
    
    return adsTrendData.map((item: Record<string, string | number>, index: number) => {
      // Convert the ads trend data to a flat structure for the table
      const transformedItem: TableData = {};
      
      // Copy all properties from the original item as-is
      Object.keys(item).forEach(key => {
        transformedItem[key] = item[key];
      });
      
      return transformedItem;
    });
  }, [adsTrendData]);

  // Define columns based on actual API response structure with flexible interface
  const dynamicColumns = useMemo<ColumnDefinition[]>(() => {
    if (!transformedData.length) return [];

    const firstRow = transformedData[0];
    const availableFields = Object.keys(firstRow);

    // Base campaign column
    const baseColumns: ColumnDefinition[] = [
      {
        field: 'Campaign',
        headerName: 'Campaign',
        type: 'text',
        editable: false,
        sortable: true,
        filterable: true,
        width: 300,
        minWidth: 250,
        pinned: 'left'
      }
    ];

    // Group fields by metric type
    const fieldGroups: { [key: string]: string[] } = {};
    
    availableFields.forEach(fieldName => {
      if (fieldName === 'Campaign') return;

      const metricName = extractMetricName(fieldName);
      if (metricName) {
        if (!fieldGroups[metricName]) {
          fieldGroups[metricName] = [];
        }
        fieldGroups[metricName].push(fieldName);
      }
    });

    // Create columns for each metric group
    const metricColumns: ColumnDefinition[] = [];
    
    Object.entries(fieldGroups).forEach(([metric, fields]) => {
      const fieldType = getFieldType(metric);
      
      // Sort fields within each metric group
      const sortedFields = fields.sort((a, b) => {
        const aTrend = a.includes('Trend');
        const bTrend = b.includes('Trend');
        
        // Trends go last
        if (aTrend && !bTrend) return 1;
        if (!aTrend && bTrend) return -1;
        
        const aCurrent = isCurrentDateField(a);
        const bCurrent = isCurrentDateField(b);
        
        // Current date fields go second to last (before trends)
        if (aCurrent && !bCurrent && !bTrend) return 1;
        if (!aCurrent && bCurrent && !aTrend) return -1;
        
        // Sort regular periods by duration (longest first)
        const periodOrder = ['60 days', '30 days', '14 days', '7 days'];
        for (const period of periodOrder) {
          if (a.includes(period) && !b.includes(period)) return -1;
          if (!a.includes(period) && b.includes(period)) return 1;
        }
        
        return a.localeCompare(b);
      });

      sortedFields.forEach(fieldName => {
        const isTrend = fieldName.includes('Trend');
        const isCurrent = isCurrentDateField(fieldName);
        
        // Create readable header name
        let headerName = '';
        if (isTrend) {
          headerName = `${metric} Trend`;
        } else if (isCurrent) {
          // Extract date from field name for current period
          const datePart = fieldName.replace(metric + '_', '');
          headerName = `${metric} (${datePart})`;
        } else {
          // Extract period from field name
          const period = fieldName.replace(metric + '_', '');
          headerName = `${metric} (${period})`;
        }

        metricColumns.push({
          field: fieldName,
          headerName: headerName,
          type: 'text', // Use text type for flexibility with the dynamic interface
          editable: false,
          sortable: true,
          filterable: !isTrend,
          width: isTrend ? 200 : (isCurrent ? 200 : 200),
          minWidth: isTrend ? 200 : (isCurrent ? 200 : 200),
          renderCell: (params) => {
            if (isTrend) {
              const trendData = formatTrend(params.value);
              return (
                <span style={{ color: trendData.color }}>
                  {trendData.text}
                </span>
              );
            } else {
              // Apply formatting based on field type using currency context
              // Ensure we have a valid numeric value
              const rawValue = params.value;
              if (rawValue === null || rawValue === undefined || rawValue === '' || isNaN(Number(rawValue))) {
                return '-';
              }
              
              const numericValue = Number(rawValue);
              
              switch (fieldType) {
                case 'percentage':
                  return formatPercentage(numericValue);
                case 'currency':
                  return formatCurrency(numericValue);
                case 'number':
                  return formatNumber(numericValue);
                default:
                  return rawValue || '-';
              }
            }
          }
        });
      });
    });

    return [...baseColumns, ...metricColumns];
  }, [transformedData, formatCurrency, formatNumber, formatPercentage]);

  const [tableColumns, setTableColumns] = useState<ColumnDefinition[]>(dynamicColumns);

  // Update columns when dynamic columns change
  useMemo(() => {
    setTableColumns(dynamicColumns);
  }, [dynamicColumns]);

  // Enhanced initial sort that handles dynamic current date fields
  const initialSort = useMemo(() => {
    if (dynamicColumns.length === 0) return []
    
    // Look for current sales field (with dynamic date)
    const salesCurrentColumn = dynamicColumns.find(col => 
      col.field.includes('Sales') && isCurrentDateField(col.field)
    ) || dynamicColumns.find(col => 
      col.field.includes('Sales') && col.field.includes('7 days')
    )
    
    if (salesCurrentColumn) {
      return [{ field: salesCurrentColumn.field, direction: 'desc' as const }]
    }
    
    return []
  }, [dynamicColumns])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Campaign X-Ray Analysis
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <Typography variant="h6" color="text.secondary" className="ml-3">
            Loading campaign trend data...
          </Typography>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Campaign X-Ray Analysis
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="error">
              Failed to load campaign trend data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error?.message || 'An error occurred while fetching data'}
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  // Handle no data
  if (!transformedData.length) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Campaign X-Ray Analysis
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="text.secondary">
              No campaign data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No campaign trend data found for the selected period
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      {/* Header with days selector and summary */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Campaign X-Ray Analysis
          </h6>
          
          <div className="flex items-center gap-4">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Analysis Period</InputLabel>
              <Select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                label="Analysis Period"
              >
                {daysOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">
                {transformedData.length} Campaigns
              </div>
              <div className="text-xs text-slate-500">
                Last {selectedDays} days
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="p-4 md:p-6 flex-1 min-h-0">
        <AdvancedDataTable
          data={transformedData}
          columns={tableColumns}
          onDataChange={(newData) => {
            // Handle data changes if needed for campaign trends
            console.log('Campaign trend data changed:', newData);
          }}
          onColumnsChange={setTableColumns}
          className="w-full h-full"
          showCheckboxColumn={false}
          initialSort={initialSort}
        />
        
        {/* Footer info */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <Typography variant="body2" color="text.secondary">
            Campaign X-Ray shows performance trends across multiple time periods (7d, 14d, 30d, 60d) with current values and trend indicators.
            Use filters and sorting to identify campaigns with consistent performance or concerning trends.
          </Typography>
        </div>
      </div>
    </div>
  );
}