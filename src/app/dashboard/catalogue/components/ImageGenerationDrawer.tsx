"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Download, Loader, Plus, Minus, Pencil, ImageIcon, Sparkles, Upload, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCatalogStore } from "@/lib/hooks/queries/use-catalog-store"
import { useCatalogOperations } from "@/lib/hooks/use-catalogue-operations"
import type { ImageGenerationRequest, ImageEditRequest } from "@/app/dashboard/catalogue/lib/types"
import type { ParsedImageSection } from "@/app/dashboard/catalogue/lib/parse-image-guidelines"

export type DrawerMode = "product" | "aplus"

// Static section metadata — labels, aspect ratios, fallback prompts
// Indices match ParsedImageSection.index (1-based)
interface SectionMeta {
  id: number           // passed as image_number to API
  index: number        // matches ParsedImageSection.index
  label: string
  aspectClass: string
  fallbackPrompt: string
}

const PRODUCT_META: SectionMeta[] = [
  { id: 1, index: 1, label: "Hero Image",           aspectClass: "aspect-square",  fallbackPrompt: "Professional hero product shot on clean white background" },
  { id: 2, index: 2, label: "Lifestyle Image",      aspectClass: "aspect-square",  fallbackPrompt: "Lifestyle product image showing real-world usage context" },
  { id: 3, index: 3, label: "Ingredient Highlight", aspectClass: "aspect-square",  fallbackPrompt: "Close-up ingredient or material highlight shot" },
  { id: 4, index: 4, label: "Infographic",          aspectClass: "aspect-square",  fallbackPrompt: "Product infographic highlighting key features and benefits" },
  { id: 5, index: 5, label: "Packaging Shot",       aspectClass: "aspect-square",  fallbackPrompt: "Clean packaging presentation and unboxing shot" },
  { id: 6, index: 6, label: "Secondary Gallery",    aspectClass: "aspect-square",  fallbackPrompt: "Additional product angle showing detail and quality" },
  { id: 7, index: 7, label: "Texture / Swatch",     aspectClass: "aspect-square",  fallbackPrompt: "Close-up material texture and quality detail shot" },
]

const APLUS_META: SectionMeta[] = [
  { id: 101, index: 1, label: "Hero Brand Banner",   aspectClass: "aspect-[16/5]",  fallbackPrompt: "Wide brand story narrative banner image" },
  { id: 102, index: 2, label: "Feature Deep Dive",   aspectClass: "aspect-[16/7]",  fallbackPrompt: "Product feature and benefits banner image" },
  { id: 103, index: 3, label: "Lifestyle Banner",    aspectClass: "aspect-[16/5]",  fallbackPrompt: "Full-width lifestyle scene banner image" },
  { id: 104, index: 4, label: "Product Ecosystem",   aspectClass: "aspect-[4/3]",   fallbackPrompt: "Product range and cross-sell banner" },
  { id: 105, index: 5, label: "Proof & Trust",       aspectClass: "aspect-[16/7]",  fallbackPrompt: "Customer review and trust signal banner image" },
]

interface LocalSectionState {
  isGenerating: boolean
  isEditing: boolean
  editPrompt: string
  zoomLevel: number
  showPrompt: boolean
}

interface ImageGenerationDrawerProps {
  mode: DrawerMode
  open: boolean
  onClose: () => void
}

function resolveDisplayUrl(imageUrl: string, imageBase64: string, format: string): string {
  if (imageUrl) return imageUrl
  if (imageBase64) return `data:image/${format || "png"};base64,${imageBase64}`
  return ""
}

