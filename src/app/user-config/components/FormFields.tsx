"use client"
import { useState, useRef, useEffect, InputHTMLAttributes, SelectHTMLAttributes } from "react"
import { Calendar, ChevronDown, Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

// ── Shared Types ──────────────────────────────────────────────────────────────

export interface AsinRow {
  asin: string
}

// ── Text Input ────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <input
        className={`
          w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800
          placeholder:text-slate-400 transition-all outline-none
          ${error
            ? "border-red-400 ring-1 ring-red-200 focus:border-red-400"
            : "border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Number Input ──────────────────────────────────────────────────────────────

interface NumberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:  string;
  error?:  string;
  prefix?: string;
}

export function NumberInput({ label, error, prefix, className = "", ...props }: NumberInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          className={`
            w-full rounded-lg border bg-white py-2 text-sm text-slate-800
            placeholder:text-slate-400 transition-all outline-none
            ${prefix ? "pl-7 pr-3" : "px-3"}
            ${error
              ? "border-red-400 ring-1 ring-red-200 focus:border-red-400"
              : "border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  options:  SelectOption[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8
            text-sm text-slate-800 transition-all outline-none cursor-pointer
            ${error
              ? "border-red-400 ring-1 ring-red-200"
              : "border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Date Picker ───────────────────────────────────────────────────────────────

interface DatePickerProps {
  label?:    string;
  value:     string;
  onChange:  (value: string) => void;
  error?:    string;
}

export function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const display = value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Select date";

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`
            flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2
            text-sm transition-all outline-none text-left
            ${error
              ? "border-red-400 ring-1 ring-red-200"
              : "border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"}
          `}
        >
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className={value ? "text-slate-800" : "text-slate-400"}>{display}</span>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <input
              type="date"
              value={value}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => { onChange(e.target.value); setOpen(false); }}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              autoFocus
            />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title:        string;
  description?: string;
  children:     React.ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── ASIN Table ────────────────────────────────────────────────────────────────

interface AsinTableProps {
  rows:       AsinRow[];
  onChange:   (rows: AsinRow[]) => void;
  showTheme:  boolean;
}

export function AsinTable({ rows, onChange, showTheme }: AsinTableProps) {
  function updateRow(idx: number, val: string) {
    onChange(rows.map((r, i) => (i === idx ? { asin: val } : r)));
  }

  function addRow() {
    onChange([...rows, { asin: "" }]);
  }

  function removeRow(idx: number) {
    if (rows.length === 1) return onChange([{ asin: "" }]);
    onChange(rows.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                ASIN
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="group">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.asin}
                    onChange={(e) => updateRow(idx, e.target.value.trim())}
                    placeholder="e.g. B009GCTZWC"
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white group-hover:bg-slate-50"
                  />
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600"
        >
          <Plus className="h-3 w-3" />
          Add ASIN
        </button>

        {showTheme && (
          <p className="text-xs text-amber-600">
            ⚠ Theme required for multiple ASINs
          </p>
        )}
      </div>
    </div>
  );
}

// ── Bidding Adjustments ───────────────────────────────────────────────────────

interface BiddingValues {
  TOS_bidding: number;
  ROS_bidding: number;
  PP_bidding:  number;
  AB_bidding:  number;
}

interface BiddingAdjustmentsProps {
  values:   BiddingValues;
  onChange: (key: keyof BiddingValues, val: number) => void;
}

const BIDDING_FIELDS: { key: keyof BiddingValues; label: string }[] = [
  { key: "TOS_bidding", label: "Top of Search"    },
  { key: "ROS_bidding", label: "Rest of Search"   },
  { key: "PP_bidding",  label: "Product Page"     },
  { key: "AB_bidding",  label: "Amazon Business"  },
];

export function BiddingAdjustments({ values, onChange }: BiddingAdjustmentsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BIDDING_FIELDS.map(({ key, label }) => (
        <NumberInput
          key={key}
          label={label}
          value={values[key]}
          min={0}
          max={900}
          onChange={(e) => onChange(key, Number(e.target.value))}
        />
      ))}
    </div>
  );
}

// ── Submit Button ─────────────────────────────────────────────────────────────

interface SubmitButtonProps {
  loading: boolean;
  label?:  string;
}

export function SubmitButton({ loading, label = "Create Campaign" }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        label
      )}
    </button>
  );
}

// ── Result Banner ─────────────────────────────────────────────────────────────

import type { CampaignOperationResult } from "@/lib/hooks/campaignCreationHooks";

interface ResultBannerProps {
  result: CampaignOperationResult | null
}

export function ResultBanner({ result }: ResultBannerProps) {
  if (!result) return null

  if (result.success && result.data) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800">Campaign created successfully</p>
          <p className="mt-1 text-emerald-700">
            Campaign ID: <span className="font-mono">{result.data.campaign_id}</span>
            {" · "}
            Ad Group ID: <span className="font-mono">{result.data.ad_group_id}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div className="text-sm">
          <p className="font-semibold text-red-800">
            {result.failed_step ? `Failed at step: ${result.failed_step}` : "Campaign creation failed"}
          </p>
          <p className="mt-1 text-red-700">{result.error}</p>
          {result.error_details?.map((e, i) => (
            <p key={i} className="mt-1 font-mono text-xs text-red-600">
              {e.reason} · {e.trigger}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}