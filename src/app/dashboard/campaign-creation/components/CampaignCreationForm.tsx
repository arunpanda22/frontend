// "use client";
// import React from "react";
// import { AlertCircle, CheckCircle2, Upload, Loader2, Plus, Trash2 } from "lucide-react"
// import { useState, useEffect } from "react"

// // Campaign Creation Component
// export function CampaignCreationComponent() {
//   const [pastedData, setPastedData] = useState([])
//   const [results, setResults] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//   const [parseError, setParseError] = useState(null)
  
//   const [editRowNumbers, setEditRowNumbers] = useState("")
//   const [editColumn, setEditColumn] = useState("budget")
//   const [editValue, setEditValue] = useState("")
//   const [editError, setEditError] = useState(null)

//   const [inlineEditCell, setInlineEditCell] = useState(null)
//   const [inlineEditValue, setInlineEditValue] = useState("")
  
//   const [isInputTableExpanded, setIsInputTableExpanded] = useState(true)

//   const [inputRows, setInputRows] = useState([
//     { 
//       campaignName: "", 
//       budget: "", 
//       bidStrategy: "Dynamic", 
//       targetingType: "Auto", 
//       startDate: "", 
//       endDate: "",
//       budgetType: "Daily"
//     }
//   ])

//   const columns = [
//     { key: "campaignName", label: "Campaign Name" },
//     { key: "budget", label: "Budget" },
//     { key: "bidStrategy", label: "Bid Strategy" },
//     { key: "targetingType", label: "Targeting Type" },
//     { key: "startDate", label: "Start Date" },
//     { key: "endDate", label: "End Date" },
//     { key: "budgetType", label: "Budget Type" },
//   ]

//   const inputColumns = [
//     { key: "campaignName", label: "Campaign Name", required: true },
//     { key: "budget", label: "Budget", required: true },
//     { key: "bidStrategy", label: "Bid Strategy" },
//     { key: "targetingType", label: "Targeting Type" },
//     { key: "startDate", label: "Start Date" },
//   ]

//   const bidStrategyOptions = ["Dynamic", "Fixed", "Down Only", "Up and Down"]
//   const targetingTypeOptions = ["Auto", "Manual - Keyword", "Manual - Product", "Manual - Category"]

//   useEffect(() => {
//     if (pastedData.length > 0) {
//       setIsInputTableExpanded(false)
//     }
//   }, [pastedData.length])

//   const handleInputChange = (rowIdx, column, value) => {
//     const newRows = [...inputRows]
//     newRows[rowIdx] = { ...newRows[rowIdx], [column]: value }
//     setInputRows(newRows)
//   }

//   const handlePasteInCell = (e, rowIdx, columnKey) => {
//     e.preventDefault()
//     setParseError(null)

//     const text = e.clipboardData.getData("text")
//     const lines = text.split("\n").filter((line) => line.trim())

//     if (lines.length === 0) return

//     const newRows = []

//     lines.forEach((line) => {
//       const cells = line.split("\t").map((col) => col.trim())
      
//       const columnKeys = inputColumns.map(col => col.key)
//       const startIdx = columnKeys.indexOf(columnKey)
      
//       const rowData = {
//         campaignName: "",
//         budget: "",
//         bidStrategy: "Dynamic",
//         targetingType: "Auto",
//         startDate: "",
//         endDate: "",
//         budgetType: "Daily"
//       }

//       cells.forEach((cell, idx) => {
//         const targetColumnIdx = startIdx + idx
//         if (targetColumnIdx < columnKeys.length) {
//           rowData[columnKeys[targetColumnIdx]] = cell
//         }
//       })

//       if (rowData.campaignName && rowData.budget) {
//         newRows.push(rowData)
//       }
//     })

//     if (newRows.length === 0) {
//       setParseError("No valid data found. Please ensure Campaign Name and Budget columns have data.")
//       return
//     }

//     const updatedInputRows = [...inputRows]
//     updatedInputRows[rowIdx] = newRows[0]
    
//     if (newRows.length > 1) {
//       updatedInputRows.splice(rowIdx + 1, 0, ...newRows.slice(1))
//     }

//     setInputRows(updatedInputRows)
//   }

//   const handleAddRow = () => {
//     setInputRows([...inputRows, { 
//       campaignName: "", 
//       budget: "", 
//       bidStrategy: "Dynamic", 
//       targetingType: "Auto", 
//       startDate: "", 
//       endDate: "",
//       budgetType: "Daily"
//     }])
//   }

//   const handleDeleteRow = (rowIdx) => {
//     if (inputRows.length === 1) {
//       setInputRows([{ 
//         campaignName: "", 
//         budget: "", 
//         bidStrategy: "Dynamic", 
//         targetingType: "Auto", 
//         startDate: "", 
//         endDate: "",
//         budgetType: "Daily"
//       }])
//     } else {
//       const newRows = inputRows.filter((_, idx) => idx !== rowIdx)
//       setInputRows(newRows)
//     }
//   }

