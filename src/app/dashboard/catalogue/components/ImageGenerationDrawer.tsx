"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Loader, Plus, Minus, Pencil,
  ImageIcon, Sparkles, Upload, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { useCatalogStore } from "@/lib/hooks/queries/use-catalog-store";
import { useCatalogOperations } from "@/lib/hooks/use-catalogue-operations";
import type {
  ImageGenerationRequest,
  ImageEditRequest,
  ImageGuidelineItem,
  AplusBannerItem,
} from "@/app/dashboard/catalogue/lib/types";

export type DrawerMode = "product" | "aplus";

interface SectionMeta {
  id: number;
  index: number;
  aspectClass: string;
  fallbackPrompt: string;
}

const PRODUCT_META: SectionMeta[] = [
  { id: 1, index: 1, aspectClass: "aspect-square",  fallbackPrompt: "Professional hero product shot on clean white background" },
  { id: 2, index: 2, aspectClass: "aspect-square",  fallbackPrompt: "Lifestyle product image showing real-world usage context" },
  { id: 3, index: 3, aspectClass: "aspect-square",  fallbackPrompt: "Close-up ingredient or material highlight shot" },
  { id: 4, index: 4, aspectClass: "aspect-square",  fallbackPrompt: "Product infographic highlighting key features and benefits" },
  { id: 5, index: 5, aspectClass: "aspect-square",  fallbackPrompt: "Clean packaging presentation and unboxing shot" },
  { id: 6, index: 6, aspectClass: "aspect-square",  fallbackPrompt: "Additional product angle showing detail and quality" },
  { id: 7, index: 7, aspectClass: "aspect-square",  fallbackPrompt: "Close-up material texture and quality detail shot" },
];

const APLUS_META: SectionMeta[] = [
  { id: 101, index: 1, aspectClass: "aspect-[21/9]", fallbackPrompt: "Wide brand story narrative banner image" },
  { id: 102, index: 2, aspectClass: "aspect-[21/9]", fallbackPrompt: "Product feature and benefits banner image" },
  { id: 103, index: 3, aspectClass: "aspect-[21/9]", fallbackPrompt: "Full-width lifestyle scene banner image" },
  { id: 104, index: 4, aspectClass: "aspect-[21/9]", fallbackPrompt: "Product range and cross-sell banner" },
  { id: 105, index: 5, aspectClass: "aspect-[21/9]", fallbackPrompt: "Customer review and trust signal banner image" },
];

interface LocalSectionState {
  isGenerating: boolean;
  isEditing: boolean;
  editPrompt: string;
  detailsExpanded: boolean;
  zoomLevel: number;
  /** Single free-text area shown to user; built from structured fields, parsed back on generate */
  detailsText: string;
}

// ── Utilities ─────────────────────────────────────────────────────────────

function resolveDisplayUrl(imageUrl: string, imageBase64: string, format: string): string {
  if (imageUrl) return imageUrl;
  if (imageBase64) return `data:image/${format || "png"};base64,${imageBase64}`;
  return "";
}

function getBackendItem(
  index: number,
  parsedSections: ImageGuidelineItem[] | AplusBannerItem[],
): ImageGuidelineItem | AplusBannerItem | undefined {
  return parsedSections.find((p) =>
    "image_number" in p ? p.image_number === index : p.banner_number === index,
  );
}

const NA_VALUES = new Set(["n/a", "na", "none", "null", ""]);
function isBlank(v: string) { return NA_VALUES.has(v.trim().toLowerCase()); }

/**
 * Converts structured backend fields into a human-readable textarea string.
 * Only includes fields that have real content — skips N/A, None, empty.
 *
 * Format:
 *   Headline: <value>
 *   Sub-headline: <value>
 *   Scene: <value>
 *   Labels:
 *   - label one
 *   - label two
 */
function buildDetailsText(
  index: number,
  parsedSections: ImageGuidelineItem[] | AplusBannerItem[],
): string {
  const item = getBackendItem(index, parsedSections);
  if (!item) return "";

  const lines: string[] = [];

  if ("image_number" in item) {
    if (!isBlank(item.headline))    lines.push(`Headline: ${item.headline}`);
    if (!isBlank(item.subheadline)) lines.push(`Sub-headline: ${item.subheadline}`);
    if (!isBlank(item.description)) lines.push(`Scene: ${item.description}`);
    const validLabels = (item.labels ?? []).filter((l) => !isBlank(l));
    if (validLabels.length) {
      lines.push("Labels:");
      validLabels.forEach((l) => lines.push(`- ${l}`));
    }
  } else {
    if (!isBlank(item.headline)) lines.push(`Headline: ${item.headline}`);
    const overlayParts = item.overlay_text.split(/[|,]/).map((s) => s.trim()).filter((s) => !isBlank(s));
    const allLabels    = [...overlayParts, ...item.bullet_points.filter((b) => !isBlank(b))];
    if (allLabels.length) {
      lines.push("Labels:");
      allLabels.forEach((l) => lines.push(`- ${l}`));
    }
  }

  return lines.join("\n");
}

/**
 * Parses the textarea back into structured fields used to patch the prompt.
 */
interface ParsedDetails {
  headline: string;
  subheadline: string;
  description: string;
  labels: string[];
}

function parseDetailsText(text: string): ParsedDetails {
  const result: ParsedDetails = { headline: "", subheadline: "", description: "", labels: [] };
  const lines = text.split("\n");
  let inLabels = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^headline:\s*/i.test(line)) {
      result.headline = line.replace(/^headline:\s*/i, "").trim();
      inLabels = false;
    } else if (/^sub-?headline:\s*/i.test(line)) {
      result.subheadline = line.replace(/^sub-?headline:\s*/i, "").trim();
      inLabels = false;
    } else if (/^scene:\s*/i.test(line)) {
      result.description = line.replace(/^scene:\s*/i, "").trim();
      inLabels = false;
    } else if (/^labels?:?\s*$/i.test(line)) {
      inLabels = true;
    } else if (inLabels && /^[-•*]\s*/.test(line)) {
      result.labels.push(line.replace(/^[-•*]\s*/, "").trim());
    } else if (!inLabels && result.description) {
      // Multi-line scene description
      result.description += " " + line;
    }
  }

  return result;
}

/**
 * Splices parsed user edits back into the original NanoBanana prompt.
 * The raw prompt is never shown — only the structured textarea is.
 */
function buildGenerationPrompt(
  detailsText: string,
  index: number,
  parsedSections: ImageGuidelineItem[] | AplusBannerItem[],
  fallback: string,
): string {
  const item = getBackendItem(index, parsedSections);
  if (!item) return fallback;

  const parsed = parseDetailsText(detailsText);
  let base = item.nano_banana_arguments.prompt;

  if (parsed.headline)
    base = base.replace(/- Headline:\s*"[^"]*"/, `- Headline: "${parsed.headline}"`);

  if (parsed.subheadline)
    base = base.replace(/- Sub Headline:\s*"[^"]*"/, `- Sub Headline: "${parsed.subheadline}"`);

  if (parsed.description)
    base = base.replace(/SCENE:\s*([\s\S]*?)(\n\nMOOD)/, `SCENE: ${parsed.description}$2`);

  if (parsed.labels.length) {
    const labelBlock = parsed.labels.map((l, i) => `     ${i + 1}. ${l}`).join("\n");
    base = base.replace(
      /(- Labels:\s*\n)([\s\S]*?)(\n\s*(?:[A-Z]|$))/,
      (_m, prefix, _old, suffix) => `${prefix}${labelBlock}${suffix}`,
    );
  }

  return base;
}

function resolveCardTitle(
  index: number,
  parsedSections: ImageGuidelineItem[] | AplusBannerItem[],
): string {
  return getBackendItem(index, parsedSections)?.title || `Image ${index}`;
}

// ── Component ─────────────────────────────────────────────────────────────

export interface ImageGenerationDrawerProps {
  mode: DrawerMode;
  open: boolean;
  onClose: () => void;
}

