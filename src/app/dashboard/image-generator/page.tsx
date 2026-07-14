"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  Upload, Sparkles, Download, Pencil, X, Loader2,
  ImageIcon, ZoomIn, ZoomOut, Trash2, Wand2, Package,
  Plus, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  useImageGeneratorStore,
  type ImageGenMode,
} from "@/lib/hooks/queries/use-image-generator-store";
import { useImageGeneratorOperations } from "@/lib/hooks/use-image-generator-operations";
import type {
  ImageGenerationRequest,
  ImageEditRequest,
} from "@/app/dashboard/catalogue/lib/types";

function resolveDisplayUrl(imageUrl: string, imageBase64: string, format: string): string {
  if (imageUrl) return imageUrl;
  if (imageBase64) return `data:image/${format || "png"};base64,${imageBase64}`;
  return "";
}

const MODE_META: Record<ImageGenMode, { label: string; aspect: string; accent: string; accentSoft: string; accentText: string; placeholder: string }> = {
  product: {
    label: "Product",
    aspect: "aspect-square",
    accent: "#22D3EE",
    accentSoft: "rgba(34,211,238,0.12)",
    accentText: "text-cyan-400",
    placeholder: "Professional hero shot on a clean white background, soft studio lighting, sharp focus on the product…",
  },
  aplus: {
    label: "A+ Banner",
    aspect: "aspect-[21/9]",
    accent: "#A78BFA",
    accentSoft: "rgba(167,139,250,0.12)",
    accentText: "text-violet-400",
    placeholder: "Wide lifestyle scene with the product in use, warm natural light, space left for a headline overlay…",
  },
};