//   const handleProcessInput = () => {
//     setParseError(null)

//     const validRows = inputRows.filter(row => row.campaignName.trim() && row.budget.trim())

//     if (validRows.length === 0) {
//       setParseError("Please enter at least one row with Campaign Name and Budget.")
//       return
//     }

//     setPastedData(validRows)
//   }

//   const handleSaveCampaigns = async () => {
//     if (pastedData.length === 0) {
//       setError("Please process input data first")
//       return
//     }

//     setLoading(true)
//     setError(null)
//     setResults([])

//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000))
      
//       // Mock results - just mark all as saved successfully
//       const mockResults = pastedData.map(campaign => ({
//         ...campaign,
//         status: "Saved",
//         id: Math.random().toString(36).substr(2, 9)
//       }))
      
//       setResults(mockResults)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to save campaigns")
//       console.error("Campaign save error:", err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleBulkEdit = () => {
//     setEditError(null)

//     const rows = []
    
//     if (editRowNumbers.trim().toLowerCase() === "all") {
//       for (let i = 1; i <= pastedData.length; i++) {
//         rows.push(i)
//       }
//     } else {
//       const parts = editRowNumbers.split(",")

//       for (const part of parts) {
//         const trimmed = part.trim()
//         if (trimmed.includes("-")) {
//           const [start, end] = trimmed.split("-").map((n) => parseInt(n.trim()))
//           if (isNaN(start) || isNaN(end)) {
//             setEditError("Invalid range format. Use numbers like '1,3,5' or '1-5'")
//             return
//           }
//           for (let i = start; i <= end; i++) {
//             rows.push(i)
//           }
//         } else {
//           const num = parseInt(trimmed)
//           if (isNaN(num)) {
//             setEditError("Invalid row number. Use format '1,3,5' or '1-5'")
//             return
//           }
//           rows.push(num)
//         }
//       }
//     }

//     const invalidRows = rows.filter((r) => r < 1 || r > pastedData.length)
//     if (invalidRows.length > 0) {
//       setEditError(`Row numbers must be between 1 and ${pastedData.length}`)
//       return
//     }

//     const updatedData = pastedData.map((item, idx) => {
//       if (rows.includes(idx + 1)) {
//         return {
//           ...item,
//           [editColumn]: editValue,
//         }
//       }
//       return item
//     })

//     setPastedData(updatedData)

//     const updatedResults = results.map((item, idx) => {
//       if (rows.includes(idx + 1)) {
//         return {
//           ...item,
//           [editColumn]: editValue,
//         }
//       }
//       return item
//     })
//     setResults(updatedResults)

//     setEditRowNumbers("")
//     setEditColumn("budget")
//     setEditValue("")
//   }

//   const handleInlineEditStart = (rowIdx, column, value) => {
//     setInlineEditCell({ rowIdx, column })
//     setInlineEditValue(value)
//   }

//   const handleInlineEditSave = (rowIdx, column) => {
//     if (!inlineEditValue.trim()) {
//       setInlineEditCell(null)
//       setInlineEditValue("")
//       return
//     }

//     const updatedData = pastedData.map((item, idx) => {
//       if (idx === rowIdx) {
//         return {
//           ...item,
//           [column]: inlineEditValue,
//         }
//       }
//       return item
//     })

//     setPastedData(updatedData)

//     if (results.length > 0) {
//       const updatedResults = results.map((item, idx) => {
//         if (idx === rowIdx) {
//           return {
//             ...item,
//             [column]: inlineEditValue,
//           }
//         }
//         return item
//       })
//       setResults(updatedResults)
//     }

//     setInlineEditCell(null)
//     setInlineEditValue("")
//   }

//   const savedCount = results.filter((r) => r.status === "Saved").length
//   const totalCount = results.length

//   return (
//     <div className="space-y-6">
//       {/* Input Card */}
//       <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm">
//         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//           <div>
//             <div className="flex items-center gap-2 mb-1">
//               <Upload className="w-5 h-5 text-gray-700" />
//               <h2 className="text-lg font-semibold text-gray-900">Input Data</h2>
//             </div>
//             <p className="text-sm text-gray-600">
//               Enter campaign data manually or paste from Excel. Campaign Name and Budget are required.
//             </p>
//           </div>
//           {pastedData.length > 0 && (
//             <button
//               onClick={() => setIsInputTableExpanded(!isInputTableExpanded)}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//             >
//               {isInputTableExpanded ? "Collapse Input" : "Expand Input"}
//             </button>
//           )}
//         </div>
        
