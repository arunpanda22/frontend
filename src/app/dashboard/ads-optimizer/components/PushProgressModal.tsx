"use client";

/**
 * PushProgressModal
 * ============================================================================
 * Location: src/app/dashboard/ads-optimizer/components/PushProgressModal.tsx
 *           (next to ConfirmationDialog / FailedItemsModal)
 *
 * PURPOSE
 *   Blocking, non-dismissible modal shown while optimizations are pushed in
 *   batches. Pure presentational component: it owns no state and makes no API
 *   calls. It renders whatever `progress` object it is given.
 *
 * USAGE
 *   const { pushCategory, pushAll, progress } = usePushOptimizations();
 *   ...
 *   <PushProgressModal progress={progress} />
 *
 *   `progress` is `null` when idle (modal renders nothing) and a PushProgress
 *   object while a push is running (see usePushOptimizations.ts).
 *
 * DESIGN NOTES
 *   - No close button on purpose: closing the modal would not cancel the
 *     in-flight requests, so hiding it would mislead the user.
 *   - z-[100] so it sits above OptimizationTableDrawer and the toaster overlay.
 * ============================================================================
 */

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { PushProgress } from "@/lib/hooks/usePushOptimizations";

interface PushProgressModalProps {
  /** Current progress, or null when no push is running. */
  progress: PushProgress | null;
}

export function PushProgressModal({ progress }: PushProgressModalProps) {
  if (!progress) return null;

  const {
    label, dryrun, currentBatch, totalBatches,
    failedBatches, itemsProcessed, itemsTotal,
  } = progress;

  const percent = itemsTotal > 0 ? Math.round((itemsProcessed / itemsTotal) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Push progress"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-1">
          <Loader2 className="w-5 h-5 text-powder-blue-600 animate-spin" />
          <h3 className="text-lg font-bold text-gray-900">
            {dryrun ? "Testing push (dry run)" : "Pushing optimizations"}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-6 break-words">{label}</p>

        <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
          <span>Batch {currentBatch} of {totalBatches}</span>
          <span className="font-semibold">{percent}%</span>
        </div>

        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-powder-blue-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {itemsProcessed.toLocaleString()} of {itemsTotal.toLocaleString()} items processed
        </p>

        {failedBatches > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              {failedBatches} batch{failedBatches !== 1 ? "es" : ""} failed so far. The remaining
              batches will still be sent; failed items will be listed in the results.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 text-center">
          Please keep this tab open until the push finishes.
        </p>
      </div>
    </div>
  );
}