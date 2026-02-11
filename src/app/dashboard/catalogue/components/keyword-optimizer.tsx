// "use client"

// import { useState, useMemo, useCallback } from "react"
// import { ChevronDown, Copy, Zap, BarChart3 } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { KeywordsList } from "./keywords-list"
// import { ContentEditor } from "./content-editor"
// import { CatalogueForm } from "./catalogue-form"
// import { KeywordFilterTable } from "./keyword-filter-table"
// import { useToast } from "@/hooks/use-toast"

// const SAMPLE_KEYWORDS = [
//   "ready to eat meals",
//   "camping food",
//   "dehydrated food",
//   "frozen food",
//   "instant rice",
//   "instant breakfast",
//   "ready to eat food",
//   "meal prep",
//   "instant meals",
//   "breakfast cereals",
//   "instant noodles",
//   "quick meals",
//   "freeze dried meals",
//   "long shelf life food",
//   "survival food",
// ]

// const SAMPLE_KEYWORD_DATA = [
//   {
//     keywordPhrase: "water purifier for home",
//     searchVolume: 25000,
//     kwType: "Listing Ranking & SB",
//     position: 8,
//     competitorCount: 12,
//     relevance: "Excellent",
//     wordCount: 4,
//     sponsoredRank: 5,
//     manualScore: 0,
//   },
//   {
//     keywordPhrase: "best water filter",
//     searchVolume: 12000,
//     kwType: "Listing & SB & Ranking",
//     position: 15,
//     competitorCount: 8,
//     relevance: "Good",
//     wordCount: 3,
//     sponsoredRank: 3,
//     manualScore: 0,
//   },
//   {
//     keywordPhrase: "ro water purifier",
//     searchVolume: 8500,
//     kwType: "Listing Priority",
//     position: 22,
//     competitorCount: 10,
//     relevance: "Good",
//     wordCount: 3,
//     sponsoredRank: 12,
//     manualScore: 0,
//   },
// ]

// export function KeywordOptimizer() {
//   const [keywords, setKeywords] = useState<string[]>(SAMPLE_KEYWORDS)
//   const [keywordInput, setKeywordInput] = useState("")
//   const [title, setTitle] = useState("")
//   const [bullets, setBullets] = useState<string[]>(["", "", "", "", "", "", ""])
//   const [description, setDescription] = useState("")
//   const [backendKeywords, setBackendKeywords] = useState("")
//   const [hideUsed, setHideUsed] = useState(false)
//   const [showKeywordInput, setShowKeywordInput] = useState(false)
//   const [keywordFilterData, setKeywordFilterData] = useState<typeof SAMPLE_KEYWORD_DATA>([])
//   const [formCollapsed, setFormCollapsed] = useState(false)
//   const [tableCollapsed, setTableCollapsed] = useState(false)
//   const { toast } = useToast()

//   const words = useMemo(() => {
//     const wordSet = new Set<string>()
//     keywords.forEach((keyword) => {
//       keyword
//         .toLowerCase()
//         .split(/\s+/)
//         .forEach((word) => {
//           if (word.trim()) wordSet.add(word.trim())
//         })
//     })
//     return Array.from(wordSet).sort()
//   }, [keywords])

//   const allContent = useMemo(() => {
//     return (title + " " + bullets.join(" ") + " " + description + " " + backendKeywords).toLowerCase()
//   }, [title, bullets, description, backendKeywords])

//   const keywordUsage = useMemo(() => {
//     const usage = new Map<string, number>()
//     keywords.forEach((keyword) => {
//       const lowerKeyword = keyword.toLowerCase()
//       const count = (allContent.match(new RegExp(lowerKeyword, "g")) || []).length
//       if (count > 0) usage.set(lowerKeyword, count)
//     })
//     return usage
//   }, [keywords, allContent])

//   const wordUsage = useMemo(() => {
//     const usage = new Map<string, number>()
//     words.forEach((word) => {
//       const lowerWord = word.toLowerCase()
//       const regex = new RegExp(`\\b${lowerWord}\\b`, "g")
//       const count = (allContent.match(regex) || []).length
//       if (count > 0) usage.set(lowerWord, count)
//     })
//     return usage
//   }, [words, allContent])

//   const usedKeywords = useMemo(
//     () => keywords.filter((k) => keywordUsage.has(k.toLowerCase())),
//     [keywords, keywordUsage],
//   )