//         <div className="p-6 space-y-4">
//           {isInputTableExpanded && (
//             <>
//               <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
//                 <table className="w-full">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       {inputColumns.map((col) => (
//                         <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
//                           {col.label}
//                           {col.required && <span className="text-red-500 ml-1">*</span>}
//                         </th>
//                       ))}
//                       <th className="w-20 px-4 py-3"></th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {inputRows.map((row, rowIdx) => (
//                       <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
//                         {inputColumns.map((col) => (
//                           <td key={col.key} className="p-2">
//                             {col.key === "bidStrategy" ? (
//                               <select
//                                 value={row[col.key]}
//                                 onChange={(e) => handleInputChange(rowIdx, col.key, e.target.value)}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//                               >
//                                 {bidStrategyOptions.map((option) => (
//                                   <option key={option} value={option}>
//                                     {option}
//                                   </option>
//                                 ))}
//                               </select>
//                             ) : col.key === "targetingType" ? (
//                               <select
//                                 value={row[col.key]}
//                                 onChange={(e) => handleInputChange(rowIdx, col.key, e.target.value)}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//                               >
//                                 {targetingTypeOptions.map((option) => (
//                                   <option key={option} value={option}>
//                                     {option}
//                                   </option>
//                                 ))}
//                               </select>
//                             ) : col.key === "startDate" ? (
//                               <input
//                                 type="date"
//                                 value={row[col.key]}
//                                 onChange={(e) => handleInputChange(rowIdx, col.key, e.target.value)}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                               />
//                             ) : (
//                               <input
//                                 type="text"
//                                 value={row[col.key]}
//                                 onChange={(e) => handleInputChange(rowIdx, col.key, e.target.value)}
//                                 onPaste={(e) => handlePasteInCell(e, rowIdx, col.key)}
//                                 placeholder={col.required ? "Required" : "Optional"}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                               />
//                             )}
//                           </td>
//                         ))}
//                         <td className="p-2">
//                           <button
//                             onClick={() => handleDeleteRow(rowIdx)}
//                             className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="flex gap-2">
//                 <button
//                   onClick={handleAddRow}
//                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
//                 >
//                   <Plus className="h-4 w-4" />
//                   Add Row
//                 </button>
//                 <button
//                   onClick={handleProcessInput}
//                   disabled={inputRows.every(row => !row.campaignName.trim() || !row.budget.trim())}
//                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Process Input
//                 </button>
//               </div>

//               {parseError && (
//                 <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
//                   <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
//                   <p className="text-sm text-amber-800">{parseError}</p>
//                 </div>
//               )}
//             </>
//           )}

//           {/* Parsed Data Preview - Always visible when data exists */}
//           {pastedData.length > 0 && (
//             <div className="space-y-2">
//               <div className="text-sm font-medium text-gray-900">
//                 Parsed: {pastedData.length} campaign{pastedData.length !== 1 ? "s" : ""}
//               </div>
//               <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
//                 <table className="w-full">
//                   <thead className="sticky top-0 bg-gray-100">
//                     <tr>
//                       {columns.map((col) => (
//                         <th key={col.key} className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
//                           {col.label}
//                         </th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {pastedData.slice(0, 10).map((item, idx) => (
//                       <tr key={idx} className="hover:bg-gray-50 transition-colors">
//                         {columns.map((col) => {
//                           const value = item[col.key]
//                           const isEditing = inlineEditCell?.rowIdx === idx && inlineEditCell?.column === col.key
                          
