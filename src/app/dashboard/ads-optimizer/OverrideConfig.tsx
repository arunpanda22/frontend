"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  X, Plus, Tag, Layers, Clock, Sun,
  ClipboardList, ClipboardPaste, AlertCircle, Send, RotateCcw,
  ChevronDown, Search, Trash2, Check, Pencil, CheckSquare, Square,
} from "lucide-react";
import {
  type ScriptType,
  useAsinOverrides,
  useUpsertAsinOverrides,
  useDeleteAsinOverrides,
  useCampaignOverrides,
  useUpsertCampaignOverrides,
  useDeleteCampaignOverrides,
} from "@/lib/hooks/queries/use-script-config";

// ─── Types ────────────────────────────────────────────────────────────────────

type OverrideItem = { id: string; value: string; targetAcos: number };
type ExcludeItem  = { id: string; value: string };

type DraftState = {
  asinOverrides:     OverrideItem[];
  campaignOverrides: OverrideItem[];
  asinExcludes:      ExcludeItem[];
  campaignExcludes:  ExcludeItem[];
};

type BulkMode = "asin-override" | "campaign-override" | "asin-exclude" | "campaign-exclude";
type ModalTab  = "asin-override" | "campaign-override" | "asin-exclude" | "campaign-exclude";

const EMPTY_DRAFT: DraftState = {
  asinOverrides: [], campaignOverrides: [], asinExcludes: [], campaignExcludes: [],
};

const uid = () => Math.random().toString(36).slice(2, 9);
const draftsEqual = (a: DraftState, b: DraftState) => JSON.stringify(a) === JSON.stringify(b);

// ─── AcosInput ────────────────────────────────────────────────────────────────

function AcosInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <div className="relative shrink-0">
      <input
        type="number" min={-100} max={100} step={0.5}
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="ACOS"
        autoFocus={autoFocus}
        className="w-20 bg-white border border-slate-200 text-slate-800 text-sm rounded-md px-2.5 py-2 pr-6 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
    </div>
  );
}

// ─── BulkModal ────────────────────────────────────────────────────────────────

type BulkParsedItem = { value: string; acos?: string; ok: boolean; reason?: string };

