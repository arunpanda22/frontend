import { useEffect, useState } from "react";

export default function InventoryStats() {
  const [stats, setStats] = useState({
    totalInventory: 0,
    totalReorder: 0,
    excessInventory: 0,
    liquidationInventory: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch inventory health
        const res1 = await fetch("/dataset/ inventory_health_30d_avg.json");
        const data1 = await res1.json();
        const totalInventory = data1.reduce(
          (sum: number, item: { reserved_quantity?: number; fulfillable_quantity?: number }) =>
            sum + (item.reserved_quantity || 0) + (item.fulfillable_quantity || 0),
          0
        );
        const totalReorder = data1.reduce(
          (sum: number, item: { reorder_quantity?: number }) => sum + (item.reorder_quantity || 0),
          0
        );
        // Fetch excess inventory
        const res2 = await fetch("/dataset/ ASIN_Liquidation_Report_Liquidation_excess.json");
        const data2 = await res2.json();
        const excessInventory = data2.reduce(
          (sum: number, item: { INV_90_365?: number }) => sum + (item.INV_90_365 || 0),
          0
        );
        // Fetch liquidation inventory
        const res3 = await fetch("/dataset/ ASIN_Liquidation_Report_Liquidation.json");
        const data3 = await res3.json();
        const liquidationInventory = data3.reduce(
          (sum: number, item: { INV_90_365?: number }) => sum + (item.INV_90_365 || 0),
          0
        );
        setStats({
          totalInventory,
          totalReorder,
          excessInventory,
          liquidationInventory,
        });
      } catch (e) {
        setStats({
          totalInventory: 0,
          totalReorder: 0,
          excessInventory: 0,
          liquidationInventory: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] shadow-lg transition duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200">
        <span className="text-green-600 text-3xl mb-2">📊</span>
        <div className="text-3xl font-extrabold text-[#1a2b3c]">{stats.totalInventory.toLocaleString()}</div>
        <div className="text-[#64748b] font-medium mt-1">Total Inventory</div>
      </div>
      <div className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] shadow-lg transition duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200">
        <span className="text-red-500 text-3xl mb-2">🔄</span>
        <div className="text-3xl font-extrabold text-[#1a2b3c]">{stats.totalReorder.toLocaleString()}</div>
        <div className="text-[#64748b] font-medium mt-1">Total Reorder Qty</div>
      </div>
      <div className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] shadow-lg transition duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200">
        <span className="text-blue-500 text-3xl mb-2">📦</span>
        <div className="text-3xl font-extrabold text-[#1a2b3c]">{stats.excessInventory.toLocaleString()}</div>
        <div className="text-[#64748b] font-medium mt-1">Excess Inventory (INV 90-365)</div>
      </div>
      <div className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] shadow-lg transition duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200">
        <span className="text-purple-500 text-3xl mb-2">💧</span>
        <div className="text-3xl font-extrabold text-[#1a2b3c]">{stats.liquidationInventory.toLocaleString()}</div>
        <div className="text-[#64748b] font-medium mt-1">Liquidation Inventory (INV 90-365)</div>
      </div>
    </div>
  );
}