//                           return (
//                             <td
//                               key={col.key}
//                               onClick={() => handleInlineEditStart(idx, col.key, value)}
//                               className={`px-4 py-2 text-sm cursor-pointer transition-colors ${isEditing ? "bg-blue-50" : "hover:bg-blue-50"}`}
//                             >
//                               {isEditing ? (
//                                 <input
//                                   autoFocus
//                                   type="text"
//                                   value={inlineEditValue}
//                                   onChange={(e) => setInlineEditValue(e.target.value)}
//                                   onBlur={() => handleInlineEditSave(idx, col.key)}
//                                   onKeyDown={(e) => {
//                                     if (e.key === "Enter") handleInlineEditSave(idx, col.key)
//                                     if (e.key === "Escape") {
//                                       setInlineEditCell(null)
//                                       setInlineEditValue("")
//                                     }
//                                   }}
//                                   className="w-full px-2 py-1 border-2 border-blue-400 rounded bg-white text-sm focus:outline-none"
//                                 />
//                               ) : (
//                                 value || "-"
//                               )}
//                             </td>
//                           )
//                         })}
//                       </tr>
//                     ))}
//                     {pastedData.length > 10 && (
//                       <tr>
//                         <td colSpan={7} className="px-4 py-2 text-center text-gray-500 text-sm">
//                           +{pastedData.length - 10} more campaigns
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//               <button
//                 onClick={handleSaveCampaigns}
//                 disabled={loading}
//                 className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Campaigns"
//                 )}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Bulk Edit Card */}
//       {pastedData.length > 0 && (
//         <div className="bg-white rounded-lg border-2 border-blue-200 shadow-sm">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h2 className="text-lg font-semibold text-gray-900">Bulk Edit Values</h2>
//             <p className="text-sm text-gray-600 mt-1">
//               Edit column values for specific rows. Use format: 1,3,5 or 1-5 or type "all" for all rows
//             </p>
//           </div>
//           <div className="p-6">
//             <div className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-900 block">
//                     Row Numbers
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="e.g., 1,3,5 or 1-5 or all"
//                     value={editRowNumbers}
//                     onChange={(e) => setEditRowNumbers(e.target.value)}
//                     className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-900 block">
//                     Column
//                   </label>
//                   <select
//                     value={editColumn}
//                     onChange={(e) => setEditColumn(e.target.value)}
//                     className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
//                   >
//                     {columns.map((col) => (
//                       <option key={col.key} value={col.key}>
//                         {col.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-900 block">
//                     New Value
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="Enter new value"
//                     value={editValue}
//                     onChange={(e) => setEditValue(e.target.value)}
//                     className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-900 block">
//                     &nbsp;
//                   </label>
//                   <button
//                     onClick={handleBulkEdit}
//                     className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
//                   >
//                     Apply Changes
//                   </button>
//                 </div>
//               </div>

//               {editError && (
//                 <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
//                   <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
//                   <p className="text-sm text-amber-800">{editError}</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Results Card */}
//       {results.length > 0 && (
//         <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-lg font-semibold text-gray-900">Results</h2>
//                 <p className="text-sm text-gray-600">
//                   {savedCount} of {totalCount} campaigns saved successfully
//                 </p>
//               </div>
//               <div className="text-right">
//                 <div className="text-2xl font-bold text-gray-900">
//                   {Math.round((savedCount / totalCount) * 100)}%
//                 </div>
//                 <p className="text-xs text-gray-600">Success Rate</p>
//               </div>
//             </div>
//           </div>
//           <div className="p-6">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     {columns.map((col) => (
//                       <th key={col.key} className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
//                         {col.label}
//                       </th>
//                     ))}
//                     <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
//                     <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Campaign ID</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {results.map((result, idx) => (
//                     <tr key={idx} className="bg-green-50 hover:opacity-75 transition-opacity">
//                       {columns.map((col) => {
//                         const value = result[col.key]
//                         const isEditing = inlineEditCell?.rowIdx === idx && inlineEditCell?.column === col.key
                        
//                         return (
//                           <td
//                             key={col.key}
//                             onClick={() => handleInlineEditStart(idx, col.key, value)}
//                             className={`px-4 py-2 text-sm cursor-pointer transition-colors ${isEditing ? "bg-blue-100" : "hover:bg-blue-100"}`}
//                           >
//                             {isEditing ? (
//                               <input
//                                 autoFocus
//                                 type="text"
//                                 value={inlineEditValue}
//                                 onChange={(e) => setInlineEditValue(e.target.value)}
//                                 onBlur={() => handleInlineEditSave(idx, col.key)}
//                                 onKeyDown={(e) => {
//                                   if (e.key === "Enter") handleInlineEditSave(idx, col.key)
//                                   if (e.key === "Escape") {
//                                     setInlineEditCell(null)
//                                     setInlineEditValue("")
//                                   }
//                                 }}
//                                 className="w-full px-2 py-1 border-2 border-blue-400 rounded bg-white text-sm focus:outline-none"
//                               />
//                             ) : (
//                               value || "-"
//                             )}
//                           </td>
//                         )
//                       })}
//                       <td className="px-4 py-2 text-sm">
//                         <div className="flex items-center gap-2">
//                           <CheckCircle2 className="w-4 h-4 text-green-600" />
//                           <span className="text-sm font-medium text-green-700">{result.status}</span>
//                         </div>
//                       </td>
//                       <td className="px-4 py-2 text-sm text-gray-600 font-mono">{result.id}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// // Main Page Component
// export default function CampaignCreationPage() {
//   return (
//     <div className="min-h-screen px-4 bg-[#f7fafc] sm:px-6 lg:px-12 py-8">
//       <div className="w-full max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="mb-6">
//           <h1 className="text-2xl sm:text-3xl md:text-4xl text-[#1a2b3c] tracking-tight font-montserrat font-semibold">
//             Campaign Creation
//           </h1>
//           <p className="text-gray-600 text-lg mt-2">
//             Create and manage your advertising campaigns with bulk input
//           </p>
//         </div>

//         {/* Campaign Creation Component */}
//         <CampaignCreationComponent />
//       </div>
//     </div>
//   );
// }