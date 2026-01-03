import React, { useRef, useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  TrendingUpIcon,
  X,
  Info,
} from "lucide-react";
import { MetricsCardProps } from "../types";
import TrendsChart from "@/app/dashboard/command-center/components/TrendsChart";

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  bgColor,
  color,
  className = "",
  showTrendButton = false,
  onViewTrends,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showIcon, setShowIcon] = useState(true);
  const [showTrendModal, setShowTrendModal] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        setShowIcon(width >= 240); // w-60 is 240px
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleViewTrends = () => {
    setShowTrendModal(true);
    if (onViewTrends) {
      onViewTrends();
    }
  };

  const handleCloseTrendModal = () => {
    setShowTrendModal(false);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showTrendModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showTrendModal]);

  // Color mappings for consistent styling
  // const colorClasses = {
  //   blue: {
  //     iconBg: "bg-blue-500/10",
  //     iconText: "text-blue-500",
  //     hover: "hover:border-blue-500",
  //     expandBg: "bg-blue-500/10",
  //     buttonBg: "bg-blue-500",
  //     buttonHover: "hover:bg-blue-600",
  //   },
  //   green: {
  //     iconBg: "bg-green-500/10",
  //     iconText: "text-green-500",
  //     hover: "hover:border-green-500",
  //     expandBg: "bg-green-500/10",
  //     buttonBg: "bg-green-500",
  //     buttonHover: "hover:bg-green-600",
  //   },
  //   purple: {
  //     iconBg: "bg-purple-500/10",
  //     iconText: "text-purple-500",
  //     hover: "hover:border-purple-500",
  //     expandBg: "bg-purple-500/10",
  //     buttonBg: "bg-purple-500",
  //     buttonHover: "hover:bg-purple-600",
  //   },
  //   orange: {
  //     iconBg: "bg-orange-500/10",
  //     iconText: "text-orange-500",
  //     hover: "hover:border-orange-500",
  //     expandBg: "bg-orange-500/10",
  //     buttonBg: "bg-orange-500",
  //     buttonHover: "hover:bg-orange-600",
  //   },
  //   red: {
  //     iconBg: "bg-red-500/10",
  //     iconText: "text-red-500",
  //     hover: "hover:border-red-500",
  //     expandBg: "bg-red-500/10",
  //     buttonBg: "bg-red-500",
  //     buttonHover: "hover:bg-red-600",
  //   },
  //   indigo: {
  //     iconBg: "bg-indigo-500/10",
  //     iconText: "text-indigo-500",
  //     hover: "hover:border-indigo-500",
  //     expandBg: "bg-indigo-500/10",
  //     buttonBg: "bg-indigo-500",
  //     buttonHover: "hover:bg-indigo-600",
  //   },
  //   pink: {
  //     iconBg: "bg-pink-500/10",
  //     iconText: "text-pink-500",
  //     hover: "hover:border-pink-500",
  //     expandBg: "bg-pink-500/10",
  //     buttonBg: "bg-pink-500",
  //     buttonHover: "hover:bg-pink-600",
  //   },
  //   yellow: {
  //     iconBg: "bg-yellow-500/10",
  //     iconText: "text-yellow-500",
  //     hover: "hover:border-yellow-500",
  //     expandBg: "bg-yellow-500/10",
  //     buttonBg: "bg-yellow-500",
  //     buttonHover: "hover:bg-yellow-600",
  //   },
  // };

  // const colors = colorClasses[bgColor];

  return (
    <>
      <div
        ref={cardRef}
        className={`relative overflow-hidden min-w-44 transition-all duration-500 card group/item hover:-translate-y-1 hover:shadow-2xl ${bgColor} rounded-lg border border-gray-200 shadow-sm ${className}`}
      >
        <div className="card-body p-4">
          <div className="relative z-10">
            {/* Top row: title + value + icon */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide font-montserrat">
                  {title}
                </h3>
                <p className="text-2xl font-semibold text-gray-900 mt-1 font-montserrat">
                  {value}
                </p>
                {(change && changeType) || showTrendButton ? (
                  <div className="flex items-center justify-between mt-4 gap-2">
                    {/* Change indicator */}

                    {showTrendButton && (
                      <div className="relative group">
                        <span
                          onClick={handleViewTrends}
                          className="px-2 py-1 bg-ocean-600 border  text-white hover:bg-powder-blue-800 text-xs font-semibold rounded-full flex items-center gap-1 font-montserrat"
                        >
                          <TrendingUpIcon className="w-3 h-3" />
                          View trends
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Icon on the right - conditionally rendered based on card width */}
              {showIcon && (
                <div
                  className={`grid place-items-center rounded-full size-12  ${color} transition-all duration-500 p-3 shadow-icon`}
                >
                  <Icon className={`size-6 text-white`} />
                </div>
              )}
            </div>

            {/* Change indicator and trend button */}
            {change && changeType ? (
              <div className="flex items-center justify-between mt-4 gap-2">
                {/* Change indicator */}
                {change && changeType && (
                  <div
                    className={`flex items-center text-sm ${
                      changeType === "increase"
                        ? "text-green-600"
                        : "text-red-600"
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
            ) : null}
          </div>
        </div>
      </div>

      {/* Trend Modal */}
      {showTrendModal && (
        <div
          className="fixed top-16 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseTrendModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[80vw] h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}

            {/* Modal Content */}
            <div className="p-0">
              <TrendsChart />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MetricsCard;
