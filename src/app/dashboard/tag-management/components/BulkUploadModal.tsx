"use client";

import { useState } from "react";
import { X, Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { isAxiosError } from "axios";
import {
  EntityType,
  useBulkUploadTagsMutation,
  useDownloadTagTemplate,
} from "@/lib/hooks/queries/use-entity-tags";

export function BulkUploadModal({
  entityType,
  onClose,
}: {
  entityType: EntityType;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const bulkUpload = useBulkUploadTagsMutation(entityType);
  const downloadTemplate = useDownloadTagTemplate();

  async function handleUpload() {
    if (!file) return;
    const result = await bulkUpload.mutateAsync(file);
    if (result.rows_failed === 0) setTimeout(onClose, 1200);
  }

  const result = bulkUpload.data;

  const uploadErrorMessage = isAxiosError<{ error?: string }>(bulkUpload.error)
    ? bulkUpload.error.response?.data?.error
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1a2b3c]">
            Bulk Upload Tags — {entityType}
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X className="size-4 text-slate-400 hover:text-slate-700" />
          </button>
        </div>

        <p className="mb-2 text-xs text-slate-500">
          CSV format: first column is the{" "}
          {entityType === "ASIN"
            ? "ASIN"
            : entityType === "CAMPAIGN"
              ? "Campaign Name"
              : "Keyword"}
          , remaining columns are tag values. Column order doesn&apos;t matter —
          headers are matched by name. Unrecognized headers create new tag types
          automatically.
          {entityType === "TARGET" && (
            <>
              {" "}
              Columns named{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">
                campaign_id
              </code>{" "}
              and{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">
                display_name
              </code>{" "}
              are reserved.
            </>
          )}
          {entityType === "ASIN" && (
            <>
              {" "}
              A column named{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">
                display_name
              </code>{" "}
              is reserved — it sets the product title shown in the grid instead
              of becoming a tag.
            </>
          )}
        </p>

        <button
          type="button"
          onClick={() => downloadTemplate.mutate(entityType)}
          disabled={downloadTemplate.isPending}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#1a2b3c] hover:underline disabled:opacity-50"
        >
          <Download className="size-3.5" />
          {downloadTemplate.isPending
            ? "Preparing..."
            : "Download sample template"}
        </button>

        <label className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-8 text-sm text-slate-500 hover:border-[#1a2b3c]">
          <Upload className="size-5" />
          {file ? file.name : "Click to select a .csv file"}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {result && (
          <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-3 text-xs">
            <div className="mb-2 flex items-center gap-1.5 font-medium text-slate-700">
              {result.rows_failed === 0 ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="size-3.5 text-amber-600" />
              )}
              {result.rows_processed} rows applied, {result.rows_failed} failed
            </div>
            {result.errors.map((err) => (
              <div key={err.row} className="text-rose-600">
                Row {err.row} ({err.entity_key}): {err.error}
              </div>
            ))}
          </div>
        )}

        {bulkUpload.isError && (
          <p className="mb-4 text-xs text-rose-600">
            {uploadErrorMessage || "Upload failed — please try again."}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || bulkUpload.isPending}
            className="rounded-lg bg-[#1a2b3c] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {bulkUpload.isPending ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
