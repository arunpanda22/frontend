import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { MetricsCardProps } from "../types";

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  bgColor = "blue",
  className = "",
}) => {
  // Color mappings for consistent styling
  const colorClasses = {
    blue: {
      iconBg: "bg-blue-500/10",
      iconText: "text-blue-500",
      hover: "hover:border-blue-500",
      expandBg: "bg-blue-500/10",
    },
    green: {
      iconBg: "bg-green-500/10",
      iconText: "text-green-500",
      hover: "hover:border-green-500",
      expandBg: "bg-green-500/10",
    },
    purple: {
      iconBg: "bg-purple-500/10",
      iconText: "text-purple-500",
      hover: "hover:border-purple-500",
      expandBg: "bg-purple-500/10",
    },
    orange: {
      iconBg: "bg-orange-500/10",
      iconText: "text-orange-500",
      hover: "hover:border-orange-500",
      expandBg: "bg-orange-500/10",
    },
    red: {
      iconBg: "bg-red-500/10",
      iconText: "text-red-500",
      hover: "hover:border-red-500",
      expandBg: "bg-red-500/10",
    },
    indigo: {
      iconBg: "bg-indigo-500/10",
      iconText: "text-indigo-500",
      hover: "hover:border-indigo-500",
      expandBg: "bg-indigo-500/10",
    },
    pink: {
      iconBg: "bg-pink-500/10",
      iconText: "text-pink-500",
      hover: "hover:border-pink-500",
      expandBg: "bg-pink-500/10",
    },
    yellow: {
      iconBg: "bg-yellow-500/10",
      iconText: "text-yellow-500",
      hover: "hover:border-yellow-500",
      expandBg: "bg-yellow-500/10",
    },
  };

  const colors = colorClasses[bgColor];

  return (
    <div
      className={`relative overflow-hidden transition-all duration-500 card group/item hover:-translate-y-1 hover:shadow-2xl ${colors.hover} hover:border-opacity-30 ${colors.expandBg} rounded-lg border border-gray-200 shadow-sm ${className}`}
    >
      <div className="card-body p-4">
        <div className="relative z-10">
          {/* Top row: title + value + icon */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                {title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>

            {/* Icon on the right */}
            <div
              className={`grid place-items-center size-12 rounded-full bg-white transition-all duration-500 p-2`}
            >
              <Icon className={`size-6 ${colors.iconText}`} />
            </div>
          </div>

          {/* Change indicator below - Only render if change and changeType are provided */}
          {change && changeType && (
            <div
              className={`flex items-center text-sm mt-4 ${
                changeType === "increase" ? "text-green-600" : "text-red-600"
              }`}
            >
              {changeType === "increase" ? (
                <TrendingUp className="size-4 mr-1" />
              ) : (
                <TrendingDown className="size-4 mr-1" />
              )}
              <span className="font-medium">{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;