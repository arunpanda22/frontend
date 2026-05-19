"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X, LayoutGrid } from "lucide-react";
import { SQPASINMeta } from "../types/sqp_v2.types";

interface ASINFilterDropdownProps {
  asins: SQPASINMeta[];
  selectedAsin: string;
  onSelect: (asin: string) => void;
  onSelectAll: () => void;
}

export default function ASINFilterDropdown({
  asins,
  selectedAsin,
  onSelect,
  onSelectAll,
}: ASINFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  // Guard: filter out any entries missing a valid asin
  const safeAsins = (asins ?? []).filter((item) => item?.asin);

  const filtered = searchQuery.trim()
    ? safeAsins.filter(
        (item) =>
          item.asin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ((item.product_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : safeAsins;

  const selectedMeta = safeAsins.find((a) => a.asin === selectedAsin);

  const handleSelect = (asin: string) => {
    onSelect(asin);
    setOpen(false);
    setSearchQuery("");
  };

  const handleSelectAll = () => {
    onSelectAll();
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`
          flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-lg border text-sm
          transition-all duration-150 min-w-0 max-w-[320px]
          ${
            open
              ? "border-blue-400 bg-blue-50 shadow-sm"
              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 shadow-sm"
          }
        `}
      >
        {/* Thumbnail or grid icon */}
        {selectedAsin && selectedMeta?.image_url ? (
          <img
            src={selectedMeta.image_url}
            alt={selectedMeta.asin}
            className="w-6 h-6 rounded object-cover flex-shrink-0 bg-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <LayoutGrid className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}

        {/* Label */}
        <span className="flex items-center gap-1.5 min-w-0">
          {selectedAsin ? (
            <>
              <span className="font-mono text-xs font-semibold text-gray-700 flex-shrink-0">
                {selectedAsin}
              </span>
              {selectedMeta?.product_name && (
                <span className="text-xs text-gray-400 truncate">
                  · {selectedMeta.product_name}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-600 font-medium">All ASINs</span>
          )}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-1 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="
            absolute right-0 top-full mt-1.5 z-50
            bg-white border border-gray-200 rounded-xl shadow-lg
            w-72 overflow-hidden
          "
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ASIN or product name…"
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto max-h-72">
            {/* "All ASINs" option */}
            {!searchQuery && (
              <button
                onClick={handleSelectAll}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                  transition-colors duration-100 border-b border-gray-50
                  ${!selectedAsin ? "bg-blue-50" : "hover:bg-gray-50"}
                `}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700">All ASINs</div>
                  <div className="text-xs text-gray-400">{safeAsins.length} products</div>
                </div>
                {!selectedAsin && (
                  <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                )}
              </button>
            )}

            {/* ASIN rows */}
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-400">
                No ASINs match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedAsin === item.asin;
                // Normalize: coerce undefined → null
                const productName = item.product_name ?? null;
                const imageUrl = item.image_url ?? null;
                // Safe fallback for asin display (belt-and-suspenders)
                const asinLabel = item.asin ?? "????";

                return (
                  <button
                    key={item.asin}
                    onClick={() => handleSelect(item.asin)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-left
                      transition-colors duration-100
                      ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
                    `}
                  >
                    {/* Product image */}
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={asinLabel}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-gray-100 border border-gray-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}

                    {/* Fallback placeholder */}
                    <div
                      className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 items-center justify-center"
                      style={{ display: imageUrl ? "none" : "flex" }}
                    >
                      <span className="text-[9px] font-mono text-gray-400 leading-none text-center px-0.5">
                        {asinLabel.slice(0, 4)}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-mono text-xs font-semibold leading-tight ${
                          isSelected ? "text-blue-700" : "text-gray-600"
                        }`}
                      >
                        {asinLabel}
                      </div>
                      {productName ? (
                        <div className="text-xs text-gray-500 truncate leading-tight mt-0.5">
                          {productName}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-300 leading-tight mt-0.5 italic">
                          No name available
                        </div>
                      )}
                    </div>

                    {/* Check indicator */}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-[11px] text-gray-400">
              {searchQuery
                ? `${filtered.length} of ${safeAsins.length} ASINs`
                : `${safeAsins.length} ASINs total`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}