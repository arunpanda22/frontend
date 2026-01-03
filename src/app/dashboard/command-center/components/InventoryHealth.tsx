import React from 'react'
import dynamic from 'next/dynamic'
import { useInventoryPerformanceData } from '@/lib/hooks/queries/use-dashboard'

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
})

const InventoryHealthDonut: React.FC = () => {
  const { asinLiquidation } = useInventoryPerformanceData()
  const { data, isLoading, isError } = asinLiquidation

  const healthyInventory = data?.inventory_health?.['0_90_days'] || 0
  const excessInventory = data?.inventory_health?.above_90 || 0
  const strandedInventory = data?.inventory_health?.stranded || 0
  
  const totalInventory = healthyInventory + excessInventory + strandedInventory
  
  const healthyPercentage = totalInventory > 0 ? Math.round((healthyInventory / totalInventory) * 100) : 0
  const excessPercentage = totalInventory > 0 ? Math.round((excessInventory / totalInventory) * 100) : 0
  const strandedPercentage = totalInventory > 0 ? Math.round((strandedInventory / totalInventory) * 100) : 0
  
  const series = [healthyPercentage, excessPercentage, strandedPercentage]
  const labels = ['Healthy', 'Excess', 'Stranded']
  
  // Exact colors from the image: light ocean blue, gold, and a third color
  const chartColors = ['#7EAEED', '#4F94DE', '#FFBF00'];

  const options = {
    labels: labels,
    chart: {
      height: 240,
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
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827',
              offsetY: 8,
              formatter: function (val: string) {
                return val + '%'
              },
            },
            total: {
              show: true,
              showAlways: false,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 400,
              color: '#6B7280',
              formatter: function () {
                return totalInventory.toLocaleString()
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    // fill: {
    //   type: 'gradient' as const,
    //   gradient: {
    //     shade: 'light' as const,
    //     type: 'horizontal' as const,
    //     shadeIntensity: 0.25,
    //     gradientToColors: undefined,
    //     opacityFrom: 1,
    //     opacityTo: 1,
    //     stops: [50, 0, 100],
    //   },
    // },
    legend: {
      show: false,
    },
    colors: chartColors,
    stroke: {
      width: 0,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val: number) {
          return val + '%'
        },
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 200,
          },
        },
      },
    ],
  }

  if (isError) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Health Status
          </h6>
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex flex-col justify-center items-center">
          <div className="text-red-400 text-center">
            <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm">Failed to load inventory data</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Health Status
          </h6>
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-gray-500 text-sm">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  if (!data || totalInventory === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Health Status
          </h6>
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex flex-col justify-center items-center">
          <div className="text-gray-400 text-center">
            <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm">No inventory data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-5 border-b-2 border-gray-300 flex-shrink-0">
        <h6 className="text-base font-semibold text-gray-900">
          Inventory Health Status
        </h6>
      </div>
      
      <div className="p-4 md:p-6 flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-center flex-1">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={240}
            width="100%"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7EAEED' }}></div>
              <div className="text-xs font-semibold text-gray-900">{healthyPercentage}%</div>
            </div>
            <div className="text-xs text-gray-500">Healthy</div>
            <div className="text-xs text-gray-400 font-mono">
              {healthyInventory.toLocaleString()}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#163250' }}></div>
              <div className="text-xs font-semibold text-gray-900">{excessPercentage}%</div>
            </div>
            <div className="text-xs text-gray-500">Excess</div>
            <div className="text-xs text-gray-400 font-mono">
              {excessInventory.toLocaleString()}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFBF00' }}></div>
              <div className="text-xs font-semibold text-gray-900">{strandedPercentage}%</div>
            </div>
            <div className="text-xs text-gray-500">Stranded</div>
            <div className="text-xs text-gray-400 font-mono">
              {strandedInventory.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryHealthDonut