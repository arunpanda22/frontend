"use client";

import React from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
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
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertCircle className="w-12 h-12 text-red-600" />,
      iconBg: "bg-red-100",
      confirmButton: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: <AlertCircle className="w-12 h-12 text-orange-600" />,
      iconBg: "bg-orange-100",
      confirmButton: "bg-orange-600 hover:bg-orange-700",
    },
    info: {
      icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
      iconBg: "bg-blue-100",
      confirmButton: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const styles = variantStyles[variant];

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-0"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {styles.icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2.5 ${styles.confirmButton} text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isProcessing && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isProcessing ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}