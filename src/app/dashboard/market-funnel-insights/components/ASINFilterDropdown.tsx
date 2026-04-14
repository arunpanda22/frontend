// src/app/dashboard/market-funnel-insights/sqp-v2/components/ASINFilterDropdown.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Layers } from "lucide-react";

interface ASINFilterDropdownProps {
  asins: string[];
  selectedAsin: string;
  onSelect: (asin: string) => void;
  onSelectAll: () => void;
  disabled?: boolean;
}

export default function ASINFilterDropdown({
  asins,
  selectedAsin,
  onSelect,
  onSelectAll,
  disabled = false,
}: ASINFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = asins.filter((a) =>
    a.toLowerCase().includes(search.toLowerCase())
  );

  const label = selectedAsin || "All ASINs";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg
                   text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50/40
                   transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
      >
        <Layers className="w-3.5 h-3.5 text-gray-400" />
        <span className="flex-1 text-left font-mono text-xs truncate max-w-[140px]">
          {label}
        </span>
        {selectedAsin && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onSelectAll();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-gray-100
                        rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search ASINs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-100 rounded-lg
                           focus:outline-none focus:ring-1 focus:ring-blue-200 bg-gray-50 text-gray-700"
              />
            </div>
          </div>

          {/* All ASINs option */}
          <button
            onClick={() => {
              onSelectAll();
              setOpen(false);
              setSearch("");
            }}
            className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2
                        hover:bg-blue-50 transition-colors border-b border-gray-50
                        ${!selectedAsin ? "text-blue-700 bg-blue-50/50" : "text-gray-600"}`}
          >
            <Layers className="w-3.5 h-3.5" />
            All ASINs
          </button>

          {/* ASIN list */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-gray-400 text-center">No ASINs found</p>
            ) : (
              filtered.map((asin) => (
                <button
                  key={asin}
                  onClick={() => {
                    onSelect(asin);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-mono hover:bg-blue-50
                              transition-colors flex items-center justify-between
                              ${selectedAsin === asin ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"}`}
                >
                  {asin}
                  {selectedAsin === asin && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}