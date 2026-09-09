"use client";

import React from "react";
import { AlertCircle, CheckCircle, X, TestTube, Send } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dryrun: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  showDryRun?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  showDryRun = true,
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingType, setProcessingType] = React.useState<"push" | "dryrun" | null>(null);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertCircle className="w-12 h-12 text-red-600" />,
      iconBg: "bg-red-100",
      confirmButton: "bg-red-600 hover:bg-red-700",
      border: "border-red-300",
    },
    warning: {
      icon: <AlertCircle className="w-12 h-12 text-orange-600" />,
      iconBg: "bg-orange-100",
      confirmButton: "bg-orange-600 hover:bg-orange-700",
      border: "border-orange-300",
    },
    info: {
      icon: <CheckCircle className="w-12 h-12 text-powder-blue-700" />,
      iconBg: "bg-powder-blue-100",
      confirmButton: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      border: "border-powder-blue-300",
    },
  };

  const styles = variantStyles[variant];

  const handleConfirm = async (dryrun: boolean) => {
    setIsProcessing(true);
    setProcessingType(dryrun ? "dryrun" : "push");
    try {
      await onConfirm(dryrun);
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-0"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 bg-gradient-to-b from-powder-blue-50 to-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 border-powder-blue-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-powder-blue-600 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${styles.border}`}>
            {styles.icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center mb-4">
            {message}
          </p>

          {/* Dry Run Info Box */}
          {showDryRun && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <TestTube className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Dry Run Mode</p>
                  <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                    Test the push without applying changes to your account. Perfect for presentations and validation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {/* Cancel Button */}
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 bg-white hover:bg-powder-blue-50 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-powder-blue-300"
            >
              {cancelText}
            </button>

            {/* Dry Run Button */}
            {showDryRun && (
              <button
                onClick={() => handleConfirm(true)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing && processingType === "dryrun" && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isProcessing && processingType === "dryrun" ? (
                  "Testing..."
                ) : (
                  <>
                    <TestTube className="w-4 h-4" />
                    Dry Run
                  </>
                )}
              </button>
            )}

            {/* Confirm/Push Button */}
            <button
              onClick={() => handleConfirm(false)}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2.5 ${styles.confirmButton} text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isProcessing && processingType === "push" && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isProcessing && processingType === "push" ? (
                "Processing..."
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
