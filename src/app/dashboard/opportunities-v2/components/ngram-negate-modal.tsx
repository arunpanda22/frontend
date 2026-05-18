"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api/config";

interface NegateRow {
  campaign_id: string;
  ad_group_id: string;
  search_term: string;
  campaign_name?: string;
}

interface NgramNegateModalProps {
  keyword: string;
  asin: string;
  onClose: () => void;
}

type PushStatus = "idle" | "loading" | "success" | "error";

export const NgramNegateModal: React.FC<NgramNegateModalProps> = ({
  keyword,
  asin,
  onClose,
}) => {
  const [rows, setRows] = useState<NegateRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [pushResult, setPushResult] = useState<{
    successful: number;
    failed: number;
    duplicates: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Load campaigns containing this ASIN on mount
  React.useEffect(() => {
    const load = async () => {
      setLoadStatus("loading");
      try {
        // Fetch campaigns for this ASIN from the search term report data
        const { data } = await apiClient.get(
          "/api/v1/dashboard-api/ngram-negate-campaigns/",
          { params: { asin, search_term: keyword } }
        );
        setRows(data.rows ?? []);
        setLoadStatus("loaded");
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to load campaigns");
        setLoadStatus("error");
      }
    };
    load();
  }, [asin, keyword]);

  const handleNegate = async () => {
    if (!rows.length) return;
    setPushStatus("loading");
    try {
      const { data } = await apiClient.post(
        "/api/v1/optimizer/push/optimizations/",
        {
          category: "sp_negatives",
          data: rows.map((r) => ({
            campaign_id: r.campaign_id,
            ad_group_id: r.ad_group_id,
            search_term: keyword,
          })),
        }
      );
      const result = data?.results?.sp_negation;
      setPushResult({
        successful: result?.successful ?? 0,
        failed: result?.failed ?? 0,
        duplicates: result?.duplicates ?? 0,
      });
      setPushStatus("success");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Push failed");
      setPushStatus("error");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-100">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">
                Negate Search Term
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Adding{" "}
                <span className="font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                  {keyword}
                </span>{" "}
                as a negative exact across campaigns for{" "}
                <span className="font-mono text-gray-500">{asin}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex-1 overflow-y-auto max-h-72">
            {loadStatus === "loading" && (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns…
              </div>
            )}
            {loadStatus === "error" && (
              <p className="text-sm text-red-400">Error: {errorMsg}</p>
            )}
            {loadStatus === "loaded" && rows.length === 0 && (
              <p className="text-sm text-gray-400">
                No active campaigns found for ASIN {asin}.
              </p>
            )}
            {loadStatus === "loaded" && rows.length > 0 && (
              <>
                <p className="text-[11px] text-gray-500 mb-3">
                  This term will be negated from{" "}
                  <span className="font-semibold text-gray-700">{rows.length}</span>{" "}
                  campaign{rows.length !== 1 ? "s" : ""}:
                </p>
                <ul className="space-y-1">
                  {rows.map((r, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-mono truncate"
                      title={r.campaign_name}
                    >
                      {r.campaign_name ?? r.campaign_id}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Push result */}
            {pushStatus === "success" && pushResult && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[12px]">
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Negation pushed successfully
                </div>
                <div className="text-emerald-600">
                  {pushResult.successful} pushed · {pushResult.duplicates} already existed · {pushResult.failed} failed
                </div>
              </div>
            )}
            {pushStatus === "error" && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[12px]">
                <div className="flex items-center gap-1.5 text-red-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" /> {errorMsg}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {pushStatus === "success" ? "Close" : "Cancel"}
            </button>
            {pushStatus !== "success" && (
              <button
                onClick={handleNegate}
                disabled={
                  loadStatus !== "loaded" ||
                  rows.length === 0 ||
                  pushStatus === "loading"
                }
                className="text-[12px] px-3 py-1.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {pushStatus === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
                Negate in {rows.length} campaign{rows.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};