function BulkModal({ mode, onClose, onSubmit }: {
  mode:     BulkMode;
  onClose:  () => void;
  onSubmit: (items: Array<{ value: string; targetAcos?: number }>) => void;
}) {
  const [parsed, setParsed] = useState<BulkParsedItem[]>([]);
  const [flash,  setFlash]  = useState(false);

  const isOverride = mode === "asin-override" || mode === "campaign-override";

  const LABELS: Record<BulkMode, { title: string; cols: string }> = {
    "asin-override":     { title: "Bulk Add ASIN Overrides",     cols: "Two columns: ASIN · ACOS %" },
    "campaign-override": { title: "Bulk Add Campaign Overrides",  cols: "Two columns: Campaign Name · ACOS %" },
    "asin-exclude":      { title: "Bulk Add ASIN Exclusions",     cols: "One column: ASIN" },
    "campaign-exclude":  { title: "Bulk Add Campaign Exclusions", cols: "One column: Campaign Name" },
  };

  const parseLine = (line: string): BulkParsedItem => {
    let parts = line.split("\t").map((s) => s.trim());
    if (parts.length === 1 && isOverride) parts = line.split(",").map((s) => s.trim());

    if (mode === "asin-override") {
      const asinRaw = parts[0] || "";
      const acosRaw = parts[1] || "";
      const asinOk  = /^B[A-Z0-9]{9}$/i.test(asinRaw);
      const acosNum = parseFloat(acosRaw);
      const acosOk  = !isNaN(acosNum) && acosNum >= -100 && acosNum <= 100;
      if (!asinOk) return { value: asinRaw.toUpperCase(), ok: false, reason: "Invalid ASIN format" };
      if (!acosOk) return { value: asinRaw.toUpperCase(), ok: false, reason: "Missing or invalid ACOS" };
      return { value: asinRaw.toUpperCase(), acos: acosRaw, ok: true };
    } else if (mode === "campaign-override") {
      const name    = parts[0] || "";
      const acosRaw = parts[1] || "";
      const acosNum = parseFloat(acosRaw);
      const acosOk  = !isNaN(acosNum) && acosNum >= -100 && acosNum <= 100;
      if (!name)   return { value: name, ok: false, reason: "Campaign name is empty" };
      if (!acosOk) return { value: name, ok: false, reason: "Missing or invalid ACOS" };
      return { value: name, acos: acosRaw, ok: true };
    } else if (mode === "asin-exclude") {
      const val = (parts[0] || "").toUpperCase();
      const ok  = /^B[A-Z0-9]{9}$/i.test(val);
      return { value: val, ok, reason: ok ? undefined : "Invalid ASIN format" };
    } else {
      const val = parts[0] || "";
      return { value: val, ok: val.length > 0, reason: val ? undefined : "Empty row" };
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!text.trim()) return;
    setParsed(text.split("\n").map((l) => l.trim()).filter(Boolean).map(parseLine));
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  const valid   = parsed.filter((p) => p.ok);
  const invalid = parsed.filter((p) => !p.ok);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <ClipboardList size={15} className="text-amber-500" />
            <span className="text-sm font-semibold text-slate-800">{LABELS[mode].title}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className={`relative rounded-xl border-2 border-dashed transition-all ${
            flash ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}>
            <div className="flex flex-col items-center justify-center gap-2 py-8 px-6 pointer-events-none select-none">
              <ClipboardPaste size={22} className={`transition-colors ${flash ? "text-amber-500" : "text-slate-300"}`} />
              <p className="text-sm font-semibold text-slate-600">Paste Excel data here</p>
              <p className="text-xs text-slate-400 text-center">{LABELS[mode].cols}</p>
              {parsed.length > 0 && <p className="text-[11px] text-slate-400">Paste again to replace</p>}
            </div>
            <textarea
              onPaste={handlePaste}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
              readOnly
              aria-label="Paste area for bulk data"
            />
          </div>
          {parsed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Preview</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-600 font-medium">{valid.length} valid</span>
                  {invalid.length > 0 && <span className="text-red-500 font-medium">{invalid.length} invalid</span>}
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto custom-scroll rounded-lg border border-slate-100 divide-y divide-slate-100">
                {parsed.map((p, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-3 py-2 ${p.ok ? "bg-white" : "bg-red-50"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.ok ? "bg-emerald-500" : "bg-red-400"}`} />
                    <span className={`text-xs font-mono flex-1 truncate ${p.ok ? "text-slate-600" : "text-red-400/80"}`}>
                      {p.value}{p.ok && p.acos ? <span className="text-amber-500 ml-2">→ {p.acos}%</span> : null}
                    </span>
                    {!p.ok && (
                      <span className="text-xs text-red-400 flex items-center gap-1 shrink-0">
                        <AlertCircle size={11} />{p.reason}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {valid.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {valid.length} item{valid.length > 1 ? "s" : ""} will be staged
            </span>
            <button
              onClick={() => {
                onSubmit(valid.map((p) => ({ value: p.value, targetAcos: isOverride ? parseFloat(p.acos!) : undefined })));
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors"
            >
              Stage {valid.length} Items
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BulkBtn ──────────────────────────────────────────────────────────────────

function BulkBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-all border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50">
      <ClipboardList size={11} /> Bulk paste
    </button>
  );
}

// ─── CountBadge ───────────────────────────────────────────────────────────────

function CountBadge({
  count, label, isDirty, color, onClick,
}: {
  count: number; label: string; isDirty: boolean; color: "gold" | "slate"; onClick: () => void;
}) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
        color === "gold"
          ? isDirty
            ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
            : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300"
          : isDirty
            ? "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:border-slate-400"
            : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:border-slate-300"
      }`}
    >
      {isDirty && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color === "gold" ? "bg-amber-500" : "bg-slate-400"}`} />
      )}
      <span className="font-bold">{count}</span>
      <span className="opacity-70">{label}</span>
      <ChevronDown size={10} className="opacity-50 group-hover:opacity-80 transition-opacity" />
    </button>
  );
}

// ─── OverridesModal ───────────────────────────────────────────────────────────

type ModalItem =
  | { kind: "override"; id: string; value: string; targetAcos: number; isDirty: boolean }
  | { kind: "exclude";  id: string; value: string; isDirty: boolean };

function OverridesModal({
  initialTab,
  draft,
  committed,
  onClose,
  onRemoveItems,
  onEditAcos,
}: {
  initialTab:    ModalTab;
  draft:         DraftState;
  committed:     DraftState;
  onClose:       () => void;
  onRemoveItems: (ids: string[]) => void;
  onEditAcos:    (id: string, newAcos: number, kind: "asin" | "campaign") => void;
}) {
  const [activeTab,    setActiveTab]    = useState<ModalTab>(initialTab);
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Reset selection when tab changes
  useEffect(() => { setSelected(new Set()); setSearch(""); setEditingId(null); }, [activeTab]);

  // Focus search on open
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const committedIds = useMemo(() => new Set([
    ...committed.asinOverrides.map((r) => r.id),
    ...committed.campaignOverrides.map((r) => r.id),
    ...committed.asinExcludes.map((r) => r.id),
    ...committed.campaignExcludes.map((r) => r.id),
  ]), [committed]);

  const tabItems = useMemo((): ModalItem[] => {
    const q = search.toLowerCase();
    if (activeTab === "asin-override") {
      return draft.asinOverrides
        .filter((r) => r.value.toLowerCase().includes(q))
        .map((r) => ({ kind: "override", ...r, isDirty: !committedIds.has(r.id) }));
    } else if (activeTab === "campaign-override") {
      return draft.campaignOverrides
        .filter((r) => r.value.toLowerCase().includes(q))
        .map((r) => ({ kind: "override", ...r, isDirty: !committedIds.has(r.id) }));
    } else if (activeTab === "asin-exclude") {
      return draft.asinExcludes
        .filter((r) => r.value.toLowerCase().includes(q))
        .map((r) => ({ kind: "exclude", ...r, isDirty: !committedIds.has(r.id) }));
    } else {
      return draft.campaignExcludes
        .filter((r) => r.value.toLowerCase().includes(q))
        .map((r) => ({ kind: "exclude", ...r, isDirty: !committedIds.has(r.id) }));
    }
  }, [activeTab, draft, search, committedIds]);

  const allSelected  = tabItems.length > 0 && tabItems.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(tabItems.map((i) => i.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    onRemoveItems([...selected]);
    setSelected(new Set());
  };

  const handleRemoveOne = (id: string) => {
    onRemoveItems([id]);
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const startEdit = (item: ModalItem) => {
    if (item.kind !== "override") return;
    setEditingId(item.id);
    setEditingValue(String(item.targetAcos));
  };

  const commitEdit = useCallback((id: string) => {
    const num = parseFloat(editingValue);
    if (!isNaN(num) && num >= -100 && num <= 100) {
      const kind = activeTab === "asin-override" ? "asin" : "campaign";
      onEditAcos(id, num, kind);
    }
    setEditingId(null);
  }, [editingValue, activeTab, onEditAcos]);

  const TABS: { key: ModalTab; label: string; count: number; color: "gold" | "slate" }[] = [
    { key: "asin-override",     label: "ASIN Overrides",     count: draft.asinOverrides.length,     color: "gold"  },
    { key: "campaign-override", label: "Campaign Overrides", count: draft.campaignOverrides.length, color: "gold"  },
    { key: "asin-exclude",      label: "ASIN Exclusions",    count: draft.asinExcludes.length,      color: "slate" },
    { key: "campaign-exclude",  label: "Campaign Exclusions",count: draft.campaignExcludes.length,  color: "slate" },
  ];

  const isOverrideTab = activeTab === "asin-override" || activeTab === "campaign-override";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Staged Overrides & Exclusions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Changes are local until you submit</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0 px-2 pt-1 gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${
                activeTab === tab.key
                  ? "border-amber-400 text-slate-800"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key
                    ? tab.color === "gold" ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-600"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isOverrideTab ? "Search by ASIN or campaign…" : "Search…"}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all"
            />
          </div>

          {/* Select all */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            {allSelected
              ? <CheckSquare size={12} className="text-amber-500" />
              : <Square size={12} />
            }
            All
          </button>

          {/* Bulk delete */}
          {someSelected && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
            >
              <Trash2 size={12} />
              Delete {selected.size}
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          {tabItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-3">
              <Search size={28} strokeWidth={1.5} />
              <p className="text-sm font-medium">
                {search ? "No matches found" : "Nothing here yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {tabItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-2.5 group transition-colors ${
                    selected.has(item.id) ? "bg-amber-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Checkbox */}
                  <button onClick={() => toggleOne(item.id)} className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors">
                    {selected.has(item.id)
                      ? <CheckSquare size={14} className="text-amber-500" />
                      : <Square size={14} />
                    }
                  </button>

                  {/* Dirty dot */}
                  {item.isDirty && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved" />
                  )}

                  {/* Value */}
                  <span className="flex-1 text-xs font-mono text-slate-700 truncate min-w-0" title={item.value}>
                    {item.value}
                  </span>

                  {/* ACOS (overrides only) */}
                  {item.kind === "override" && (
                    <div className="shrink-0">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <input
                              type="number" min={-100} max={100} step={0.5}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit(item.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              autoFocus
                              className="w-20 bg-white border border-amber-300 text-slate-800 text-xs rounded-md px-2 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-amber-100"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
                          </div>
                          <button
                            onClick={() => commitEdit(item.id)}
                            className="p-1 rounded-md bg-amber-500 text-white hover:bg-amber-400 transition-colors"
                          >
                            <Check size={11} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300 group/acos transition-all"
                        >
                          {item.targetAcos}%
                          <Pencil size={9} className="opacity-0 group-hover/acos:opacity-60 transition-opacity" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Excluded badge */}
                  {item.kind === "exclude" && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      excluded
                    </span>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveOne(item.id)}
                    className="shrink-0 p-1 rounded-md text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <span className="text-xs text-slate-400">
            {tabItems.length} item{tabItems.length !== 1 ? "s" : ""}
            {search && " matching"}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OptimizationPanel ────────────────────────────────────────────────────────

function OptimizationPanel({ scriptType }: { scriptType: ScriptType }) {
  const isDaily  = scriptType === "daily";
  const label    = isDaily ? "Daily" : "Dayparting";

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: asinData = [],     isSuccess: asinReady }     = useAsinOverrides(scriptType);
  const { data: campaignData = [], isSuccess: campaignReady } = useCampaignOverrides(scriptType);
  const upsertAsins     = useUpsertAsinOverrides();
  const deleteAsins     = useDeleteAsinOverrides();
  const upsertCampaigns = useUpsertCampaignOverrides();
  const deleteCampaigns = useDeleteCampaignOverrides();

  const serverState = useMemo<DraftState>(() => ({
    asinOverrides: asinData
      .filter((r) => r.acos_change_percent !== null)
      .map((r) => ({ id: r.id, value: r.asin, targetAcos: parseFloat(r.acos_change_percent!) })),
    campaignOverrides: campaignData
      .filter((r) => r.acos_change_percent !== null)
      .map((r) => ({ id: r.id, value: r.campaign_name, targetAcos: parseFloat(r.acos_change_percent!) })),
    asinExcludes: asinData
      .filter((r) => r.is_excluded === true)
      .map((r) => ({ id: r.id, value: r.asin })),
    campaignExcludes: campaignData
      .filter((r) => r.is_excluded === true)
      .map((r) => ({ id: r.id, value: r.campaign_name })),
  }), [asinData, campaignData]);

  const [draft,        setDraft]        = useState<DraftState>(EMPTY_DRAFT);
  const [committed,    setCommitted]    = useState<DraftState>(EMPTY_DRAFT);
  const [initialized,  setInitialized]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved,    setLastSaved]    = useState<string | null>(null);
  const [modalTab,     setModalTab]     = useState<ModalTab | null>(null);

  // ── Fixed initialization: wait for both queries ────────────────────────────
  useEffect(() => {
    if (!initialized && asinReady && campaignReady) {
      setDraft(serverState);
      setCommitted(serverState);
      setInitialized(true);
    }
  }, [serverState, initialized, asinReady, campaignReady]);

  // ── Inputs ────────────────────────────────────────────────────────────────
  const [asinInput,            setAsinInput]            = useState("");
  const [asinAcos,             setAsinAcos]             = useState("");
  const [asinExcludeInput,     setAsinExcludeInput]     = useState("");
  const [campaignInput,        setCampaignInput]        = useState("");
  const [campaignAcos,         setCampaignAcos]         = useState("");
  const [campaignExcludeInput, setCampaignExcludeInput] = useState("");
  const [bulkMode,             setBulkMode]             = useState<BulkMode | null>(null);

  const isDirty = !draftsEqual(draft, committed);

  // ── Add handlers ──────────────────────────────────────────────────────────

  const handleAddAsinOverride = () => {
    const val = asinInput.trim().toUpperCase();
    if (!val || !asinAcos || draft.asinOverrides.find((a) => a.value === val)) return;
    setDraft((d) => ({
      ...d,
      asinOverrides: [...d.asinOverrides, { id: uid(), value: val, targetAcos: Number(asinAcos) }],
      asinExcludes: d.asinExcludes.filter((x) => x.value !== val),
    }));
    setAsinInput(""); setAsinAcos("");
  };

  const handleAddCampaignOverride = () => {
    const val = campaignInput.trim();
    if (!val || !campaignAcos || draft.campaignOverrides.find((c) => c.value === val)) return;
    setDraft((d) => ({
      ...d,
      campaignOverrides: [...d.campaignOverrides, { id: uid(), value: val, targetAcos: Number(campaignAcos) }],
      campaignExcludes: d.campaignExcludes.filter((x) => x.value !== val),
    }));
    setCampaignInput(""); setCampaignAcos("");
  };

  const handleAddAsinExclude = () => {
    const val = asinExcludeInput.trim().toUpperCase();
    if (!val || draft.asinExcludes.find((a) => a.value === val)) return;
    setDraft((d) => ({
      ...d,
      asinExcludes: [...d.asinExcludes, { id: uid(), value: val }],
      asinOverrides: d.asinOverrides.filter((x) => x.value !== val),
    }));
    setAsinExcludeInput("");
  };

  const handleAddCampaignExclude = () => {
    const val = campaignExcludeInput.trim();
    if (!val || draft.campaignExcludes.find((c) => c.value === val)) return;
    setDraft((d) => ({
      ...d,
      campaignExcludes: [...d.campaignExcludes, { id: uid(), value: val }],
      campaignOverrides: d.campaignOverrides.filter((x) => x.value !== val),
    }));
    setCampaignExcludeInput("");
  };

  const handleBulkSubmit = (items: Array<{ value: string; targetAcos?: number }>) => {
    if (bulkMode === "asin-override") {
      setDraft((d) => {
        const newValues = items.map((i) => i.value);
        return {
          ...d,
          asinOverrides: [
            ...d.asinOverrides,
            ...items
              .filter((i) => !d.asinOverrides.find((x) => x.value === i.value))
              .map((i) => ({ id: uid(), value: i.value, targetAcos: i.targetAcos! })),
          ],
          asinExcludes: d.asinExcludes.filter((x) => !newValues.includes(x.value)),
        };
      });
    } else if (bulkMode === "campaign-override") {
      setDraft((d) => {
        const newValues = items.map((i) => i.value);
        return {
          ...d,
          campaignOverrides: [
            ...d.campaignOverrides,
            ...items
              .filter((i) => !d.campaignOverrides.find((x) => x.value === i.value))
              .map((i) => ({ id: uid(), value: i.value, targetAcos: i.targetAcos! })),
          ],
          campaignExcludes: d.campaignExcludes.filter((x) => !newValues.includes(x.value)),
        };
      });
    } else if (bulkMode === "asin-exclude") {
      setDraft((d) => {
        const newValues = items.map((i) => i.value);
        return {
          ...d,
          asinExcludes: [
            ...d.asinExcludes,
            ...items
              .filter((i) => !d.asinExcludes.find((x) => x.value === i.value))
              .map((i) => ({ id: uid(), value: i.value })),
          ],
          asinOverrides: d.asinOverrides.filter((x) => !newValues.includes(x.value)),
        };
      });
    } else if (bulkMode === "campaign-exclude") {
      setDraft((d) => {
        const newValues = items.map((i) => i.value);
        return {
          ...d,
          campaignExcludes: [
            ...d.campaignExcludes,
            ...items
              .filter((i) => !d.campaignExcludes.find((x) => x.value === i.value))
              .map((i) => ({ id: uid(), value: i.value })),
          ],
          campaignOverrides: d.campaignOverrides.filter((x) => !newValues.includes(x.value)),
        };
      });
    }
  };

  // ── Modal handlers ────────────────────────────────────────────────────────

  const handleRemoveItems = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setDraft((d) => ({
      asinOverrides:     d.asinOverrides.filter((x) => !idSet.has(x.id)),
      campaignOverrides: d.campaignOverrides.filter((x) => !idSet.has(x.id)),
      asinExcludes:      d.asinExcludes.filter((x) => !idSet.has(x.id)),
      campaignExcludes:  d.campaignExcludes.filter((x) => !idSet.has(x.id)),
    }));
  }, []);

  const handleEditAcos = useCallback((id: string, newAcos: number, kind: "asin" | "campaign") => {
    if (kind === "asin") {
      setDraft((d) => ({
        ...d,
        asinOverrides: d.asinOverrides.map((r) => r.id === id ? { ...r, targetAcos: newAcos } : r),
      }));
    } else {
      setDraft((d) => ({
        ...d,
        campaignOverrides: d.campaignOverrides.map((r) => r.id === id ? { ...r, targetAcos: newAcos } : r),
      }));
    }
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const asinUpsertMap = new Map<string, {
        asin: string; script_type: ScriptType; is_excluded: boolean | null; acos_change_percent: number | null
      }>();

      for (const r of draft.asinOverrides) {
        asinUpsertMap.set(r.value, {
          asin: r.value, script_type: scriptType,
          acos_change_percent: r.targetAcos,
          is_excluded: asinUpsertMap.get(r.value)?.is_excluded ?? null,
        });
      }
      for (const r of draft.asinExcludes) {
        const existing = asinUpsertMap.get(r.value);
        asinUpsertMap.set(r.value, {
          asin: r.value, script_type: scriptType,
          acos_change_percent: existing?.acos_change_percent ?? null,
          is_excluded: true,
        });
      }

      const allDraftAsins     = new Set([...draft.asinOverrides.map((r) => r.value), ...draft.asinExcludes.map((r) => r.value)]);
      const allCommittedAsins = new Set([...committed.asinOverrides.map((r) => r.value), ...committed.asinExcludes.map((r) => r.value)]);
      const asinsToDelete     = [...allCommittedAsins]
        .filter((a) => !allDraftAsins.has(a))
        .map((asin) => ({ asin, script_type: scriptType }));

      const campaignUpsertMap = new Map<string, {
        campaign_name: string; script_type: ScriptType; is_excluded: boolean | null; acos_change_percent: number | null
      }>();

      for (const r of draft.campaignOverrides) {
        campaignUpsertMap.set(r.value, {
          campaign_name: r.value, script_type: scriptType,
          acos_change_percent: r.targetAcos,
          is_excluded: campaignUpsertMap.get(r.value)?.is_excluded ?? null,
        });
      }
      for (const r of draft.campaignExcludes) {
        const existing = campaignUpsertMap.get(r.value);
        campaignUpsertMap.set(r.value, {
          campaign_name: r.value, script_type: scriptType,
          acos_change_percent: existing?.acos_change_percent ?? null,
          is_excluded: true,
        });
      }

      const allDraftCampaigns     = new Set([...draft.campaignOverrides.map((r) => r.value), ...draft.campaignExcludes.map((r) => r.value)]);
      const allCommittedCampaigns = new Set([...committed.campaignOverrides.map((r) => r.value), ...committed.campaignExcludes.map((r) => r.value)]);
      const campaignsToDelete     = [...allCommittedCampaigns]
        .filter((c) => !allDraftCampaigns.has(c))
        .map((campaign_name) => ({ campaign_name, script_type: scriptType }));

      await Promise.all([
        asinUpsertMap.size       > 0 && upsertAsins.mutateAsync([...asinUpsertMap.values()]),
        asinsToDelete.length     > 0 && deleteAsins.mutateAsync(asinsToDelete),
        campaignUpsertMap.size   > 0 && upsertCampaigns.mutateAsync([...campaignUpsertMap.values()]),
        campaignsToDelete.length > 0 && deleteCampaigns.mutateAsync(campaignsToDelete),
      ]);

      setCommitted(draft);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    setDraft(committed);
    setAsinInput(""); setAsinAcos("");
    setAsinExcludeInput("");
    setCampaignInput(""); setCampaignAcos("");
    setCampaignExcludeInput("");
  };

  // ── Dirty counts (unsaved items per section) ──────────────────────────────
  const committedIds = useMemo(() => new Set([
    ...committed.asinOverrides.map((r) => r.id),
    ...committed.campaignOverrides.map((r) => r.id),
    ...committed.asinExcludes.map((r) => r.id),
    ...committed.campaignExcludes.map((r) => r.id),
  ]), [committed]);

  const sectionDirty = {
    asinOverrides:     draft.asinOverrides.some((r) => !committedIds.has(r.id)),
    campaignOverrides: draft.campaignOverrides.some((r) => !committedIds.has(r.id)),
    asinExcludes:      draft.asinExcludes.some((r) => !committedIds.has(r.id)),
    campaignExcludes:  draft.campaignExcludes.some((r) => !committedIds.has(r.id)),
  };

  const totalDraft = draft.asinOverrides.length + draft.campaignOverrides.length +
    draft.asinExcludes.length + draft.campaignExcludes.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0">

      {/* Panel header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`p-1.5 rounded-md ${isDaily ? "bg-sky-100 text-sky-600" : "bg-violet-100 text-violet-600"}`}>
          {isDaily ? <Sun size={14} /> : <Clock size={14} />}
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">{label} Optimization</h2>
          <p className="text-xs text-slate-500">{isDaily ? "Runs once per day" : "Adjusts bids throughout the day"}</p>
        </div>
        {lastSaved && !isDirty && (
          <span className="ml-auto text-xs text-slate-400">Saved {lastSaved}</span>
        )}
      </div>

      {/* ── Input card ── */}
      <div className="rounded-t-xl border border-b-0 border-slate-200 bg-white p-5 space-y-4">

        {/* ACOS Target Overrides */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-500"><Tag size={13} /></div>
          <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500">ACOS Target Overrides</h3>
        </div>

        {/* By ASIN */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 uppercase tracking-wider">By ASIN</label>
            <BulkBtn onClick={() => setBulkMode("asin-override")} />
          </div>
          <div className="flex gap-2">
            <input
              value={asinInput} onChange={(e) => setAsinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAsinOverride()}
              placeholder="e.g. B08N5LNQCX"
              className="flex-1 min-w-0 bg-white border border-slate-200 text-slate-800 text-sm font-mono rounded-md px-3 py-2 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all"
            />
            <AcosInput value={asinAcos} onChange={setAsinAcos} />
            <button onClick={handleAddAsinOverride} disabled={!asinInput.trim() || !asinAcos}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0">
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* By Campaign */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 uppercase tracking-wider">By Campaign</label>
            <BulkBtn onClick={() => setBulkMode("campaign-override")} />
          </div>
          <div className="flex gap-2">
            <input
              value={campaignInput} onChange={(e) => setCampaignInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCampaignOverride()}
              placeholder="e.g. SP | Auto | Broad Match | Electronics"
              className="flex-1 min-w-0 bg-white border border-slate-200 text-slate-800 text-sm rounded-md px-3 py-2 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all"
            />
            <AcosInput value={campaignAcos} onChange={setCampaignAcos} />
            <button onClick={handleAddCampaignOverride} disabled={!campaignInput.trim() || !campaignAcos}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0">
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Exclusions */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-500"><Layers size={13} /></div>
          <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500">Exclusions</h3>
        </div>

        {/* Exclude ASINs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Exclude ASINs</label>
            <BulkBtn onClick={() => setBulkMode("asin-exclude")} />
          </div>
          <div className="flex gap-2">
            <input
              value={asinExcludeInput} onChange={(e) => setAsinExcludeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAsinExclude()}
              placeholder="e.g. B09G9HD4PX"
              className="flex-1 min-w-0 bg-white border border-slate-200 text-slate-800 text-sm font-mono rounded-md px-3 py-2 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100 transition-all"
            />
            <button onClick={handleAddAsinExclude} disabled={!asinExcludeInput.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0">
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Exclude Campaigns */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Exclude Campaigns</label>
            <BulkBtn onClick={() => setBulkMode("campaign-exclude")} />
          </div>
          <div className="flex gap-2">
            <input
              value={campaignExcludeInput} onChange={(e) => setCampaignExcludeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCampaignExclude()}
              placeholder="e.g. SP | Manual | Exact | Headphones"
              className="flex-1 min-w-0 bg-white border border-slate-200 text-slate-800 text-sm rounded-md px-3 py-2 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100 transition-all"
            />
            <button onClick={handleAddCampaignExclude} disabled={!campaignExcludeInput.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0">
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer card ── */}
      <div className={`rounded-b-xl border border-slate-200 transition-all ${
        isDirty ? "bg-amber-50 border-amber-200 shadow-lg shadow-amber-100" : "bg-white"
      }`}>

        {/* Count badges row */}
        {totalDraft > 0 && (
          <div className="px-5 pt-3.5 pb-3 border-b border-slate-100 flex flex-wrap gap-2">
            <CountBadge
              count={draft.asinOverrides.length}
              label="ASIN overrides"
              isDirty={sectionDirty.asinOverrides}
              color="gold"
              onClick={() => setModalTab("asin-override")}
            />
            <CountBadge
              count={draft.campaignOverrides.length}
              label="campaign overrides"
              isDirty={sectionDirty.campaignOverrides}
              color="gold"
              onClick={() => setModalTab("campaign-override")}
            />
            <CountBadge
              count={draft.asinExcludes.length}
              label="ASIN exclusions"
              isDirty={sectionDirty.asinExcludes}
              color="slate"
              onClick={() => setModalTab("asin-exclude")}
            />
            <CountBadge
              count={draft.campaignExcludes.length}
              label="campaign exclusions"
              isDirty={sectionDirty.campaignExcludes}
              color="slate"
              onClick={() => setModalTab("campaign-exclude")}
            />
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="text-xs text-slate-400">
            {totalDraft === 0
              ? <span className="text-slate-300">No overrides or exclusions configured.</span>
              : <span>{totalDraft} item{totalDraft > 1 ? "s" : ""} total — click a badge to review</span>
            }
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {isDirty && (
              <button onClick={handleDiscard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-700 border border-transparent hover:border-slate-200 transition-all">
                <RotateCcw size={11} /> Discard
              </button>
            )}
            <button
              onClick={handleSubmit} disabled={!isDirty || isSubmitting}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold tracking-wide transition-all ${
                isDirty && !isSubmitting
                  ? "bg-amber-500 text-white hover:bg-amber-400 shadow-md shadow-amber-200"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <><Send size={12} />{isDirty ? "Submit Changes" : "Up to Date"}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk modal */}
      {bulkMode && (
        <BulkModal mode={bulkMode} onClose={() => setBulkMode(null)} onSubmit={handleBulkSubmit} />
      )}

      {/* Overrides modal */}
      {modalTab && (
        <OverridesModal
          initialTab={modalTab}
          draft={draft}
          committed={committed}
          onClose={() => setModalTab(null)}
          onRemoveItems={handleRemoveItems}
          onEditAcos={handleEditAcos}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverrideConfig() {
  return (
    <div className="min-h-screen">
      <div className="p-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-ocean-100 font-medium mb-1">Bid Optimization</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Override Configuration</h1>
          <p className="mt-1 text-sm text-slate-500">
            Set custom ACOS targets or exclude ASINs and campaigns per optimization type. Changes are staged locally until you submit.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 items-start">
          <OptimizationPanel scriptType="daily" />
          <OptimizationPanel scriptType="dayparting" />
        </div>
      </div>

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
      `}</style>
    </div>
  );
}