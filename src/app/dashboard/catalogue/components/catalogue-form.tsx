"use client"

import { useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CatalogueFormProps {
  onSubmit: (data: FormData) => void
  onKeywordFilter: (data: FormData) => void
}

export function CatalogueForm({ onSubmit, onKeywordFilter }: CatalogueFormProps) {
  const [formData, setFormData] = useState({
    asin: "",
    competitorAsin: "",
    brand: "",
    tone: "",
    cerebroFile: null as File | null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = new FormData()
    data.append("asin", formData.asin)
    data.append("competitorAsin", formData.competitorAsin)
    data.append("brand", formData.brand)
    data.append("tone", formData.tone)
    if (formData.cerebroFile) {
      data.append("cerebroFile", formData.cerebroFile)
    }
    onSubmit(data)
  }

  const handleKeywordFilter = () => {
    const data = new FormData()
    data.append("asin", formData.asin)
    data.append("competitorAsin", formData.competitorAsin)
    if (formData.cerebroFile) {
      data.append("cerebroFile", formData.cerebroFile)
    }
    onKeywordFilter(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asin">ASIN</Label>
            <Input
              id="asin"
              value={formData.asin}
              onChange={(e) => setFormData({ ...formData, asin: e.target.value })}
              placeholder="Enter ASIN"
              className="bg-white border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitor-asin">Competitor ASIN</Label>
            <Input
              id="competitor-asin"
              value={formData.competitorAsin}
              onChange={(e) => setFormData({ ...formData, competitorAsin: e.target.value })}
              placeholder="Enter competitor ASIN"
              className="bg-white border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Enter brand name"
              className="bg-white border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
              <SelectTrigger className="bg-white border-slate-300">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cerebro">Cerebro File</Label>
            <div className="relative">
              <Input
                id="cerebro"
                type="file"
                onChange={(e) => setFormData({ ...formData, cerebroFile: e.target.files?.[0] || null })}
                className="bg-white border-slate-300"
                accept=".csv,.xlsx,.xls"
              />
              {formData.cerebroFile && (
                <p className="text-xs text-slate-600 mt-1">{formData.cerebroFile.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
              Submit
            </Button>
            <Button
              type="button"
              onClick={handleKeywordFilter}
              variant="outline"
              className="w-full bg-white border-slate-300 hover:bg-slate-50"
            >
              Keyword Filter
            </Button>
          </div>
        </form>
  )
}