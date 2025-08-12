import { FaEllipsisH } from "react-icons/fa";

const stats = [
  {
    label: "Delivered",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    value: "17.9%",
  },
  {
    label: "Clicked",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    value: "54.6%",
  },
  {
    label: "Opened",
    color: "bg-gray-100 text-gray-700",
    dot: "bg-gray-500",
    value: "47.3%",
  },
  {
    label: "Converted",
    color: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
    value: "11.8%",
  },
];

export default function CampaignSummaryCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 w-full max-w-xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <h2 className="font-bold text-lg">On Boarding Campaign</h2>
        <FaEllipsisH className="text-gray-400" />
      </div>
      <div className="bg-purple-100 text-purple-700 rounded-lg p-3 mb-4 text-sm">
        Help new customers appreciate the value they'll receive from your admin.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
          >
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${stat.color} mb-1 w-fit`}
            >
              <span className={`w-2 h-2 rounded-full mr-1 ${stat.dot}`}></span>
              {stat.label}
            </span>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-gray-500">Last week</div>
          </div>
        ))}
      </div>
    </div>
  );
} 