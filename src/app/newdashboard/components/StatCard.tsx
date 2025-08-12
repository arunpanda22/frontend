import React from "react";

export default function StatCard() {
  return (
    <div className="bg-white rounded-xl shadow p-6 h-full flex flex-col justify-between">
      <div className="flex items-start gap-4">
        {/* Yellow bar */}
        <div className="w-4 h-8 bg-yellow-400 rounded-sm mt-1" />
        <div>
          <div className="text-gray-700 text-lg font-medium">Total Revenue</div>
          <div className="text-black text-3xl font-extrabold leading-tight">$4000k</div>
          <div className="text-gray-500 text-lg">$3000K</div>
        </div>
      </div>
      {/* Simple yellow line chart */}
      <div className="mt-4 flex justify-end">
        <svg width="100" height="40" viewBox="0 0 100 40">
          <polyline
            fill="none"
            stroke="#FFD600"
            strokeWidth="4"
            points="0,30 20,15 40,25 60,10 80,25 100,5"
          />
        </svg>
      </div>
    </div>
  );
} 