export default function ImageGeneratorPage() {
  const { toast } = useToast();
  const { generateImage, editImage } = useImageGeneratorOperations();

  const mode = useImageGeneratorStore((s) => s.mode);
  const setMode = useImageGeneratorStore((s) => s.setMode);
  const baseImage = useImageGeneratorStore((s) => s.baseImage);
  const setBaseImage = useImageGeneratorStore((s) => s.setBaseImage);
  const promptByMode = useImageGeneratorStore((s) => s.promptByMode);
  const setPrompt = useImageGeneratorStore((s) => s.setPrompt);
  const editPrompt = useImageGeneratorStore((s) => s.editPrompt);
  const setEditPrompt = useImageGeneratorStore((s) => s.setEditPrompt);
  const results = useImageGeneratorStore((s) => s.results);
  const activeResultId = useImageGeneratorStore((s) => s.activeResultId);
  const setActiveResultId = useImageGeneratorStore((s) => s.setActiveResultId);
  const removeResult = useImageGeneratorStore((s) => s.removeResult);
  const isGenerating = useImageGeneratorStore((s) => s.isGenerating);
  const setIsGenerating = useImageGeneratorStore((s) => s.setIsGenerating);
  const isEditing = useImageGeneratorStore((s) => s.isEditing);
  const setIsEditing = useImageGeneratorStore((s) => s.setIsEditing);
  const addResult = useImageGeneratorStore((s) => s.addResult);
  const consumeCounter = useImageGeneratorStore((s) => s.consumeCounter);

  const meta = MODE_META[mode];
  const imageType: ImageGenerationRequest["image_type"] = mode === "product" ? "product" : "banner";
  const prompt = promptByMode[mode];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [basePreviewUrl, setBasePreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Controls whether the "compose a new prompt" textarea is shown, or whether
  // we're just viewing/refining the current active result for this mode.
  const [showComposer, setShowComposer] = useState(true);

  useEffect(() => {
    if (baseImage) {
      const url = URL.createObjectURL(baseImage);
      setBasePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBasePreviewUrl(null);
  }, [baseImage]);

  const modeResults = useMemo(
    () => results.filter((r) => r.mode === mode).slice().reverse(),
    [results, mode],
  );
  const hasModeResult = modeResults.length > 0;
  const activeResult = useMemo(
    () => results.find((r) => r.id === activeResultId) ?? null,
    [results, activeResultId],
  );

  // Whenever the mode changes: show the composer if this mode has no results
  // yet, otherwise show the refine view for its most recent result.
  useEffect(() => {
    setShowComposer(!hasModeResult);
    setZoom(1);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // If switching modes and the active result belongs to the other mode, snap to
  // the most recent result for the new mode (or clear the canvas).
  useEffect(() => {
    if (activeResult && activeResult.mode !== mode) {
      const latest = modeResults[0];
      setActiveResultId(latest ? latest.id : null);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the prompt box whenever the composer becomes visible.
  useEffect(() => {
    if (showComposer) {
      promptRef.current?.focus();
    }
  }, [showComposer]);

  const handleGenerate = useCallback(async () => {
    if (!baseImage || !prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    const result = await generateImage({
      base_image: baseImage,
      prompt,
      image_type: imageType,
      image_number: consumeCounter(mode),
    } satisfies ImageGenerationRequest);
    setIsGenerating(false);

    if (result.success && result.data) {
      const url = resolveDisplayUrl(result.data.image_url, result.data.image_base64, result.data.format);
      if (url) {
        addResult(mode, prompt, url);
        setZoom(1);
        setPrompt(mode, "");
        setShowComposer(false);
      }
    } else {
      toast({
        title: "Generation failed",
        description: result.error || "Something went wrong generating this image",
        variant: "destructive",
      });
    }
  }, [baseImage, prompt, isGenerating, imageType, mode, generateImage, addResult, consumeCounter, setPrompt, setIsGenerating, toast]);

  const handleEdit = useCallback(async () => {
    if (!activeResult || !editPrompt.trim() || isEditing) return;
    setIsEditing(true);
    const result = await editImage({
      image_url: activeResult.imageUrl,
      edit_prompt: editPrompt,
      image_type: imageType,
    } satisfies ImageEditRequest);
    setIsEditing(false);

    if (result.success && result.data) {
      const url = resolveDisplayUrl(result.data.image_url, result.data.image_base64, result.data.format);
      if (url) {
        addResult(mode, `${activeResult.prompt} — edited: ${editPrompt}`, url);
        setEditPrompt("");
        setZoom(1);
      }
    } else {
      toast({
        title: "Edit failed",
        description: result.error || "Something went wrong editing this image",
        variant: "destructive",
      });
    }
  }, [activeResult, editPrompt, isEditing, imageType, mode, editImage, addResult, setEditPrompt, setIsEditing, toast]);

  const handleExport = useCallback(async () => {
    if (!modeResults.length) return;
    setIsExporting(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      modeResults.forEach((r, i) => {
        const src = r.imageUrl;
        const name = `${mode}-${modeResults.length - i}.png`;
        if (src.startsWith("data:")) {
          zip.file(name, src.split(",")[1], { base64: true });
        } else {
          zip.file(name, fetch(src).then((res) => res.blob()));
        }
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), { href: url, download: `${mode}-images.zip` }).click();
      URL.revokeObjectURL(url);
      toast({ description: `Downloaded ${modeResults.length} images` });
    } finally {
      setIsExporting(false);
    }
  }, [modeResults, mode, toast]);

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleEdit();
    }
  };

  return (
    <div className="w-full h-full bg-[#0B0E14] text-slate-100 flex overflow-hidden">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scan-line {
          animation: scan 1.6s ease-in-out infinite;
        }

        .thin-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.14) transparent;
        }
        .thin-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .thin-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .thin-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.14);
          border-radius: 9999px;
        }
        .thin-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.24);
        }
      `}</style>

      {/* ── Left panel: controls ────────────────────────────────────────── */}
      <div className="w-[460px] flex-shrink-0 border-r border-white/[0.06] bg-[#0E1119] flex flex-col overflow-y-auto thin-scroll">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/[0.06]">
              <Wand2 className="w-4 h-4 text-slate-200" />
            </div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-100">Image Studio</h1>
          </div>
          <p className="text-[11px] text-slate-500">One base photo, generated into any shot you need.</p>
        </div>

        {/* Mode toggle */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-black/30 border border-white/[0.06]">
            {(Object.keys(MODE_META) as ImageGenMode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-2 rounded-md text-xs font-medium transition-all ${
                    active ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
                  }`}
                  style={active ? { backgroundColor: MODE_META[m].accent } : undefined}
                >
                  {MODE_META[m].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Base image */}
        <div className="px-6 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Base image
          </p>
          {baseImage && basePreviewUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-white/[0.08] bg-black/20 group">
              <img src={basePreviewUrl} alt="Base" className="w-full h-32 object-cover opacity-90" />
              <button
                onClick={() => {
                  setBaseImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 p-1 rounded-md bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              <div className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-[10px] text-white/80 truncate">{baseImage.name}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-lg border border-dashed border-white/[0.12] hover:border-white/[0.25] hover:bg-white/[0.02] transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <p className="text-[11px] text-slate-400">Upload base photo</p>
              <p className="text-[10px] text-slate-600">PNG, JPG, WEBP</p>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => setBaseImage(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* ── Compose: create an image (shown only when composing) ────────── */}
        {showComposer ? (
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {hasModeResult ? "New image" : "Prompt"}
              </p>
              {hasModeResult && (
                <button
                  onClick={() => setShowComposer(false)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to current image
                </button>
              )}
            </div>

            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(mode, e.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={hasModeResult ? "Describe the next image you want to generate…" : meta.placeholder}
              rows={12}
              className="thin-scroll w-full text-sm leading-relaxed text-slate-200 bg-black/20 border border-white/[0.08] rounded-lg px-3.5 py-3 resize-none placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all"
              style={{ minHeight: 280 }}
              spellCheck={false}
            />

            <button
              onClick={handleGenerate}
              disabled={!baseImage || !prompt.trim() || isGenerating}
              className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: meta.accent }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="px-6 pt-5">
            <button
              onClick={() => setShowComposer(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border border-white/[0.1] text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              <Plus className="w-4 h-4" /> Generate New Image
            </button>
            <p className="mt-1.5 text-[10px] text-slate-600 text-center">
              Starts a fresh prompt — your current image is kept in history
            </p>
          </div>
        )}

        {/* ── Refine current image (shown only when NOT composing) ─────────── */}
        {!showComposer && activeResult && (
          <div className="px-6 pt-5 pb-6 mt-5 border-t border-white/[0.06]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Refine this image
            </p>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={handleEditKeyDown}
              placeholder="e.g. brighter background, remove shadow, zoom in on the label…"
              rows={8}
              className="thin-scroll w-full text-sm leading-relaxed text-slate-200 bg-black/20 border border-white/[0.08] rounded-lg px-3.5 py-3 resize-none placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
              style={{ minHeight: 180 }}
              spellCheck={false}
            />
            <button
              onClick={handleEdit}
              disabled={!editPrompt.trim() || isEditing}
              className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 disabled:opacity-30 transition-colors"
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Applying edit…
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" /> Apply Edit
                </>
              )}
            </button>
            <p className="mt-1.5 text-[10px] text-slate-600 text-center">
              Edits this image and saves the result as a new version
            </p>
          </div>
        )}
      </div>

      {/* ── Right panel: canvas + history ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${meta.accentText.replace("text-", "bg-")}`} />
            <p className="text-xs text-slate-400">
              {meta.label} canvas · {modeResults.length} generated
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeResult && (
              <div className="flex items-center gap-1 border border-white/[0.08] rounded-lg overflow-hidden">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 hover:bg-white/[0.06] text-slate-400"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[11px] text-slate-400 tabular-nums">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 hover:bg-white/[0.06] text-slate-400"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={handleExport}
              disabled={isExporting || modeResults.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 disabled:opacity-30 transition-colors"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
              Export ZIP
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto thin-scroll relative">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {isGenerating ? (
            <div className={`relative w-full max-w-xl ${meta.aspect} rounded-xl border border-white/[0.08] bg-black/30 overflow-hidden`}>
              <div
                className="scan-line absolute inset-x-0 h-1/3"
                style={{ background: `linear-gradient(180deg, transparent, ${meta.accentSoft}, transparent)` }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                <p className="text-xs text-slate-500">Generating your image…</p>
              </div>
            </div>
          ) : activeResult && !showComposer ? (
            <img
              src={activeResult.imageUrl}
              alt={activeResult.prompt}
              className="relative rounded-xl max-w-full max-h-full object-contain shadow-2xl"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <div className={`relative w-full max-w-xl ${meta.aspect} rounded-xl border border-dashed border-white/[0.1] flex flex-col items-center justify-center gap-2 text-slate-600`}>
              <ImageIcon className="w-6 h-6" />
              <p className="text-xs">
                {!baseImage
                  ? "Upload a base image to get started"
                  : showComposer
                  ? "Write a prompt and generate to see your image here"
                  : "Nothing generated yet"}
              </p>
            </div>
          )}
        </div>

        {/* History rail */}
        {modeResults.length > 0 && (
          <div className="border-t border-white/[0.06] px-6 py-4">
            <div className="flex gap-3 overflow-x-auto thin-scroll pb-1">
              {modeResults.map((r) => {
                const active = r.id === activeResultId && !showComposer;
                return (
                  <div
                    key={r.id}
                    className="relative flex-shrink-0 group"
                    style={{ width: mode === "product" ? 72 : 128 }}
                  >
                    <button
                      onClick={() => {
                        setActiveResultId(r.id);
                        setShowComposer(false);
                        setZoom(1);
                      }}
                      className={`w-full ${meta.aspect} rounded-md overflow-hidden border-2 transition-colors`}
                      style={{ borderColor: active ? meta.accent : "rgba(255,255,255,0.08)" }}
                    >
                      <img src={r.imageUrl} alt={r.prompt} className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => removeResult(r.id)}
                      className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-black/80 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-slate-300" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}