//   const unusedKeywords = useMemo(
//     () => keywords.filter((k) => !keywordUsage.has(k.toLowerCase())),
//     [keywords, keywordUsage],
//   )

//   const usedWords = useMemo(() => words.filter((w) => wordUsage.has(w.toLowerCase())), [words, wordUsage])
//   const unusedWords = useMemo(() => words.filter((w) => !wordUsage.has(w.toLowerCase())), [words, wordUsage])

//   const copyToClipboard = useCallback(
//     (items: string[], type: string) => {
//       const text = items.join(", ")
//       navigator.clipboard.writeText(text)
//       toast({
//         description: `Copied ${items.length} ${type} to clipboard`,
//       })
//     },
//     [toast],
//   )

//   const handleAddKeywords = () => {
//     if (keywordInput.trim()) {
//       const newKeywords = keywordInput
//         .split(",")
//         .map((k) => k.trim())
//         .filter((k) => k && !keywords.includes(k))
//       setKeywords([...keywords, ...newKeywords])
//       setKeywordInput("")
//       setShowKeywordInput(false)
//     }
//   }

//   const handleRemoveKeyword = (keyword: string) => {
//     setKeywords(keywords.filter((k) => k !== keyword))
//   }

//   const handleFormSubmit = (data: FormData) => {
//     console.log("Form submitted:", data)
//     toast({
//       description: "Generating catalogue content...",
//     })
//   }

//   const handleKeywordFilter = (data: FormData) => {
//     console.log("Keyword filter clicked:", data)
//     setKeywordFilterData(SAMPLE_KEYWORD_DATA)
//     toast({
//       description: "Loading keyword filter results...",
//     })
//   }

//   const handleAddKeywordsFromTable = (selectedKeywords: string[]) => {
//     const newKeywords = selectedKeywords.filter((k) => !keywords.includes(k))
//     setKeywords([...keywords, ...newKeywords])
//     toast({
//       description: `Added ${newKeywords.length} keywords`,
//     })
//   }

//   const displayKeywords = hideUsed ? unusedKeywords : keywords
//   const displayWords = hideUsed ? unusedWords : words

//   const wordsStat = `${usedWords.length} / ${words.length}`
//   const phrasesStat = `${usedKeywords.length} / ${keywords.length}`

//   return (
//     <div className="min-h-screen p-6 lg:p-8 bg-slate-50">
//       <div className="max-w-8xl mx-auto space-y-6">
//         <div className="mb-8">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
//               <Zap className="w-5 h-5 text-white" />
//             </div>
//             <h1 className="text-3xl font-bold text-slate-900">Keyword Optimizer</h1>
//           </div>
//           <p className="text-slate-600">Analyze and optimize your content with real-time keyword matching</p>
//         </div>

//         <Card className="bg-white border-slate-200 shadow-sm">
//           <div className="p-4 border-b border-slate-200">
//             <button
//               onClick={() => setFormCollapsed(!formCollapsed)}
//               className="flex items-center justify-between w-full text-left"
//             >
//               <h2 className="text-lg font-semibold text-slate-900">Catalogue Setup</h2>
//               <ChevronDown className={`w-5 h-5 transition-transform ${formCollapsed ? "" : "rotate-180"}`} />
//             </button>
//           </div>
//           {!formCollapsed && (
//             <div className="p-6">
//               <CatalogueForm onSubmit={handleFormSubmit} onKeywordFilter={handleKeywordFilter} />
//             </div>
//           )}
//         </Card>

//         <Card className="bg-white border-slate-200 shadow-sm">
//           <div className="p-4 border-b border-slate-200">
//             <button
//               onClick={() => setTableCollapsed(!tableCollapsed)}
//               className="flex items-center justify-between w-full text-left"
//             >
//               <h2 className="text-lg font-semibold text-slate-900">Keyword Filter Results</h2>
//               <ChevronDown className={`w-5 h-5 transition-transform ${tableCollapsed ? "" : "rotate-180"}`} />
//             </button>
//           </div>
//           {!tableCollapsed && (
//             <div className="p-6">
//               <KeywordFilterTable data={keywordFilterData} onAddKeywords={handleAddKeywordsFromTable} />
//             </div>
//           )}
//         </Card>

//         <div className="grid lg:grid-cols-3 gap-6">
//           <div className="lg:col-span-1">
//             <div className="space-y-6">
//               <Card className="bg-white border-slate-200 shadow-sm">
//                 <div className="p-6">
//                   <div className="flex items-center justify-between mb-4">
//                     <div>
//                       <h2 className="text-lg font-semibold text-slate-900 mb-1">Words</h2>
//                       <p className="text-sm text-slate-600">{wordsStat}</p>
//                     </div>
//                     <BarChart3 className="w-5 h-5 text-cyan-600" />
//                   </div>

