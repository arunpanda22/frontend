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
        setShowIcon(width >= 200); // w-60 is 240px
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
                <p className="text-xl font-semibold text-gray-900 mt-1 font-montserrat">
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