export function ImageGenerationDrawer({ mode, open, onClose }: ImageGenerationDrawerProps) {
  const meta     = mode === "product" ? PRODUCT_META : APLUS_META;
  const imageType: ImageGenerationRequest["image_type"] = mode === "product" ? "product" : "banner";

  const imageGuidelines = useCatalogStore((s) => s.imageGuidelines);
  const aplusBriefs     = useCatalogStore((s) => s.aplusBriefs);
  const parsedSections  = (mode === "product" ? imageGuidelines : aplusBriefs) as
    | ImageGuidelineItem[] | AplusBannerItem[];

  const images   = useCatalogStore((s) => mode === "product" ? s.generatedImages : s.generatedBanners);
  const setImage = useCatalogStore((s) => mode === "product" ? s.setGeneratedImage : s.setGeneratedBanner);

  const { generateImage, editImage } = useCatalogOperations();

  const baseImage     = useCatalogStore((s) => mode === "product" ? s.baseProductImage : s.baseBannerImage);
  const setStoreImage = useCatalogStore((s) => mode === "product" ? s.setBaseProductImage : s.setBaseBannerImage);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const [basePreviewUrl, setBasePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (baseImage) {
      const url = URL.createObjectURL(baseImage);
      setBasePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBasePreviewUrl(null);
  }, [baseImage]);

  const [sectionState, setSectionState] = useState<Record<number, LocalSectionState>>(() =>
    Object.fromEntries(
      meta.map((s) => [s.id, {
        isGenerating: false, isEditing: false, editPrompt: "",
        detailsExpanded: false, zoomLevel: 1, detailsText: "",
      }]),
    ),
  );

  // Seed detailsText when backend data arrives
  useEffect(() => {
    if (!parsedSections.length) return;
    setSectionState((prev) =>
      Object.fromEntries(
        meta.map((s) => [s.id, {
          ...prev[s.id],
          detailsText: buildDetailsText(s.index, parsedSections),
        }]),
      ),
    );
  }, [parsedSections]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchSection = useCallback((id: number, patch: Partial<LocalSectionState>) =>
    setSectionState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } })), []);

  const [previewId, setPreviewId]     = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = useCallback(async (section: SectionMeta) => {
    if (!baseImage) return;
    patchSection(section.id, { isGenerating: true });
    const { detailsText } = sectionState[section.id];
    const prompt = buildGenerationPrompt(detailsText, section.index, parsedSections, section.fallbackPrompt);
    const result = await generateImage({
      base_image: baseImage, prompt, image_type: imageType, image_number: section.id,
    } satisfies ImageGenerationRequest);
    patchSection(section.id, { isGenerating: false });
    if (result.success && result.data) {
      const url = resolveDisplayUrl(result.data.image_url, result.data.image_base64, result.data.format);
      if (url) setImage(section.id, url);
    }
  }, [baseImage, imageType, sectionState, parsedSections, generateImage, patchSection, setImage]);

  const handleEdit = useCallback(async (section: SectionMeta) => {
    const imageUrl   = images[section.id];
    const editPrompt = sectionState[section.id]?.editPrompt;
    if (!imageUrl || !editPrompt?.trim()) return;
    patchSection(section.id, { isEditing: true });
    const result = await editImage({
      image_url: imageUrl, edit_prompt: editPrompt, image_type: imageType,
    } satisfies ImageEditRequest);
    patchSection(section.id, { isEditing: false, editPrompt: "" });
    if (result.success && result.data) {
      const url = resolveDisplayUrl(result.data.image_url, result.data.image_base64, result.data.format);
      if (url) setImage(section.id, url);
    }
  }, [images, sectionState, imageType, editImage, patchSection, setImage]);

  const handleExport = useCallback(async () => {
    const generated = meta.filter((s) => images[s.id]);
    if (!generated.length) return;
    setIsExporting(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const s of generated) {
        const src = images[s.id];
        src.startsWith("data:")
          ? zip.file(`image-${s.index}.png`, src.split(",")[1], { base64: true })
          : zip.file(`image-${s.index}.png`, await (await fetch(src)).blob());
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url  = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), { href: url, download: `${mode}-images.zip` }).click();
      URL.revokeObjectURL(url);
    } finally { setIsExporting(false); }
  }, [images, meta, mode]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const hasGuidelinesLoaded = parsedSections.length > 0;
  const generatedCount      = meta.filter((s) => images[s.id]).length;
  const previewSection      = previewId != null ? meta.find((s) => s.id === previewId) ?? null : null;

  const accentIcon   = mode === "product" ? "text-blue-600"                 : "text-violet-600";
  const accentBg     = mode === "product" ? "bg-blue-50"                    : "bg-violet-50";
  const accentBtn    = mode === "product" ? "bg-blue-600 hover:bg-blue-700" : "bg-violet-600 hover:bg-violet-700";
  const accentBorder = mode === "product" ? "border-blue-200 focus:ring-blue-100 focus:border-blue-300" : "border-violet-200 focus:ring-violet-100 focus:border-violet-300";

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" style={{ zIndex: 9998 }} onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full max-w-6xl bg-white shadow-2xl flex flex-col" style={{ zIndex: 9999 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${accentBg}`}>
              <ImageIcon className={`w-4 h-4 ${accentIcon}`} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {mode === "product" ? "Product Images" : "A+ Content Images"}
              </h2>
              <p className="text-xs text-slate-500">
                {generatedCount} of {meta.length} generated
                {hasGuidelinesLoaded && <span className={`ml-2 font-medium ${accentIcon}`}>· AI prompts loaded</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={handleExport} disabled={isExporting || generatedCount === 0} className="h-8 text-xs">
              {isExporting ? <Loader className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
              Export ZIP
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Base image upload */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          {baseImage && basePreviewUrl ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-white">
                <img src={basePreviewUrl} alt="Base" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{baseImage.name}</p>
                <p className="text-[11px] text-slate-400">{(baseImage.size / 1024).toFixed(0)} KB · base image</p>
              </div>
              <button onClick={() => { setStoreImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-1 rounded hover:bg-slate-200 transition-colors">
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 hover:bg-white transition-colors text-left">
              <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-600">Upload base product image</p>
                <p className="text-[11px] text-slate-400">PNG, JPG, WEBP · used as reference for generation</p>
              </div>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setStoreImage(e.target.files?.[0] ?? null)} />
        </div>

        {!hasGuidelinesLoaded && (
          <div className="mx-6 mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 flex gap-2 flex-shrink-0">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Generate a catalog first to load AI-crafted image details.
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!baseImage && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 mb-4">
              Upload a base product image above to enable generation.
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {meta.map((section) => {
              const imageUrl  = images[section.id];
              const state     = sectionState[section.id];
              const hasImage  = !!imageUrl;
              const cardTitle = resolveCardTitle(section.index, parsedSections);
              const hasDetails = !!state.detailsText.trim();

              return (
                <div key={section.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">

                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">
                      <span className="text-slate-400 font-normal text-xs mr-1.5">{section.index}.</span>
                      {cardTitle}
                    </p>
                    <div className="flex items-center gap-2">
                      {hasImage && (
                        <button onClick={() => setPreviewId(section.id)} className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2">
                          Preview
                        </button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(section)}
                        disabled={state.isGenerating || !baseImage}
                        className={`h-7 text-xs px-3 ${accentBtn} text-white disabled:opacity-50`}
                      >
                        {state.isGenerating
                          ? <><Loader className="w-3 h-3 mr-1 animate-spin" />Generating</>
                          : <><Sparkles className="w-3 h-3 mr-1" />{hasImage ? "Regenerate" : "Generate"}</>}
                      </Button>
                    </div>
                  </div>

                  {/* Single editable textarea section */}
                  <div className="px-4 pt-3 pb-2 border-b border-slate-100">
                    {hasDetails ? (
                      <>
                        <button
                          onClick={() => patchSection(section.id, { detailsExpanded: !state.detailsExpanded })}
                          className={`flex items-center gap-1 text-[11px] font-semibold mb-2 transition-colors ${accentIcon}`}
                        >
                          {state.detailsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {state.detailsExpanded ? "Hide details" : "Edit image details"}
                        </button>

                        {state.detailsExpanded ? (
                          <textarea
                            value={state.detailsText}
                            onChange={(e) => patchSection(section.id, { detailsText: e.target.value })}
                            rows={Math.min(12, Math.max(4, state.detailsText.split("\n").length + 1))}
                            className={`w-full text-xs text-slate-700 bg-white border rounded-lg px-3 py-2 resize-none leading-relaxed
                              placeholder:text-slate-300 focus:outline-none focus:ring-1 transition-colors ${accentBorder}`}
                            spellCheck={false}
                            placeholder={"Headline: ...\nSub-headline: ...\nScene: ...\nLabels:\n- label one\n- label two"}
                          />
                        ) : (
                          /* Collapsed — first meaningful line as teaser */
                          <p
                            className="text-[11px] text-slate-400 truncate cursor-pointer hover:text-slate-600 transition-colors pb-1"
                            onClick={() => patchSection(section.id, { detailsExpanded: true })}
                          >
                            {state.detailsText.split("\n").find((l) => l.trim()) ?? "Click to edit"}
                          </p>
                        )}
                      </>
                    ) : (
                      /* No backend data — always show the textarea open */
                      <textarea
                        value={state.detailsText}
                        onChange={(e) => patchSection(section.id, { detailsText: e.target.value })}
                        rows={4}
                        className={`w-full text-xs text-slate-700 bg-white border rounded-lg px-3 py-2 resize-none leading-relaxed
                          placeholder:text-slate-300 focus:outline-none focus:ring-1 transition-colors ${accentBorder}`}
                        spellCheck={false}
                        placeholder={"Headline: ...\nSub-headline: ...\nScene: ...\nLabels:\n- label one\n- label two"}
                      />
                    )}
                  </div>

                  {/* Thumbnail + edit row */}
                  <div className="px-4 py-3 space-y-3 flex-1">
                    {hasImage ? (
                      <>
                        <button className="block w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 hover:border-slate-300 transition-colors" onClick={() => setPreviewId(section.id)}>
                          <img src={imageUrl} alt={cardTitle} className={`w-full object-cover ${section.aspectClass}`} />
                        </button>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={state.editPrompt}
                            onChange={(e) => patchSection(section.id, { editPrompt: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") handleEdit(section); }}
                            placeholder="Describe an edit (e.g. brighter background, remove shadow)…"
                            className="flex-1 h-8 px-3 text-xs border border-slate-200 rounded-md bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
                          />
                          <Button size="sm"  onClick={() => handleEdit(section)} disabled={state.isEditing || !state.editPrompt.trim()} className="h-8 text-xs px-3 bg-green-700  border-slate-300">
                            {state.isEditing ? <Loader className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className={`w-full rounded-lg border border-dashed border-slate-200 ${section.aspectClass} bg-slate-50 flex items-center justify-center`}>
                        <p className="text-xs text-slate-300">No image yet</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {previewSection && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-6" onClick={() => setPreviewId(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-900">{resolveCardTitle(previewSection.index, parsedSections)}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
                  <button className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-600" onClick={() => patchSection(previewSection.id, { zoomLevel: Math.max(0.5, (sectionState[previewSection.id]?.zoomLevel ?? 1) - 0.25) })}>
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs text-slate-600 font-medium tabular-nums">
                    {Math.round((sectionState[previewSection.id]?.zoomLevel ?? 1) * 100)}%
                  </span>
                  <button className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-600" onClick={() => patchSection(previewSection.id, { zoomLevel: Math.min(3, (sectionState[previewSection.id]?.zoomLevel ?? 1) + 0.25) })}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => setPreviewId(null)} className="p-1.5 rounded-md hover:bg-slate-100">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="p-6 bg-slate-50 overflow-auto flex justify-center max-h-[70vh]">
              <img
                src={images[previewSection.id]}
                alt={resolveCardTitle(previewSection.index, parsedSections)}
                className="rounded-lg object-contain max-w-full"
                style={{ transform: `scale(${sectionState[previewSection.id]?.zoomLevel ?? 1})`, transformOrigin: "top center" }}
              />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}