//                   <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
//                     <div
//                       className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
//                       style={{
//                         width: `${(usedWords.length / Math.max(words.length, 1)) * 100}%`,
//                       }}
//                     />
//                   </div>

//                   <KeywordsList
//                     keywords={displayWords}
//                     usage={wordUsage}
//                     onRemove={
//                       hideUsed
//                         ? undefined
//                         : (keyword) => {
//                             setKeywords(keywords.filter((k) => !k.toLowerCase().includes(keyword)))
//                           }
//                     }
//                   />

//                   <div className="grid grid-cols-2 gap-2 mt-4">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => copyToClipboard(usedWords, "words")}
//                       className="bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
//                     >
//                       <Copy className="w-4 h-4 mr-2" />
//                       Used ({usedWords.length})
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => copyToClipboard(unusedWords, "words")}
//                       className="bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
//                     >
//                       <Copy className="w-4 h-4 mr-2" />
//                       Unused ({unusedWords.length})
//                     </Button>
//                   </div>
//                 </div>
//               </Card>

//               <Card className="bg-white border-slate-200 shadow-sm">
//                 <div className="p-6">
//                   <div className="flex items-center justify-between mb-4">
//                     <div>
//                       <h2 className="text-lg font-semibold text-slate-900 mb-1">Phrases</h2>
//                       <p className="text-sm text-slate-600">{phrasesStat}</p>
//                     </div>
//                     <BarChart3 className="w-5 h-5 text-cyan-600" />
//                   </div>

//                   <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
//                     <div
//                       className="h-full bg-gradient-to-r from-orange-500 to-rose-400 rounded-full transition-all"
//                       style={{
//                         width: `${(usedKeywords.length / Math.max(keywords.length, 1)) * 100}%`,
//                       }}
//                     />
//                   </div>

//                   <KeywordsList keywords={displayKeywords} usage={keywordUsage} onRemove={handleRemoveKeyword} />

//                   <div className="grid grid-cols-2 gap-2 mt-4">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => copyToClipboard(usedKeywords, "phrases")}
//                       className="bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
//                     >
//                       <Copy className="w-4 h-4 mr-2" />
//                       Used ({usedKeywords.length})
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => copyToClipboard(unusedKeywords, "phrases")}
//                       className="bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
//                     >
//                       <Copy className="w-4 h-4 mr-2" />
//                       Unused ({unusedKeywords.length})
//                     </Button>
//                   </div>

//                   <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
//                     <label className="flex items-center gap-3 cursor-pointer group">
//                       <input
//                         type="checkbox"
//                         checked={hideUsed}
//                         onChange={(e) => setHideUsed(e.target.checked)}
//                         className="w-4 h-4 rounded border-slate-300 cursor-pointer"
//                       />
//                       <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
//                         Hide used phrases
//                       </span>
//                     </label>

//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setShowKeywordInput(!showKeywordInput)}
//                       className="w-full bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
//                     >
//                       <ChevronDown
//                         className={`w-4 h-4 mr-2 transition-transform ${showKeywordInput ? "rotate-180" : ""}`}
//                       />
//                       Add Keywords
//                     </Button>

//                     {showKeywordInput && (
//                       <div className="space-y-2">
//                         <Input
//                           placeholder="Enter keywords separated by comma..."
//                           value={keywordInput}
//                           onChange={(e) => setKeywordInput(e.target.value)}
//                           className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
//                           onKeyDown={(e) => {
//                             if (e.key === "Enter") handleAddKeywords()
//                           }}
//                         />
//                         <Button
//                           size="sm"
//                           onClick={handleAddKeywords}
//                           className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
//                         >
//                           Add
//                         </Button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </Card>
//             </div>
//           </div>

//           <div className="lg:col-span-2">
//             <ContentEditor
//               title={title}
//               setTitle={setTitle}
//               bullets={bullets}
//               setBullets={setBullets}
//               description={description}
//               setDescription={setDescription}
//               backendKeywords={backendKeywords}
//               setBackendKeywords={setBackendKeywords}
//               usedKeywords={usedKeywords}
//               usedWords={usedWords}
//               keywordUsage={keywordUsage}
//               wordUsage={wordUsage}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }