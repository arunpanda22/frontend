import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Eye } from "lucide-react";

export interface PushResultData {
  push_id: string;
  total_items: number;
  successful: number;
  failed: number;
  duplicates?: number;
  errors?: number;
  success_rate: string;
  timestamp: string;
  details?: {
    successful_items: any[];
    failed_items: any[];
    duplicate_items?: any[];
    error_items?: any[];
  };
}

interface PushResultSummaryProps {
  result: PushResultData;
  onViewDetails?: () => void;
  compact?: boolean;
}

export const PushResultSummary: React.FC<PushResultSummaryProps> = ({
  result,
  onViewDetails,
  compact = false,
}) => {
  const hasFailures = result.failed > 0;
  const isCompleteSuccess = result.successful === result.total_items;
  const isCompleteFailure = result.successful === 0;

  // Determine status and styling
  const getStatusConfig = () => {
    if (isCompleteSuccess) {
      return {
        color: "green",
        icon: CheckCircle2,
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-700",
        iconColor: "text-green-600",
        label: "Complete Success",
      };
    } else if (isCompleteFailure) {
      return {
        color: "red",
        icon: XCircle,
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        iconColor: "text-red-600",
        label: "Complete Failure",
      };
    } else {
      return {
        color: "yellow",
        icon: AlertTriangle,
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
        iconColor: "text-yellow-600",
        label: "Partial Success",
      };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${status.textColor}`}>
        <StatusIcon className="w-4 h-4" />
        <span className="text-sm font-medium">
          {result.successful}/{result.total_items}
        </span>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-xs underline hover:no-underline"
          >
            View details
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${status.bgColor} ${status.borderColor} border-2 rounded-lg p-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${status.iconColor}`} />
          <span className={`font-semibold text-sm ${status.textColor}`}>
            {status.label}
          </span>
        </div>
        <span className="text-xs text-gray-600">
          {formatTimestamp(result.timestamp)}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-md p-2 border border-gray-200">
          <div className="text-xs text-gray-600">Total Items</div>
          <div className="text-lg font-bold text-gray-900">
            {result.total_items}
          </div>
        </div>

        <div className="bg-white rounded-md p-2 border border-gray-200">
          <div className="text-xs text-gray-600">Success Rate</div>
          <div className="text-lg font-bold text-gray-900">
            {result.success_rate}
          </div>
        </div>

        <div className="bg-white rounded-md p-2 border border-green-200">
          <div className="text-xs text-green-700">Successful</div>
          <div className="text-lg font-bold text-green-700">
            {result.successful}
          </div>
        </div>

        <div className="bg-white rounded-md p-2 border border-red-200">
          <div className="text-xs text-red-700">Failed</div>
          <div className="text-lg font-bold text-red-700">{result.failed}</div>
        </div>

        {/* Optional: Show duplicates and errors separately if available */}
        {result.duplicates !== undefined && result.duplicates > 0 && (
          <div className="bg-white rounded-md p-2 border border-orange-200">
            <div className="text-xs text-orange-700">Duplicates</div>
            <div className="text-lg font-bold text-orange-700">
              {result.duplicates}
            </div>
          </div>
        )}

        {result.errors !== undefined && result.errors > 0 && (
          <div className="bg-white rounded-md p-2 border border-red-200">
            <div className="text-xs text-red-700">Errors</div>
            <div className="text-lg font-bold text-red-700">
              {result.errors}
            </div>
          </div>
        )}
      </div>

      {/* View All Details Button */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 ${status.bgColor} ${status.borderColor} border-2 ${status.textColor} hover:bg-opacity-80 rounded-md text-sm font-medium transition-colors`}
        >
          <Eye className="w-4 h-4" />
          View All Details
        </button>
      )}
    </div>
  );
};