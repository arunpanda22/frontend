"use client";

import React, { useState, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { useKeywordCluster, KeywordClusterRecord } from "@/lib/hooks/use-opportunities";
import { TargetCampaignModal, type TargetKWRow } from "./target-campaign-modal";
import { KeywordRecommendation } from "@/lib/hooks/use-opportunities";

interface NgramVariantsModalProps {
  keyword: string;
  asin: string;
  onClose: () => void;
}

const TH: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap">
    {children}
  </th>
);

const TD: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <td className={`px-3 py-2 text-[12px] text-gray-700 border-b border-gray-50 ${className}`}>
    {children}
  </td>
);

const Checkbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, indeterminate = false, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-3.5 h-3.5 rounded border-gray-300 accent-[#f5a623] cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export const NgramVariantsModal: React.FC<NgramVariantsModalProps> = ({
  keyword,
  asin,
  onClose,
}) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [campaignModal, setCampaignModal] = useState<TargetKWRow[] | null>(null);

  const wordCount = keyword.trim().split(/\s+/).length;
  const clusterQuery = useKeywordCluster({
    words: keyword.trim(),        // trim like the drawer does
    match_mode: wordCount === 1 ? "any" : "all",
    limit: 1000,                  // match the drawer's default
    });

  React.useEffect(() => {
    clusterQuery.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const records: KeywordClusterRecord[] = clusterQuery.data?.data ?? [];

  // Deduplicate by search_term
  const uniqueRecords = React.useMemo(() => {
    const seen = new Set<string>();
    return records.filter((r) => {
      if (seen.has(r.search_term)) return false;
      seen.add(r.search_term);
      return true;
    });
  }, [records]);

  const toggleRow = useCallback((i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const handleSelectAll = (checked: boolean) =>
    setSelected(checked ? new Set(uniqueRecords.map((_, i) => i)) : new Set());

  // Build synthetic KeywordRecommendation rows for TargetCampaignModal
  const buildKWRows = (indices: number[]): TargetKWRow[] =>
    indices.map((i) => ({
      index: i,
      keyword: {
        keyword: uniqueRecords[i].search_term,
        matchType: "EXACT",
        bid: 0,
        rank: uniqueRecords[i].search_frequency_rank,
        suggestedBid_rangeStart: 0,
        suggestedBid_rangeMedian: 0,
        suggestedBid_rangeEnd: 0,
        asin,
        region: "",
        valid_data_count: 0,
        average_rank: 0,
        average_bid_lower_range: 0,
        average_bid_higher_range: 0,
        average_suggested_bid: 0,
      } as KeywordRecommendation,
    }));

  const openCampaignModal = () => {
    if (!selected.size) return;
    setCampaignModal(buildKWRows([...selected]));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-100">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">
                Keyword Variants
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Showing search terms related to{" "}
                <span className="font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                  {keyword}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {clusterQuery.isLoading && (
              <div className="py-12 flex items-center justify-center gap-2 text-gray-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading variants…
              </div>
            )}

            {clusterQuery.error && (
              <div className="py-12 text-center text-sm text-red-400">
                Error: {clusterQuery.error.message}
              </div>
            )}

            {!clusterQuery.isLoading && !clusterQuery.error && uniqueRecords.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                No variants found for this keyword
              </div>
            )}

            {!clusterQuery.isLoading && uniqueRecords.length > 0 && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <TH>
                      <Checkbox
                        checked={selected.size === uniqueRecords.length && uniqueRecords.length > 0}
                        indeterminate={selected.size > 0 && selected.size < uniqueRecords.length}
                        onChange={handleSelectAll}
                      />
                    </TH>
                    <TH>Search term</TH>
                    <TH>SFR</TH>
                    <TH>Click share</TH>
                    <TH>Conv. share</TH>
                    <TH>Department</TH>
                  </tr>
                </thead>
                <tbody>
                  {uniqueRecords.map((r, i) => (
                    <tr
                      key={i}
                      onClick={() => toggleRow(i)}
                      className={`cursor-pointer transition-colors ${
                        selected.has(i) ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <TD>
                        <Checkbox
                          checked={selected.has(i)}
                          onChange={() => toggleRow(i)}
                        />
                      </TD>
                      <TD className="font-medium">{r.search_term}</TD>
                      <TD className="font-mono">#{r.search_frequency_rank}</TD>
                      <TD className="font-mono">
                        {(r.click_share * 100).toFixed(1)}%
                      </TD>
                      <TD className="font-mono">
                        {(r.conversion_share * 100).toFixed(1)}%
                      </TD>
                      <TD className="text-gray-400">{r.department_name}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <span className="text-[11px] text-gray-400">
              {selected.size > 0
                ? `${selected.size} variant${selected.size !== 1 ? "s" : ""} selected`
                : "Select variants to add to a campaign"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={openCampaignModal}
                disabled={selected.size === 0}
                className="text-[12px] px-3 py-1.5 rounded-lg bg-[#f5a623] text-white font-medium hover:bg-[#e09010] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + Add {selected.size > 0 ? `${selected.size} ` : ""}to campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign creation modal — sits on top */}
      {campaignModal && (
        <TargetCampaignModal
            asin={asin}
            mode="keyword"
            intent="ngram"
            kwRows={campaignModal}
            onClose={() => setCampaignModal(null)}
            onRowSuccess={() => {}}
            onRowError={() => {}}
        />
        )}
    </>
  );
};