import React from "react";
import { FaBoxOpen, FaCubes, FaRupeeSign, FaPercent } from "react-icons/fa";

interface StatCardsProps {
  totalAsins: number | string;
  totalQuantity: number | string;
  totalSales: number | string;
  avgBuyBox: number | string;
}

const stats = [
  {
    label: "Total ASINs",
    icon: <FaBoxOpen className="text-blue-500 text-2xl mb-1" />,
    key: "totalAsins",
  },
  {
    label: "Total Quantity",
    icon: <FaCubes className="text-blue-500 text-2xl mb-1" />,
    key: "totalQuantity",
  },
  {
    label: "Total Sales",
    icon: <FaRupeeSign className="text-blue-500 text-2xl mb-1" />,
    key: "totalSales",
  },
  {
    label: "Avg. BuyBox",
    icon: <FaPercent className="text-blue-500 text-2xl mb-1" />,
    key: "avgBuyBox",
  },
];

export default function StatCards({
  totalAsins,
  totalQuantity,
  totalSales,
  avgBuyBox,
}: StatCardsProps) {
  const values = { totalAsins, totalQuantity, totalSales, avgBuyBox };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className="rounded-2xl bg-white/70 backdrop-blur-md shadow-xl shadow-blue-100 border border-blue-100 flex flex-col items-center justify-center p-6 min-w-[150px]"
        >
          {stat.icon}
          <div className="text-2xl font-extrabold text-[#1a2b3c]">
            {values[stat.key as keyof typeof values]}
          </div>
          <div className="text-[#64748b] font-medium mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}