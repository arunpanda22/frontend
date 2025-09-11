import React from 'react'
import dynamic from 'next/dynamic'
import { useSalesContributionByCategory } from '@/lib/hooks/queries/use-dashboard'
import { useDateRange } from '@/lib/context/DateRangeContext'
import { useCurrency } from '@/lib/context/CurrencyContext' // Add this import

// Dynamically import ReactApexChart
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

const SalesContributionDonut: React.FC = () => {
  const { dateRange } = useDateRange()
  const { formatCurrency } = useCurrency() // Add this hook
  
  // Use the API hook with date range context
  const { data, isLoading, error } = useSalesContributionByCategory({
    start_date: dateRange.startDate || '',
    end_date: dateRange.endDate || ''
  }, !!(dateRange.startDate && dateRange.endDate))

  // Extract data from API response
  const salesContributionByCategory = data?.sales_contribution_by_category || []
  const totalSales = data?.total_sales || 0

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Sales Contribution by Category
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Sales Contribution by Category
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">Failed to load sales contribution data</p>
        </div>
      </div>
    )
  }

  // No data state
  if (salesContributionByCategory.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Sales Contribution by Category
          </h6>
          <p className="text-sm text-gray-500 mt-1">
            No data available
          </p>
        </div>
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">No sales data for selected period</p>
        </div>
      </div>
    )
  }

  // Chart data preparation
  const series = salesContributionByCategory.map((item) =>
    parseFloat(item.sales_contribution_pct.toFixed(2))
  )
  const labels = salesContributionByCategory.map((item) => item.category)
  const chartColors = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#F43F5E']

  const options = {
    labels,
    chart: {
      height: 160,
      type: 'donut' as const,
      fontFamily: 'inherit',
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '12px',
              fontWeight: 500,
              color: '#374151',
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '16px',
              fontWeight: 700,
              color: '#111827',
              offsetY: 8,
              formatter: function (val: string) {
                return val + '%'
              },
            },
            total: {
              show: true,
              label: 'Total Sales',
              fontSize: '12px',
              fontWeight: 400,
              color: '#6B7280',
              formatter: function () {
                // Replace hardcoded ₹ with dynamic currency formatting
                return formatCurrency(totalSales)
              },
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors: chartColors,
    stroke: { width: 0 },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val: number, opts: any) {
          const category = labels[opts.seriesIndex]
          const sales = salesContributionByCategory[opts.seriesIndex].sales
          // Replace hardcoded ₹ with dynamic currency formatting
          return `${val}% (${formatCurrency(sales)})`
        },
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: { chart: { height: 140 } },
      },
    ],
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          Sales Contribution by Category
        </h6>
       
        {data?.period && (
          <p className="text-xs text-gray-400 mt-1">
            {data.period.start_date} to {data.period.end_date}
          </p>
        )}
      </div>

      <div className="p-4 md:p-6 flex-1 flex flex-col justify-center">
        {/* Donut chart */}
        <div className="flex items-center justify-center flex-1">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={260}
            width="100%"
          />
        </div>

        {/* Label + percent list */}
        <div className="grid grid-cols-1 gap-2 mt-4">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: chartColors[index] }}
                ></div>
                <span className="text-xs text-gray-500 truncate">{label}</span>
              </div>
              <span className="text-xs font-semibold text-gray-900 ml-2">
                {series[index]}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SalesContributionDonut