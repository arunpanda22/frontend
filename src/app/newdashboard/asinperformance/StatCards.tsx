import React from "react";

interface StatCard {
  label: string;
  percentChange: number;
  isPositive: boolean;
  icon: React.ReactNode;
  value: string | number;
  color: string; // e.g. 'green', 'blue', etc.
}

interface StatCardsProps {
  stats: StatCard[];
}

export default function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className="relative rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between p-6 min-w-[180px] h-[200px] overflow-hidden group transition hover:shadow-md"
        >
          {/* Radial SVG background */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              {[...Array(36)].map((_, i) => (
                <line
                  key={i}
                  x1="150"
                  y1="150"
                  x2={150 + 140 * Math.cos((i * 10 * Math.PI) / 180)}
                  y2={150 + 140 * Math.sin((i * 10 * Math.PI) / 180)}
                  stroke="#22c55e"
                  strokeWidth="0.7"
                />
              ))}
            </g>
          </svg>
          {/* Label */}
          <div className="text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase z-10">
            {stat.label}
          </div>
          {/* Center: Percent Change */}
          <div className="flex flex-col items-center justify-center flex-1 z-10">
            <span className={`text-3xl font-bold flex items-center gap-1 ${stat.isPositive ? 'text-green-500' : stat.color === 'blue' ? 'text-blue-500' : 'text-red-500'}`}>
              {stat.isPositive ? (
                <svg className="w-6 h-6 inline-block" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" /></svg>
              ) : (
                <svg className="w-6 h-6 inline-block" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-6-6m6 6l6-6" /></svg>
              )}
              {stat.percentChange > 0 ? '+' : ''}{stat.percentChange}%
            </span>
          </div>
          {/* Bottom: Icon and Value */}
          <div className="absolute left-4 bottom-4 flex items-center gap-2 text-base font-semibold z-10">
            <span className={`text-xl ${stat.color === 'green' ? 'text-green-500' : stat.color === 'blue' ? 'text-blue-500' : 'text-gray-400'}`}>{stat.icon}</span>
            <span className={`font-medium ${stat.color === 'green' ? 'text-green-600' : stat.color === 'blue' ? 'text-blue-600' : 'text-gray-600'}`}>{stat.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}