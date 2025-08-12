import React, { useEffect, useState } from "react";
import { FaUserFriends, FaFeather, FaShoppingCart, FaHeart, FaDollarSign, FaCoins, FaRedo, FaChartLine, FaEllipsisH, FaPercent } from "react-icons/fa";

function TrendBadge({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
      {positive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      )}
      {value}
    </span>
  );
}

function StatCard({ icon, label, value, trend, trendPositive }: { icon: any; label: string; value: string | number; trend?: string; trendPositive?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between min-w-[160px] sm:min-w-[220px] relative shadow-sm w-full">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          {icon}
          <span className="text-xs sm:text-sm">{label}</span>
        </div>
        <FaEllipsisH className="text-gray-300 text-lg" />
      </div>
      <div className="flex flex-col items-start gap-2 mt-2">
        <span className="text-xl sm:text-2xl font-bold text-gray-900">{value}</span>
        {trend && typeof trendPositive === "boolean" && <TrendBadge value={trend} positive={trendPositive} />}
      </div>
    </div>
  );
}

export default function StatCardGrid() {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    fetch('/add_sales.json')
      .then(res => res.json())
      .then(data => {
        const ads = data.ads_performance.find((d: any) => d.Period === 'Current') || {};
        const sales = data.sales_metrics.find((d: any) => d.Period === 'Current') || {};
        setCards([
          { icon: <FaFeather />, label: 'Impressions', value: Number(ads.Impressions || 0).toLocaleString() },
          { icon: <FaUserFriends />, label: 'Clicks', value: Number(ads.Clicks || 0).toLocaleString() },
          { icon: <FaDollarSign />, label: 'Ad Cost', value: `$${ads["Ad Cost"] || 0}` },
          { icon: <FaCoins />, label: 'Ads Sales', value: `$${ads["Ads Sales"] || 0}` },
          { icon: <FaShoppingCart />, label: 'Ads Quantity', value: Number(ads["Ads Quantity"] || 0).toLocaleString() },
          { icon: <FaPercent />, label: 'ACOS%', value: ads["ACOS%"] || '0%' },
          { icon: <FaPercent />, label: 'CTR%', value: ads["CTR%"] || '0%' },
          { icon: <FaDollarSign />, label: 'Total Sales', value: `$${sales["Total Sales"] || 0}` },
         
        ]);
      });
  }, []);

  if (!cards.length) return <div className="w-full text-center py-8">Loading...</div>;

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}
