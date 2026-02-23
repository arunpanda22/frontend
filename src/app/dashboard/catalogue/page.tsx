"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  Copy,
  Zap,
  BarChart3,
  LayoutTemplate,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KeywordsList } from "./components/keywords-list";
import { ContentEditor } from "./components/content-editor";
import { CatalogueForm } from "./components/catalogue-form";
import { KeywordFilterTable } from "./components/keyword-filter-table";
import {
  ImageGenerationDrawer,
  type DrawerMode,
} from "./components/ImageGenerationDrawer";
import { useToast } from "@/components/ui/use-toast";
import { useCatalogStore } from "@/lib/hooks/queries/use-catalog-store";
import { useCatalogOperations } from "@/lib/hooks/use-catalogue-operations";
import { Download, Image, Vrpano } from "@mui/icons-material";

export default function CataloguePage() {
  const { toast } = useToast();
  const { generateCatalog, filterKeywords, optimizeContent } =
    useCatalogOperations();

  const {
    catalogData,
    keywords,
    keywordFilterData,
    isKeywordFiltering,
    isCatalogGenerating,
    isOptimizing,
    title,
    bullets,
    description,
    backendKeywords,
    selectedKeywords,
    catalogueFormState,
    setCatalogueFormState,
    toggleKeywordSelection,
    addSelectedKeywordsToList,
    setKeywords,
    setTitle,
    setBullets,
    setDescription,
    setBackendKeywords,
    setIsOptimizing,
    generatedImages,
    generatedBanners,
  } = useCatalogStore();

  // Local UI state
  const [keywordInput, setKeywordInput] = useState("");
  const [hideUsed, setHideUsed] = useState(false);
  const [showKeywordInput, setShowKeywordInput] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [tableCollapsed, setTableCollapsed] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<DrawerMode | null>(null);

  // ── Derived keyword data ────────────────────────────────────────────────────
  const words = useMemo(() => {
    const wordSet = new Set<string>();
    keywords.forEach((keyword) =>
      keyword
        .toLowerCase()
        .split(/\s+/)
        .forEach((word) => {
          if (word.trim()) wordSet.add(word.trim());
        }),
    );
    return Array.from(wordSet).sort();
  }, [keywords]);

  const allContent = useMemo(
    () => (title + " " + bullets.join(" ") + " " + description).toLowerCase(),
    [title, bullets, description],
  );

  const keywordUsage = useMemo(() => {
    const usage = new Map<string, number>();
    keywords.forEach((keyword) => {
      const count = (
        allContent.match(new RegExp(keyword.toLowerCase(), "g")) || []
      ).length;
      if (count > 0) usage.set(keyword.toLowerCase(), count);
    });
    return usage;
  }, [keywords, allContent]);

  const wordUsage = useMemo(() => {
    const usage = new Map<string, number>();
    words.forEach((word) => {
      const count = (
        allContent.match(new RegExp(`\\b${word.toLowerCase()}\\b`, "g")) || []
      ).length;
      if (count > 0) usage.set(word.toLowerCase(), count);
    });
    return usage;
  }, [words, allContent]);

  const usedKeywords = useMemo(
    () => keywords.filter((k) => keywordUsage.has(k.toLowerCase())),
    [keywords, keywordUsage],
  );
  const unusedKeywords = useMemo(
    () => keywords.filter((k) => !keywordUsage.has(k.toLowerCase())),
    [keywords, keywordUsage],
  );
  const usedWords = useMemo(
    () => words.filter((w) => wordUsage.has(w.toLowerCase())),
    [words, wordUsage],
  );
  const unusedWords = useMemo(
    () => words.filter((w) => !wordUsage.has(w.toLowerCase())),
    [words, wordUsage],
  );

  // ── Image presence flags ────────────────────────────────────────────────────
  const hasProductImages = Object.keys(generatedImages).length > 0;
  const hasAplusImages = Object.keys(generatedBanners).length > 0;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const copyToClipboard = useCallback(
    (items: string[], type: string) => {
      navigator.clipboard.writeText(items.join(", "));
      toast({ description: `Copied ${items.length} ${type} to clipboard` });
    },
    [toast],
  );

  const handleAddKeywords = () => {
    if (keywordInput.trim()) {
      const newKeywords = keywordInput
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k && !keywords.includes(k));
      setKeywords([...keywords, ...newKeywords]);
      setKeywordInput("");
      setShowKeywordInput(false);
    }
  };

  const handleRemoveKeyword = (keyword: string) =>
    setKeywords(keywords.filter((k) => k !== keyword));

  const handleFormSubmit = async (data: FormData) => {
    const asin = data.get("asin") as string;
    const competitorAsins = data.get("competitor_asins") as string;
    const brand = data.get("brand") as string;
    const description = data.get("description") as string;
    const tone = data.get("tone") as string;
    const cerebroFileRaw = data.get("cerebro_file");
    const cerebroFile = cerebroFileRaw instanceof File && cerebroFileRaw.size > 0 
      ? cerebroFileRaw 
      : undefined;

    if (
      !asin ||
      !competitorAsins ||
      !brand ||
      !description ||
      !tone 
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const result = await generateCatalog({
      asin,
      competitor_asins: competitorAsins,
      cerebro_file: cerebroFile, 
      brand,
      description,
      tone,
    });
    if (result.success) {
      toast({
        title: "Success",
        description: "Catalog generated successfully!",
      });
      setFormCollapsed(true);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to generate catalog",
        variant: "destructive",
      });
    }
  };

  const handleKeywordFilter = async () => {
    const { asin, competitorAsins } = catalogueFormState;

    if (!asin) {
      toast({
        title: "Missing ASIN",
        description: "Please enter your product ASIN first",
        variant: "destructive",
      });
      return;
    }

    const result = await filterKeywords({
      asin,
      competitor_asins: competitorAsins,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Keywords fetched successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fetch keywords",
        variant: "destructive",
      });
    }
  };

  const handleAddKeywordsFromTable = (selectedKeywordPhrases: string[]) => {
    addSelectedKeywordsToList();
    toast({ description: `Added ${selectedKeywordPhrases.length} keywords` });
  };

  const handleOptimize = async () => {
    if (keywords.length === 0) {
      toast({
        title: "No keywords",
        description: "Please add keywords to optimize with",
        variant: "destructive",
      });
      return;
    }
    const nonEmptyBullets = bullets.filter((b) => b.trim());
    if (nonEmptyBullets.length === 0 && !description.trim()) {
      toast({
        title: "No content",
        description: "Please add bullet points or description to optimize",
        variant: "destructive",
      });
      return;
    }
    setIsOptimizing(true);
    const result = await optimizeContent({ bullets, description, keywords });
    setIsOptimizing(false);
    if (result.success) {
      toast({
        title: "Content optimized!",
        description:
          "Your bullet points and description have been optimized with keywords",
      });
    } else {
      toast({
        title: "Optimization failed",
        description: result.error || "Failed to optimize content",
        variant: "destructive",
      });
    }
  };

  // ── Download ZIP (content only when no images) ───────────────────────────
  const handleDownload = useCallback(async () => {
    const { default: JSZip } = await import("jszip");
    const { Document, Packer, Paragraph, TextRun, AlignmentType } =
      await import("docx");

    const zip = new JSZip();
    const { catalogData } = useCatalogStore.getState();

    // ── Shared page margins (1 inch all round) ───────────────────────────────
    const pageProps = {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    };

    // ── Heading paragraph ────────────────────────────────────────────────────
    const h1 = (text: string) =>
      new Paragraph({ style: "Heading1", children: [new TextRun(text)] });

    const h2 = (text: string) =>
      new Paragraph({ style: "Heading2", children: [new TextRun(text)] });

    // ── Normal paragraph — supports inline bold via **text** ─────────────────
    const para = (text: string) => {
      if (!text.trim()) return new Paragraph({ style: "Normal", children: [] });

      const runs = text
        .split(/(\*\*[^*]+\*\*)/)
        .map((part) =>
          part.startsWith("**") && part.endsWith("**")
            ? new TextRun({ text: part.replace(/\*\*/g, ""), bold: true })
            : new TextRun(part),
        );
      return new Paragraph({ style: "Normal", children: runs });
    };

    // ── Bullet paragraph (uses Word's built-in ListBullet style) ─────────────
    const bullet = (text: string) =>
      new Paragraph({
        style: "ListBullet",
        children: [
          new TextRun(
            text.replace(/^([•\-\*]|\d+[\.\)])\s+/, "").replace(/\*\*/g, ""),
          ),
        ],
      });

    // ── Blank spacer ─────────────────────────────────────────────────────────
    const blank = () => new Paragraph({ style: "Normal", children: [] });

    // ── Generic markdown-ish parser used for image/aplus text blocks ─────────
    const parseBlock = (text: string) =>
      text.split("\n").map((line) => {
        const t = line.trim();
        if (!t) return blank();
        if (t.startsWith("### ")) return h2(t.replace(/^### /, ""));
        if (t.startsWith("## ")) return h1(t.replace(/^## /, ""));
        if (t.startsWith("# ")) return h1(t.replace(/^# /, ""));
        if (/^[-*•]\s/.test(t)) return bullet(t);
        return para(t);
      });

    // ── 1. Listing content ───────────────────────────────────────────────────
    const listingDoc = new Document({
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 24 } },
        },
      },
      sections: [
        {
          properties: pageProps,
          children: [
            h1("Product Title"),
            blank(),
            para(title || "(empty)"),
            blank(),

            h1("Bullet Points"),
            blank(),
            ...bullets.map((b) => bullet(b || "(empty)")),
            blank(),

            h1("Description"),
            blank(),
            ...parseBlock(description || "(empty)"),
            blank(),

            h1("Backend Keywords"),
            blank(),
            para(backendKeywords || "(empty)"),
          ],
        },
      ],
    });
    zip.file("listing-content.docx", await Packer.toBlob(listingDoc));

    // ── 2. Image guidelines ──────────────────────────────────────────────────
    if (catalogData?.image_guidelines?.images?.length) {
      const children: InstanceType<typeof Paragraph>[] = [
        h1("Image Guidelines"),
        blank(),
      ];

      for (const img of catalogData.image_guidelines.images) {
        children.push(h2(`Image ${img.image_number}: ${img.title}`));
        if (img.headline) children.push(para(`Headline: ${img.headline}`));
        if (img.subheadline)
          children.push(para(`Sub-headline: ${img.subheadline}`));
        if (img.labels?.length) {
          children.push(para("Labels:"));
          img.labels.forEach((l) => children.push(bullet(l)));
        }
        children.push(para("Prompt:"));
        img.nano_banana_arguments.prompt
          .split("\n")
          .forEach((line) => children.push(para(line)));
        children.push(blank());
      }

      const doc = new Document({
        styles: {
          default: { document: { run: { font: "Calibri", size: 24 } } },
        },
        sections: [{ properties: pageProps, children }],
      });
      zip.file("image-guidelines.docx", await Packer.toBlob(doc));
    }

    // ── 3. A+ brief ──────────────────────────────────────────────────────────
    if (catalogData?.a_plus_brief?.banners?.length) {
      const children: InstanceType<typeof Paragraph>[] = [
        h1("A+ Content Brief"),
        blank(),
      ];

      for (const banner of catalogData.a_plus_brief.banners) {
        children.push(h2(`Banner ${banner.banner_number}: ${banner.title}`));
        if (banner.headline)
          children.push(para(`Headline: ${banner.headline}`));
        if (banner.overlay_text)
          children.push(para(`Overlay text: ${banner.overlay_text}`));
        if (banner.bullet_points?.length) {
          children.push(para("Bullet points:"));
          banner.bullet_points.forEach((b) => children.push(bullet(b)));
        }
        if (banner.alt_text)
          children.push(para(`Alt text: ${banner.alt_text}`));
        children.push(para("Prompt:"));
        banner.nano_banana_arguments.prompt
          .split("\n")
          .forEach((line) => children.push(para(line)));
        children.push(blank());
      }

      const doc = new Document({
        styles: {
          default: { document: { run: { font: "Calibri", size: 24 } } },
        },
        sections: [{ properties: pageProps, children }],
      });
      zip.file("aplus-brief.docx", await Packer.toBlob(doc));
    }

    // ── 4. Product images ─────────────────────────────────────────────────────
    if (Object.keys(generatedImages).length > 0) {
      const folder = zip.folder("product-images")!;
      for (const [id, url] of Object.entries(generatedImages)) {
        try {
          folder.file(
            `image-${id}.png`,
            url.startsWith("data:")
              ? url.split(",")[1]
              : await (await fetch(url)).blob(),
            url.startsWith("data:") ? { base64: true } : {},
          );
        } catch {
          /* skip failed */
        }
      }
    }

    // ── 5. A+ banner images ───────────────────────────────────────────────────
    if (Object.keys(generatedBanners).length > 0) {
      const folder = zip.folder("aplus-images")!;
      for (const [id, url] of Object.entries(generatedBanners)) {
        try {
          folder.file(
            `banner-${id}.png`,
            url.startsWith("data:")
              ? url.split(",")[1]
              : await (await fetch(url)).blob(),
            url.startsWith("data:") ? { base64: true } : {},
          );
        } catch {
          /* skip failed */
        }
      }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: `catalogue-${catalogueFormState.asin || "export"}.zip`,
    }).click();
    URL.revokeObjectURL(url);

    toast({
      description: `Downloaded Word documents${hasProductImages || hasAplusImages ? " and images" : ""}`,
    });
  }, [
    title,
    bullets,
    description,
    backendKeywords,
    generatedImages,
    generatedBanners,
    catalogueFormState.asin,
    hasProductImages,
    hasAplusImages,
    toast,
  ]);

  const displayKeywords = hideUsed ? unusedKeywords : keywords;
  const displayWords = hideUsed ? unusedWords : words;

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-700 to-blue-950 shadow-2xl overflow-hidden p-6 lg:p-8 font-montserrat">
      <div className="max-w-8xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Listing Generator</h1>
          </div>
          <p className="text-slate-50">
            Create keyword-optimized product listings in minutes
          </p>
        </div>

        {/* Catalogue Setup */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => setFormCollapsed(!formCollapsed)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  Catalogue Setup
                </h2>
                {isCatalogGenerating && (
                  <span className="text-sm text-cyan-600 animate-pulse">
                    Generating...
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform text-black  ${formCollapsed ? "" : "rotate-180"}`}
              />
            </button>
          </div>
          {!formCollapsed && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Form — 1/3 */}
                <div className="col-span-1">
                  <CatalogueForm
                    formState={catalogueFormState}
                    onFormStateChange={setCatalogueFormState}
                    onSubmit={handleFormSubmit}
                    onKeywordFilter={handleKeywordFilter}
                    isGenerating={isCatalogGenerating}
                    isFiltering={isKeywordFiltering}
                  />
                </div>

                {/* How to use — 2/3 */}
                <div className="col-span-1 border-l border-slate-100 pl-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-widest text-cyan-600">
                        How it works
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      AI-Powered Listing{" "}
                      <span className="text-cyan-600">Generation</span>
                    </h3>
                    <p className="text-slate-500 text-sm mb-8 max-w-lg">
                      Generate fully optimized Amazon listings in seconds. Paste
                      your ASIN, add competitors, upload a Cerebro export, and
                      let the AI do the heavy lifting.
                    </p>

                    <div className="space-y-5">
                      {[
                        {
                          step: "01",
                          title: "Enter Your ASIN & Competitors",
                          desc: "Add your product ASIN and up to 10 competitor ASINs to benchmark against the best in your category.",
                        },
                        {
                          step: "02",
                          title: "Upload a Cerebro File",
                          desc: "Export a keyword report from Helium 10 Cerebro. The AI uses this to identify high-volume, relevant keywords.",
                        },
                        {
                          step: "03",
                          title: "Filter & Select Keywords",
                          desc: "Use the keyword filter to narrow down by search volume. Pick the best phrases to include in your listing.",
                        },
                        {
                          step: "04",
                          title: "Generate & Optimize",
                          desc: "Generate your title, bullet points, and description. Use the real-time editor to track keyword usage and fine-tune.",
                        },
                      ].map(({ step, title, desc }) => (
                        <div key={step} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-cyan-600">
                              {step}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 mb-0.5">
                              {title}
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom stat strip */}
                  {/* <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
                    {[
                      { label: "Avg. Time Saved", value: "3+ hrs", sub: "per listing" },
                      { label: "Keyword Coverage", value: "95%+", sub: "match rate" },
                      { label: "Listing Quality", value: "A10", sub: "algorithm ready" },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className="text-center">
                        <p className="text-xl font-bold text-slate-900">{value}</p>
                        <p className="text-[11px] font-medium text-slate-600">{label}</p>
                        <p className="text-[10px] text-slate-400">{sub}</p>
                      </div>
                    ))}
                  </div> */}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Keyword Filter Results */}
        {keywordFilterData.length > 0 && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <button
                onClick={() => setTableCollapsed(!tableCollapsed)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Keyword Filter Results
                  </h2>
                  {isKeywordFiltering && (
                    <span className="text-sm text-cyan-600 animate-pulse">
                      Loading...
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform text-black ${tableCollapsed ? "" : "rotate-180"}`}
                />
              </button>
            </div>
            {!tableCollapsed && (
              <div className="p-6">
                <KeywordFilterTable
                  data={keywordFilterData}
                  onAddKeywords={handleAddKeywordsFromTable}
                  selectedKeywords={selectedKeywords}
                  onToggleKeyword={toggleKeywordSelection}
                />
              </div>
            )}
          </Card>
        )}

        {isKeywordFiltering && keywordFilterData.length === 0 && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Filtering keywords…</p>
            </div>
          </Card>
        )}

        {/* Words / Phrases / Content Editor */}
        {/* Words / Phrases / Content Editor — only after catalog has been generated */}
        {(title || bullets.some((b) => b.trim()) || description) && (
          <>
            {/* ── Single card wrapping sidebar + editor ── */}
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <div className="grid lg:grid-cols-3 divide-x divide-slate-100 items-start">
                {/* Left sidebar — sticky */}
                <div className="lg:col-span-1 sticky top-6 p-6">
                  <div className="space-y-6">
                    {keywords.length > 0 && (
                      <>
                        {/* Words */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h2 className="text-sm font-semibold text-slate-900">
                                Words
                              </h2>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {usedWords.length} / {words.length} used
                              </p>
                            </div>
                            <BarChart3 className="w-4 h-4 text-cyan-600" />
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                              style={{
                                width: `${(usedWords.length / Math.max(words.length, 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <KeywordsList
                            keywords={displayWords}
                            usage={wordUsage}
                            onRemove={
                              hideUsed
                                ? undefined
                                : (keyword) =>
                                    setKeywords(
                                      keywords.filter(
                                        (k) =>
                                          !k.toLowerCase().includes(keyword),
                                      ),
                                    )
                            }
                          />
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(usedWords, "words")
                              }
                              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-7"
                            >
                              <Copy className="w-3 h-3 mr-1.5" />
                              Used ({usedWords.length})
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(unusedWords, "words")
                              }
                              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-7"
                            >
                              <Copy className="w-3 h-3 mr-1.5" />
                              Unused ({unusedWords.length})
                            </Button>
                          </div>
                        </div>

                        <div className="border-t border-slate-100" />

                        {/* Phrases */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h2 className="text-sm font-semibold text-slate-900">
                                Phrases
                              </h2>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {usedKeywords.length} / {keywords.length} used
                              </p>
                            </div>
                            <BarChart3 className="w-4 h-4 text-cyan-600" />
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-rose-400 rounded-full transition-all"
                              style={{
                                width: `${(usedKeywords.length / Math.max(keywords.length, 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <KeywordsList
                            keywords={displayKeywords}
                            usage={keywordUsage}
                            onRemove={handleRemoveKeyword}
                          />
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(usedKeywords, "phrases")
                              }
                              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-7"
                            >
                              <Copy className="w-3 h-3 mr-1.5" />
                              Used ({usedKeywords.length})
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(unusedKeywords, "phrases")
                              }
                              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-7"
                            >
                              <Copy className="w-3 h-3 mr-1.5" />
                              Unused ({unusedKeywords.length})
                            </Button>
                          </div>
                          <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={hideUsed}
                                onChange={(e) => setHideUsed(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer"
                              />
                              <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                                Hide used phrases
                              </span>
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowKeywordInput(!showKeywordInput)
                              }
                              className="w-full bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-7"
                            >
                              <ChevronDown
                                className={`w-3 h-3 mr-1.5 transition-transform text-black ${showKeywordInput ? "rotate-180" : ""}`}
                              />
                              Add Keywords
                            </Button>
                            {showKeywordInput && (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Comma-separated keywords..."
                                  value={keywordInput}
                                  onChange={(e) =>
                                    setKeywordInput(e.target.value)
                                  }
                                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs h-8"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddKeywords();
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={handleAddKeywords}
                                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-7"
                                >
                                  Add
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Content Editor — scrollable */}
                <div
                  className="lg:col-span-2 overflow-y-auto p-6"
                  style={{ maxHeight: "80vh" }}
                >
                  <ContentEditor
                    title={title}
                    setTitle={setTitle}
                    bullets={bullets}
                    setBullets={setBullets}
                    description={description}
                    setDescription={setDescription}
                    backendKeywords={backendKeywords}
                    setBackendKeywords={setBackendKeywords}
                    usedKeywords={usedKeywords}
                    usedWords={usedWords}
                    keywordUsage={keywordUsage}
                    wordUsage={wordUsage}
                    onOptimize={handleOptimize}
                    isOptimizing={isOptimizing}
                  />
                </div>
              </div>
            </Card>

            {/* ── Action bar — lives outside the card ── */}
            <div className="flex items-center gap-2 px-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mr-2">
                Images & Export
              </p>

              <button
                onClick={() => setActiveDrawer("product")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 h-7 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium"
              >
                <Image className="w-3.5 h-3.5 flex-shrink-0" />
                Product Images
                {hasProductImages && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </button>

              <button
                onClick={() => setActiveDrawer("aplus")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 h-7 rounded-md border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors text-xs font-medium"
              >
                <Vrpano className="w-3.5 h-3.5 flex-shrink-0" />
                A+ Images
                {hasAplusImages && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                )}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium ml-auto"
              >
                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                Download ZIP
              </button>
            </div>
          </>
        )}

        {/* Catalog generating state — shown while waiting for catalog, before content arrives */}
        {isCatalogGenerating &&
          !(title || bullets.some((b) => b.trim()) || description) && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500">
                  Generating your catalog…
                </p>
                <p className="text-xs text-slate-400">
                  You can filter keywords while you wait
                </p>
              </div>
            </Card>
          )}
      </div>

      {/* Image Generation Drawers */}
      {(activeDrawer === "product" || activeDrawer === "aplus") && (
        <ImageGenerationDrawer
          mode={activeDrawer}
          open={true}
          onClose={() => setActiveDrawer(null)}
        />
      )}
    </div>
  );
}
