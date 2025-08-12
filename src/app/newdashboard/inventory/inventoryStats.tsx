import React, { useEffect, useState } from 'react'
import { Boxes, TrendingUp, Droplet } from 'lucide-react'

const statCardsConfig = [
  {
    label: 'Total Inventory',
    icon: <Boxes className="text-blue-400 w-7 h-7" />,
    color: 'text-blue-400',
    borderColor: 'border-blue-200',
    leftLabel: 'Total ASIN',
    rightLabel: 'Total Quantity',
    key: 'total',
  },
  {
    label: 'Excess Inventory',
    icon: <TrendingUp className="text-purple-400 w-7 h-7" />,
    color: 'text-purple-400',
    borderColor: 'border-purple-200',
    leftLabel: 'Total ASIN',
    rightLabel: 'Total Quantity',
    key: 'excess',
  },
  {
    label: 'Liquidation',
    icon: <Droplet className="text-red-400 w-7 h-7" />,
    color: 'text-red-400',
    borderColor: 'border-red-200',
    leftLabel: 'Total ASIN',
    rightLabel: 'Total Quantity',
    key: 'liquidation',
  },
]

const InventoryStats = () => {
  const [stats, setStats] = useState({
    total: { totalASIN: 0, totalQuantity: 0 },
    excess: { totalASIN: 0, totalQuantity: 0 },
    liquidation: { totalASIN: 0, totalQuantity: 0 },
  })

  useEffect(() => {
    Promise.all([
      fetch('/dataset/ASIN_Liquidation_Report_Liquidation.json').then(res => res.json()),
      fetch('/dataset/ASIN_Liquidation_Report_Liquidation_excess.json').then(res => res.json()),
    ]).then(([liquidation, excess]) => {
      // Total Inventory: both datasets combined
      const totalCombined = [...liquidation, ...excess]
      const totalASINSet = new Set<string>()
      let totalQuantity = 0
      totalCombined.forEach((item: any) => {
        if (item.asin) totalASINSet.add(item.asin)
        totalQuantity += item.FBA_Inv || 0
      })
      // Excess Inventory: only excess
      const excessASINSet = new Set<string>()
      let excessQuantity = 0
      excess.forEach((item: any) => {
        if (item.asin) excessASINSet.add(item.asin)
        excessQuantity += item.FBA_Inv || 0
      })
      // Liquidation: only liquidation
      const liquidationASINSet = new Set<string>()
      let liquidationQuantity = 0
      liquidation.forEach((item: any) => {
        if (item.asin) liquidationASINSet.add(item.asin)
        liquidationQuantity += item.FBA_Inv || 0
      })
      setStats({
        total: { totalASIN: totalASINSet.size, totalQuantity },
        excess: { totalASIN: excessASINSet.size, totalQuantity: excessQuantity },
        liquidation: { totalASIN: liquidationASINSet.size, totalQuantity: liquidationQuantity },
      })
    })
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {statCardsConfig.map((card, idx) => (
        <div
          key={idx}
          className={`bg-gray-50 border ${card.borderColor} rounded-lg p-4 flex flex-col shadow-sm`}
        >
          <div className="flex flex-col items-center bg-gray-100 rounded-md py-2 mb-4">
            <div className="flex items-center gap-2">
              {card.icon}
              <span className="font-semibold text-gray-700 text-lg">{card.label}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl font-bold text-gray-900">{stats[card.key as keyof typeof stats].totalASIN.toLocaleString()}</span>
              <span className="text-gray-500 text-sm mt-1">{card.leftLabel}</span>
            </div>
            <div className="border-l h-8 mx-4" />
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl font-bold text-gray-900">{stats[card.key as keyof typeof stats].totalQuantity.toLocaleString()}</span>
              <span className="text-gray-500 text-sm mt-1">{card.rightLabel}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default InventoryStats

