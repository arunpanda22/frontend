// "use client"

// import { useMemo, useState, useEffect } from 'react'
// import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material'
// // import { useSalesTrendAsin } from '@/lib/hooks/queries/use-dashboard'
// import { SalesTrendPivotData } from '@/lib/api/services/dashboard.service'
// import { AdvancedDataTable, type ColumnDefinition, type TableData } from '@/components/dashboard/table/advanced-data-table'
// import { useDateRange } from '@/lib/context/DateRangeContext'

// // Helper functions with null safety
// function formatNumber(val: any, digits = 2): string {
//   if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '-';
//   const num = Number(val);
//   return num.toLocaleString(undefined, { maximumFractionDigits: digits });
// }

// function formatPercent(val: any, digits = 2): string {
//   if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '-';
//   const num = Number(val);
//   return num.toFixed(digits) + '%';
// }

// function formatTrend(val: any): { text: string; color?: string } {
//   if (!val || val === 0) return { text: '→' };
  
//   const numVal = Number(val);
//   if (isNaN(numVal)) {
//     // Handle string trend indicators like '↑', '↓'
//     const strVal = String(val);
//     if (strVal.includes('↑') || strVal.includes('+')) {
//       return { text: strVal, color: 'success.main' };
//     } else if (strVal.includes('↓') || strVal.includes('-')) {
//       return { text: strVal, color: 'error.main' };
//     }
//     return { text: strVal };
//   }
  
//   // Handle numeric trend percentages
//   if (numVal > 0) {
//     return { text: `+${numVal.toFixed(2)}%`, color: 'success.main' };
//   } else if (numVal < 0) {
//     return { text: `${numVal.toFixed(2)}%`, color: 'error.main' };
//   }
  
//   return { text: '0%' };
// }

// // Update the import and usage in page.tsx:
// // Remove the props when calling AsinSalesTable

// // In the parent component (page.tsx), change from:
// // <AsinSalesTable
// //   startDate={dateRange.startDate || ""}
// //   endDate={dateRange.endDate || ""}
// // />

// // To:
// // <AsinSalesTable />

// export default function AsinSalesTable() {
//   // Get date range from context
//   const { dateRange } = useDateRange();
  
//   const [selectedPeriod, setSelectedPeriod] = useState('30d');

//   // Available period options
//   const periodOptions = [
//     { value: '14d', label: '14 Days' },
//     { value: '30d', label: '30 Days' },
//     { value: '60d', label: '60 Days' },
//     { value: '90d', label: '90 Days' },
//     { value: 'current_month', label: 'Current Month' },
//     { value: 'previous_month', label: 'Previous Month' }
//   ];

//   // Sync selectedPeriod with context dateRange preset
//   useEffect(() => {
//     if (dateRange.preset && dateRange.preset !== 'custom') {
//       setSelectedPeriod(dateRange.preset);
//     }
//   }, [dateRange.preset]);

//   // Format the period parameter based on context
//   // Backend accepts: '7d', '14d', '30d', 'current_month', 'previous_month', or 'YYYY-MM-DD to YYYY-MM-DD'
//   const queryPeriod = useMemo(() => {
//     if (dateRange.preset === 'custom' && dateRange.startDate && dateRange.endDate) {
//       // Format custom date range as: 'YYYY-MM-DD to YYYY-MM-DD'
//       const formattedPeriod = `${dateRange.startDate} to ${dateRange.endDate}`;
//       console.log('📊 Sales Trend ASIN: Using custom date range:', formattedPeriod);
//       return formattedPeriod;
//     }
//     // Use the selected period preset (e.g., '30d', '60d', etc.)
//     console.log('📊 Sales Trend ASIN: Using preset period:', selectedPeriod);
//     return selectedPeriod;
//   }, [dateRange.preset, dateRange.startDate, dateRange.endDate, selectedPeriod]);

//   // Fetch ASIN sales trend data using the formatted period
//   // const { data: salesTrendData, isLoading, isError, error } = useSalesTrendAsin(queryPeriod);

//   // Debug logging
//   useEffect(() => {
//     if (salesTrendData) {
//       console.log('📊 Sales Trend ASIN Data Loaded:', {
//         totalAsins: salesTrendData.summary?.total_asins,
//         periodsAnalyzed: salesTrendData.summary?.periods_analyzed,
//         dateRange: salesTrendData.summary?.date_range,
//         dataPoints: salesTrendData.pivoted_data?.length
//       });
//     }
//   }, [salesTrendData]);

//   // Extract pivot data and summary
//   const { pivotedData, summary } = useMemo(() => {
//     if (!salesTrendData) {
//       return { pivotedData: [], summary: null };
//     }

//     return {
//       pivotedData: salesTrendData.pivoted_data || [],
//       summary: salesTrendData.summary
//     };
//   }, [salesTrendData]);

//   // Transform data to match AdvancedDataTable format
//   const transformedData: TableData[] = useMemo(() => {
//     if (!pivotedData || pivotedData.length === 0) return [];
    
//     return pivotedData.map((item: SalesTrendPivotData, index: number) => {
//       // Convert the pivot data object to a flat structure
//       const transformedItem: TableData = {};
      
//       // Copy all properties from the original item
//       Object.keys(item).forEach(key => {
//         transformedItem[key] = item[key as keyof SalesTrendPivotData];
//       });
      
//       return transformedItem;
//     });
//   }, [pivotedData]);

//   // Dynamic column generation based on available data with auto-fit support
//   const dynamicColumns = useMemo<ColumnDefinition[]>(() => {
//     if (!transformedData.length) return [];

//     // Get all available column names from the first row
//     const firstRow = transformedData[0];
//     const availableColumns = Object.keys(firstRow);

//     // Base columns that should always be present
//     const baseColumns: ColumnDefinition[] = [
//       {
//         field: 'ASIN',
//         headerName: 'ASIN',
//         type: 'text',
//         editable: false,
//         sortable: true,
//         filterable: true,
//         width: 130,
//         minWidth: 120,
//         pinned: 'left'
//       },
//       {
//         field: 'Product Name',
//         headerName: 'Product Name',
//         type: 'text',
//         editable: false,
//         sortable: true,
//         filterable: true,
//         width: 350,
//         minWidth: 250,
//         maxWidth: 500
//       }
//     ];

//     // Extract metrics and periods from column names
//     const metricColumns: ColumnDefinition[] = [];
//     const processedColumns = new Set(['ASIN', 'Product Name']);

//     // Define expected metrics and their formatting
//     const metricFormatters = {
//       Sessions: { formatter: formatNumber, type: 'number' as const },
//       Cost: { formatter: formatNumber, type: 'number' as const },
//       Orders: { formatter: formatNumber, type: 'number' as const },
//       Sales: { formatter: formatNumber, type: 'number' as const },
//       'Conversion%': { formatter: formatPercent, type: 'number' as const },
//       'TACOS%': { formatter: formatPercent, type: 'number' as const },
//     };

//     // Group columns by metric type
//     const columnGroups: { [key: string]: string[] } = {};
    
//     availableColumns.forEach(colName => {
//       if (processedColumns.has(colName)) return;

//       // Parse column name format: "Metric_Period" or "Metric_Trend"
//       const parts = colName.split('_');
//       if (parts.length >= 2) {
//         const metric = parts[0];
//         const period = parts.slice(1).join('_');

//         if (!columnGroups[metric]) {
//           columnGroups[metric] = [];
//         }
//         columnGroups[metric].push(colName);
//       }
//     });

//     // Create columns for each metric group with auto-fit
//     Object.entries(columnGroups).forEach(([metric, columns]) => {
//       const metricConfig = metricFormatters[metric as keyof typeof metricFormatters];
//       const columnType = metricConfig?.type || 'text';
      
//       // Sort columns within each metric group (periods first, then trend)
//       const sortedColumns = columns.sort((a, b) => {
//         if (a.includes('Trend')) return 1;
//         if (b.includes('Trend')) return -1;
//         return a.localeCompare(b);
//       });

//       sortedColumns.forEach(colName => {
//         const parts = colName.split('_');
//         const period = parts.slice(1).join('_');
//         const isTrend = period.includes('Trend');

//         metricColumns.push({
//           field: colName,
//           headerName: isTrend ? `${metric} Trend` : `${metric} (${period})`,
//           type: columnType,
//           editable: false,
//           sortable: true,
//           filterable: !isTrend,
//           autoFitHeader: true,  // Enable auto-fit for all metric columns
//           minWidth: isTrend ? 120 : 180,
//           maxWidth: isTrend ? 250 : 280
//         });
//       });
//     });

//     return [...baseColumns, ...metricColumns];
//   }, [transformedData]);

//   const [tableColumns, setTableColumns] = useState<ColumnDefinition[]>(dynamicColumns);

//   // Update columns when dynamic columns change
//   useMemo(() => {
//     setTableColumns(dynamicColumns);
//   }, [dynamicColumns]);

//   const initialSort = useMemo(() => {
//     if (dynamicColumns.length === 0) return []
    
//     // Find the 60-day sales column dynamically
//     const salesColumn = dynamicColumns.find(col => 
//       col.field.includes('Sales') && col.field.includes('60d')
//     )
    
//     if (salesColumn) {
//       return [{ field: salesColumn.field, direction: 'desc' as const }]
//     }
    
//     return []
//   }, [dynamicColumns])

//   // Handle loading state
//   if (isLoading) {
//     return (
//       <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
//         <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
//           <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
//             ASIN Sales Trend Analysis
//           </h6>
//         </div>
//         <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//           <Typography variant="h6" color="text.secondary" className="ml-3">
//             Loading ASIN sales trend data...
//           </Typography>
//         </div>
//       </div>
//     );
//   }

//   // Handle error state
//   if (isError) {
//     return (
//       <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
//         <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
//           <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
//             ASIN Sales Trend Analysis
//           </h6>
//         </div>
//         <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
//           <div className="text-center">
//             <Typography variant="h6" color="error">
//               Failed to load ASIN sales trend data
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               {error?.message || 'An error occurred while fetching data'}
//             </Typography>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Handle no data
//   if (!transformedData.length) {
//     return (
//       <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
//         <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
//           <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
//             ASIN Sales Trend Analysis
//           </h6>
//         </div>
//         <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
//           <div className="text-center">
//             <Typography variant="h6" color="text.secondary">
//               No ASIN data available
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               {summary?.error || 'No data found for the selected period'}
//             </Typography>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
//       {/* Header with period selector and summary - matches ASIN Performance styling */}
//       <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
//         <div className="flex justify-between items-center flex-wrap gap-4">
//           <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
//             ASIN Sales Trend Analysis
//           </h6>
          
//           <div className="flex items-center gap-4">
//             {/* Show period selector only when not using custom date range */}
//             {dateRange.preset !== 'custom' && (
//               <FormControl size="small" sx={{ minWidth: 150 }}>
//                 <InputLabel>Period</InputLabel>
//                 <Select
//                   value={selectedPeriod}
//                   onChange={(e) => setSelectedPeriod(e.target.value)}
//                   label="Period"
//                 >
//                   {periodOptions.map((option) => (
//                     <MenuItem key={option.value} value={option.value}>
//                       {option.label}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             )}
            
//             {/* Show custom date range indicator when using custom dates */}
//             {dateRange.preset === 'custom' && dateRange.startDate && dateRange.endDate && (
//               <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
//                 <span className="text-sm font-medium text-blue-700">
//                   Custom: {dateRange.startDate} to {dateRange.endDate}
//                 </span>
//               </div>
//             )}
            
//             {summary && (
//               <div className="text-right">
//                 <div className="text-sm font-medium text-slate-700">
//                   {summary.total_asins} ASINs • {summary.periods_analyzed} periods
//                 </div>
//                 {summary.date_range && (
//                   <div className="text-xs text-slate-500">
//                     {summary.date_range}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       {/* Table Content */}
//       <div className="p-4 md:p-6 flex-1 min-h-0">
//         <AdvancedDataTable
//           data={transformedData}
//           columns={tableColumns}
//           onDataChange={(newData) => {
//             // Handle data changes if needed for sales trend
//             console.log('Sales trend data changed:', newData);
//           }}
//           onColumnsChange={setTableColumns}
//           className="w-full h-full"
//           showCheckboxColumn={false}
//           initialSort={initialSort}
//         />
        
//         {/* Footer info */}
//         <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
//           <Typography variant="body2" color="text.secondary">
//             Data shows daily averages for each period. Trend columns show percentage change or directional indicators.
//             Use filters and sorting to analyze performance across different time periods.
//           </Typography>
//         </div>
//       </div>
//     </div>
//   );
// }