export function ImageGenerationDrawer({ mode, open, onClose }: ImageGenerationDrawerProps) {
  const meta = mode === "product" ? PRODUCT_META : APLUS_META
  const imageType: ImageGenerationRequest["image_type"] = mode === "product" ? "product" : "banner"

  // Pull parsed prompts from store
  const imageGuidelines = useCatalogStore((s) => s.imageGuidelines)
  const aplusBriefs     = useCatalogStore((s) => s.aplusBriefs)
  const parsedSections  = mode === "product" ? imageGuidelines : aplusBriefs

  const images   = useCatalogStore((s) => mode === "product" ? s.generatedImages  : s.generatedBanners)
  const setImage = useCatalogStore((s) => mode === "product" ? s.setGeneratedImage : s.setGeneratedBanner)

  const { generateImage, editImage } = useCatalogOperations()

  const baseImage = useCatalogStore((s) => mode === "product" ? s.baseProductImage : s.baseBannerImage)
  const setStoreImage = useCatalogStore((s) => mode === "product" ? s.setBaseProductImage : s.setBaseBannerImage)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [basePreviewUrl, setBasePreviewUrl] = useState<string | null>(null)


  useEffect(() => {
    if (baseImage) {
      const url = URL.createObjectURL(baseImage)
      setBasePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setBasePreviewUrl(null)
    }
  }, [baseImage])

  const [sectionState, setSectionState] = useState<Record<number, LocalSectionState>>(() =>
    Object.fromEntries(
      meta.map((s) => [s.id, { isGenerating: false, isEditing: false, editPrompt: "", zoomLevel: 1, showPrompt: false }])
    )
  )
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const patchSection = useCallback((id: number, patch: Partial<LocalSectionState>) => {
    setSectionState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  // Resolve the prompt for a section: parsed from catalog, else fallback
  const resolvePrompt = useCallback((section: SectionMeta): string => {
    const parsed: ParsedImageSection | undefined = parsedSections.find(p => p.index === section.index)
    return parsed?.fullPrompt?.trim() || section.fallbackPrompt
  }, [parsedSections])

  const resolveDescription = useCallback((section: SectionMeta): string | undefined => {
    const parsed: ParsedImageSection | undefined = parsedSections.find(p => p.index === section.index)
    return parsed?.headline || undefined
  }, [parsedSections])

  const handleBaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setStoreImage(file)
  }

  const clearBaseImage = () => {
    setStoreImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleGenerate = useCallback(async (section: SectionMeta) => {
    if (!baseImage) return
    patchSection(section.id, { isGenerating: true })

    const result = await generateImage({
      base_image: baseImage,
      prompt: resolvePrompt(section),
      image_type: imageType,
      image_number: section.id,
    } satisfies ImageGenerationRequest)

    patchSection(section.id, { isGenerating: false })
    if (result.success && result.data) {
      const url = resolveDisplayUrl(result.data.image_url, result.data.image_base64, result.data.format)
      if (url) setImage(section.id, url)
    }
  }, [baseImage, imageType, generateImage, patchSection, resolvePrompt, setImage])

  const handleEdit = useCallback(async (section: SectionMeta) => {
    const imageUrl = images[section.id]
    const editPrompt = sectionState[section.id]?.editPrompt
    if (!imageUrl || !editPrompt?.trim()) return

    patchSection(section.id, { isEditing: true })

    const result = await editImage({
      image_url: imageUrl,
      edit_prompt: editPrompt,
      image_type: imageType,
    } satisfies ImageEditRequest)

    patchSection(section.id, { isEditing: false, editPrompt: "" })
    if (result.success && result.data) {
      const url = resolveDisplayUrl(result.data.image_url, result.data.image_base64, result.data.format)
      if (url) setImage(section.id, url)
    }
  }, [images, sectionState, imageType, editImage, patchSection, setImage])

  const handleExport = useCallback(async () => {
    const generated = meta.filter((s) => images[s.id])
    if (!generated.length) return
    setIsExporting(true)
    try {
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()
      for (const section of generated) {
        const src = images[section.id]
        const fileName = `${section.label.replace(/\s+/g, "-").toLowerCase()}.png`
        if (src.startsWith("data:")) {
          zip.file(fileName, src.split(",")[1], { base64: true })
        } else {
          zip.file(fileName, await (await fetch(src)).blob())
        }
      }
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement("a"), { href: url, download: `${mode}-images.zip` })
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }, [images, meta, mode])

  const hasGuidelinesLoaded = parsedSections.length > 0
  const previewSection = previewId !== null ? meta.find((s) => s.id === previewId) ?? null : null
  const generatedCount = meta.filter((s) => images[s.id]).length

  const accentBg   = mode === "product" ? "bg-blue-50"                    : "bg-violet-50"
  const accentIcon = mode === "product" ? "text-blue-600"                 : "text-violet-600"
  const accentBtn  = mode === "product" ? "bg-blue-600 hover:bg-blue-700" : "bg-violet-600 hover:bg-violet-700"

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <>
      {/* Backdrop — rendered outside component tree, no inherited styles */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      <div
        data-no-highlight="true"
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        style={{
          zIndex: 9999,
          isolation: "isolate",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >

        {/* ── Header ── */}
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
                {hasGuidelinesLoaded && (
                  <span className={`ml-2 font-medium ${accentIcon}`}>· AI prompts loaded</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={handleExport}
              disabled={isExporting || generatedCount === 0}
              className="h-8 text-xs border-slate-300"
            >
              {isExporting
                ? <Loader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                : <Download className="w-3.5 h-3.5 mr-1.5" />}
              Export ZIP
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* ── Base image upload ── */}
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
              <button onClick={clearBaseImage} className="p-1 rounded hover:bg-slate-200 transition-colors">
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 hover:bg-white transition-colors text-left"
            >
              <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-600">Upload base product image</p>
                <p className="text-[11px] text-slate-400">PNG, JPG, WEBP · used as reference for generation</p>
              </div>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleBaseImageChange} />
        </div>

        {/* ── No catalog warning ── */}
        {!hasGuidelinesLoaded && (
          <div className="mx-6 mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 flex gap-2 flex-shrink-0">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Generate a catalog first to load AI-crafted prompts. Generic prompts will be used until then.
          </div>
        )}

        {/* ── Section list ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!baseImage && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              Upload a base product image above to enable generation.
            </div>
          )}

          {meta.map((section) => {
            const imageUrl  = images[section.id]
            const state     = sectionState[section.id]
            const hasImage  = !!imageUrl
            const parsed    = parsedSections.find(p => p.index === section.index)
            const prompt    = resolvePrompt(section)
            const headline  = resolveDescription(section)

            return (
              <div key={section.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">

                {/* Section header */}
                <div className="flex items-start justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{section.label}</p>
                      {parsed && (
                        <button
                          onClick={() => patchSection(section.id, { showPrompt: !state.showPrompt })}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                            state.showPrompt
                              ? `${accentBg} ${accentIcon}`
                              : "bg-slate-100 text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          prompt
                        </button>
                      )}
                    </div>
                    {headline && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{headline}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasImage && (
                      <button
                        onClick={() => setPreviewId(section.id)}
                        className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
                      >
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

                {/* Expandable prompt preview */}
                {state.showPrompt && prompt && (
                  <div className={`px-4 py-2.5 border-b border-slate-100 ${accentBg}`}>
                    <p className={`text-[11px] font-medium mb-1 ${accentIcon}`}>Prompt being sent to API</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{prompt}</p>
                    {parsed?.labels && parsed.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {parsed.labels.map((label, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Thumbnail + edit row */}
                {hasImage && (
                  <div className="px-4 py-3 space-y-3">
                    <button
                      className="block w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 hover:border-slate-300 transition-colors"
                      onClick={() => setPreviewId(section.id)}
                    >
                      <img src={imageUrl} alt={section.label} className={`w-full object-cover ${section.aspectClass}`} />
                    </button>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={state.editPrompt}
                        onChange={(e) => patchSection(section.id, { editPrompt: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") handleEdit(section) }}
                        placeholder="Describe edits (e.g. brighter background, remove shadow)…"
                        className="flex-1 h-8 px-3 text-xs border border-slate-200 rounded-md bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
                      />
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleEdit(section)}
                        disabled={state.isEditing || !state.editPrompt.trim()}
                        className="h-8 text-xs px-3 border-slate-300"
                      >
                        {state.isEditing ? <Loader className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {previewSection && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-900">{previewSection.label}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-600"
                    onClick={() => patchSection(previewSection.id, {
                      zoomLevel: Math.max(0.5, (sectionState[previewSection.id]?.zoomLevel ?? 1) - 0.25),
                    })}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs text-slate-600 font-medium tabular-nums">
                    {Math.round((sectionState[previewSection.id]?.zoomLevel ?? 1) * 100)}%
                  </span>
                  <button
                    className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-600"
                    onClick={() => patchSection(previewSection.id, {
                      zoomLevel: Math.min(3, (sectionState[previewSection.id]?.zoomLevel ?? 1) + 0.25),
                    })}
                  >
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
                alt={previewSection.label}
                className="rounded-lg object-contain max-w-full"
                style={{
                  transform: `scale(${sectionState[previewSection.id]?.zoomLevel ?? 1})`,
                  transformOrigin: "top center",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}