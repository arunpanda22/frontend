"use client";

type RevenueData = {
  revenue: number
  seller_revenue?: number | null
  vendor_revenue?: number | null
}

type RevenueCardProps = {
  label: string
  data?: RevenueData
  color: "blue" | "purple" | "pink"
  showVendor: boolean
  formatRevenue: (value: number) => string
}

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-500",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-500",
  },
}

export function RevenueCard({
  label,
  data,
  color,
  showVendor,
  formatRevenue,
}: RevenueCardProps) {
  const colors = COLOR_MAP[color]

  const hasSplitData =
    showVendor &&
    data?.seller_revenue != null &&
    data?.vendor_revenue != null

  return (
    <div className={`text-center p-3 rounded-lg ${colors.bg}`}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>

      {data ? (
        <>
          <p className={`text-xl font-bold ${colors.text}`}>
            {formatRevenue(data.revenue)}
          </p>

          {hasSplitData && (
            <div className="flex items-center justify-center gap-3 mt-1 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                {/* <div className="w-2 h-2 rounded-full bg-blue-400" /> */}
                <span>Seller: {formatRevenue(data.seller_revenue!)}</span>
              </div>
              <div className="flex items-center gap-1">
                {/* <div className="w-2 h-2 rounded-full bg-purple-400" /> */}
                <span>Vendor: {formatRevenue(data.vendor_revenue!)}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">—</p>
      )}
    </div>
  )
}
