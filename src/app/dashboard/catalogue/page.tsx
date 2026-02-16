"use client"

import { useState, useMemo, useCallback } from "react"
import { ChevronDown, Copy, Zap, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { KeywordsList } from "./components/keywords-list"
import { ContentEditor } from "./components/content-editor"
import { CatalogueForm } from "./components/catalogue-form"
import { KeywordFilterTable } from "./components/keyword-filter-table"
import { useToast } from "@/components/ui/use-toast"
import { useCatalogStore } from "@/lib/hooks/queries/use-catalog-store"
import { useCatalogOperations } from "@/lib/hooks/use-catalogue-operations"

export default function CataloguePage() {
  const { toast } = useToast()
  const { generateCatalog, filterKeywords } = useCatalogOperations()
  
  // Zustand store
  const {
    keywords,
    keywordFilterData,
    isKeywordFiltering,
    isCatalogGenerating,
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
  } = useCatalogStore()
  
  // Local UI state
  const [keywordInput, setKeywordInput] = useState("")
  const [hideUsed, setHideUsed] = useState(false)
  const [showKeywordInput, setShowKeywordInput] = useState(false)
  const [formCollapsed, setFormCollapsed] = useState(false)
  const [tableCollapsed, setTableCollapsed] = useState(false)

  // Extract individual words from keywords
  const words = useMemo(() => {
    const wordSet = new Set<string>()
    keywords.forEach((keyword) => {
      keyword
        .toLowerCase()
        .split(/\s+/)
        .forEach((word) => {
          if (word.trim()) wordSet.add(word.trim())
        })
    })
    return Array.from(wordSet).sort()
  }, [keywords])

  // Get all content text (exclude backendKeywords to prevent them from being counted as used)
  const allContent = useMemo(() => {
    return (title + " " + bullets.join(" ") + " " + description).toLowerCase()
  }, [title, bullets, description])

  // Track usage of keywords and words
  const keywordUsage = useMemo(() => {
    const usage = new Map<string, number>()
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase()
      const count = (allContent.match(new RegExp(lowerKeyword, "g")) || []).length
      if (count > 0) usage.set(lowerKeyword, count)
    })
    return usage
  }, [keywords, allContent])

  const wordUsage = useMemo(() => {
    const usage = new Map<string, number>()
    words.forEach((word) => {
      const lowerWord = word.toLowerCase()
      const regex = new RegExp(`\\b${lowerWord}\\b`, "g")
      const count = (allContent.match(regex) || []).length
      if (count > 0) usage.set(lowerWord, count)
    })
    return usage
  }, [words, allContent])

  const usedKeywords = useMemo(
    () => keywords.filter((k) => keywordUsage.has(k.toLowerCase())),
    [keywords, keywordUsage],
  )

  const unusedKeywords = useMemo(
    () => keywords.filter((k) => !keywordUsage.has(k.toLowerCase())),
    [keywords, keywordUsage],
  )

  const usedWords = useMemo(() => words.filter((w) => wordUsage.has(w.toLowerCase())), [words, wordUsage])
  const unusedWords = useMemo(() => words.filter((w) => !wordUsage.has(w.toLowerCase())), [words, wordUsage])

  const copyToClipboard = useCallback(
    (items: string[], type: string) => {
      const text = items.join(", ")
      navigator.clipboard.writeText(text)
      toast({
        description: `Copied ${items.length} ${type} to clipboard`,
      })
    },
    [toast],
  )

  const handleAddKeywords = () => {
    if (keywordInput.trim()) {
      const newKeywords = keywordInput
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k && !keywords.includes(k))
      setKeywords([...keywords, ...newKeywords])
      setKeywordInput("")
      setShowKeywordInput(false)
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleFormSubmit = async (data: FormData) => {
    const asin = data.get('asin') as string
    const competitorAsins = data.get('competitor_asins') as string
    const brand = data.get('brand') as string
    const description = data.get('description') as string
    const tone = data.get('tone') as string
    const cerebroFile = data.get('cerebro_file') as File

    if (!asin || !competitorAsins || !brand || !description || !tone || !cerebroFile) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const result = await generateCatalog({
      asin,
      competitor_asins: competitorAsins,
      cerebro_file: cerebroFile,
      brand,
      description,
      tone,
    })

    if (result.success) {
      toast({
        title: "Success",
        description: "Catalog generated successfully!",
      })
      setFormCollapsed(true)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to generate catalog",
        variant: "destructive",
      })
    }
  }

  const handleKeywordFilter = async (data: FormData) => {
    const cerebroFile = data.get('cerebro_file') as File

    if (!cerebroFile) {
      toast({
        title: "Missing file",
        description: "Please upload a Cerebro file",
        variant: "destructive",
      })
      return
    }

    const result = await filterKeywords({
      cerebro_file: cerebroFile,
      min_search_volume: 200,
    })

    if (result.success) {
      toast({
        title: "Success",
        description: "Keywords filtered successfully!",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to filter keywords",
        variant: "destructive",
      })
    }
  }

  const handleAddKeywordsFromTable = (selectedKeywordPhrases: string[]) => {
    addSelectedKeywordsToList()
    toast({
      description: `Added ${selectedKeywordPhrases.length} keywords`,
    })
  }

  const displayKeywords = hideUsed ? unusedKeywords : keywords
  const displayWords = hideUsed ? unusedWords : words

  const wordsStat = `${usedWords.length} / ${words.length}`
  const phrasesStat = `${usedKeywords.length} / ${keywords.length}`

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-slate-50">
      <div className="max-w-8xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Keyword Optimizer</h1>
          </div>
          <p className="text-slate-600">Analyze and optimize your content with real-time keyword matching</p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => setFormCollapsed(!formCollapsed)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Catalogue Setup</h2>
                {isCatalogGenerating && (
                  <span className="text-sm text-cyan-600 animate-pulse">Generating...</span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${formCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>
          {!formCollapsed && (
            <div className="p-6">
              <CatalogueForm
                formState={catalogueFormState}
                onFormStateChange={setCatalogueFormState}
                onSubmit={handleFormSubmit}
                onKeywordFilter={handleKeywordFilter}
                isGenerating={isCatalogGenerating}
                isFiltering={isKeywordFiltering}
              />
            </div>
          )}
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => setTableCollapsed(!tableCollapsed)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Keyword Filter Results</h2>
                {isKeywordFiltering && (
                  <span className="text-sm text-cyan-600 animate-pulse">Loading...</span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${tableCollapsed ? "" : "rotate-180"}`} />
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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 mb-1">Words</h2>
                      <p className="text-sm text-slate-600">{wordsStat}</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-cyan-600" />
                  </div>

                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
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
                        : (keyword) => {
                            setKeywords(keywords.filter((k) => !k.toLowerCase().includes(keyword)))
                          }
                    }
                  />

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(usedWords, "words")}
                      className="bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Used ({usedWords.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(unusedWords, "words")}
                      className="bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Unused ({unusedWords.length})
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 mb-1">Phrases</h2>
                      <p className="text-sm text-slate-600">{phrasesStat}</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-cyan-600" />
                  </div>

                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-rose-400 rounded-full transition-all"
                      style={{
                        width: `${(usedKeywords.length / Math.max(keywords.length, 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <KeywordsList keywords={displayKeywords} usage={keywordUsage} onRemove={handleRemoveKeyword} />

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(usedKeywords, "phrases")}
                      className="bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Used ({usedKeywords.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(unusedKeywords, "phrases")}
                      className="bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Unused ({unusedKeywords.length})
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={hideUsed}
                        onChange={(e) => setHideUsed(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                        Hide used phrases
                      </span>
                    </label>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKeywordInput(!showKeywordInput)}
                      className="w-full bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
                    >
                      <ChevronDown
                        className={`w-4 h-4 mr-2 transition-transform ${showKeywordInput ? "rotate-180" : ""}`}
                      />
                      Add Keywords
                    </Button>

                    {showKeywordInput && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter keywords separated by comma..."
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddKeywords()
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleAddKeywords}
                          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-2">
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
            />
          </div>
        </div>
      </div>
    </div>
  )
}