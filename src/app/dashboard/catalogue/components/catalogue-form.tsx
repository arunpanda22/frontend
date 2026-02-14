"use client"

import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "./ui/badge"
import { X } from "lucide-react"

export interface CatalogueFormState {
  asin: string
  competitorAsins: string
  brand: string
  description: string
  tone: string
  cerebroFile: File | null
}

interface CatalogueFormProps {
  formState: CatalogueFormState
  onFormStateChange: (state: CatalogueFormState) => void
  onSubmit: (data: FormData) => void
  onKeywordFilter: (data: FormData) => void
}

export function CatalogueForm({ formState, onFormStateChange, onSubmit, onKeywordFilter }: CatalogueFormProps) {
  const update = (patch: Partial<CatalogueFormState>) =>
    onFormStateChange({ ...formState, ...patch })

  const competitorAsinList = formState.competitorAsins
    .split(',')
    .map(asin => asin.trim().toUpperCase())
    .filter(asin => asin.length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = new FormData()
    data.append("asin", formState.asin)
    data.append("competitor_asins", formState.competitorAsins)
    data.append("brand", formState.brand)
    data.append("description", formState.description)
    data.append("tone", formState.tone)
    if (formState.cerebroFile) {
      data.append("cerebro_file", formState.cerebroFile)
    }
    onSubmit(data)
  }

  const handleKeywordFilter = () => {
    const data = new FormData()
    data.append("asin", formState.asin)
    data.append("competitor_asins", formState.competitorAsins)
    if (formState.cerebroFile) {
      data.append("cerebro_file", formState.cerebroFile)
    }
    onKeywordFilter(data)
  }

  const removeCompetitorAsin = (asinToRemove: string) => {
    const updatedAsins = competitorAsinList
      .filter(asin => asin !== asinToRemove)
      .join(',')
    update({ competitorAsins: updatedAsins })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="asin">ASIN</Label>
        <Input
          id="asin"
          value={formState.asin}
          onChange={(e) => update({ asin: e.target.value.toUpperCase() })}
          placeholder="B0DK3444KF"
          className="bg-white border-slate-300 text-black"
          maxLength={10}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="competitor-asins">
          Competitor ASINs
          <span className="text-xs text-slate-500 ml-2">(comma-separated, max 10)</span>
        </Label>
        <Input
          id="competitor-asins"
          value={formState.competitorAsins}
          onChange={(e) => update({ competitorAsins: e.target.value })}
          placeholder="B087Y26XM8, B09XYZ1234, B07ABC5678"
          className="bg-white border-slate-300 text-black"
        />
        
        {competitorAsinList.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {competitorAsinList.map((asin, index) => (
              <Badge
                key={index}
                variant={asin.length === 10 && asin.startsWith('B') ? "default" : "destructive"}
                className="text-xs px-2 py-1"
              >
                {asin}
                <button
                  type="button"
                  onClick={() => removeCompetitorAsin(asin)}
                  className="ml-1 hover:bg-white/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <span className="text-xs text-slate-500 self-center">
              {competitorAsinList.length} ASIN{competitorAsinList.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand">Brand</Label>
        <Input
          id="brand"
          value={formState.brand}
          onChange={(e) => update({ brand: e.target.value })}
          placeholder="Enter brand name"
          className="bg-white border-slate-300 text-black"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formState.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Enter product description"
          className="bg-white border-slate-300 text-black resize-none"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tone">Tone</Label>
        <Select value={formState.tone} onValueChange={(value) => update({ tone: value })}>
          <SelectTrigger className="bg-white border-slate-300 text-black">
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Benefit focused driven by features and Emotive, Problem–Solution (Pain-First) Tone">
              Benefit Focused & Emotive (Problem–Solution)
            </SelectItem>
            <SelectItem value="Outcome-Driven / Benefit-Led Tone">
              Outcome-Driven / Benefit-Led
            </SelectItem>
            <SelectItem value="Authority / Expertise Tone">
              Authority / Expertise
            </SelectItem>
            <SelectItem value="Trust-Building / Reassurance Tone">
              Trust-Building / Reassurance
            </SelectItem>
            <SelectItem value="Social Proof / Popularity Tone">
              Social Proof / Popularity
            </SelectItem>
            <SelectItem value="Simplicity / Ease-of-Use Tone">
              Simplicity / Ease-of-Use
            </SelectItem>
            <SelectItem value="Premium / Minimalist Tone">
              Premium / Minimalist
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cerebro">Cerebro File</Label>
        <div className="relative">
          <Input
            id="cerebro"
            type="file"
            onChange={(e) => update({ cerebroFile: e.target.files?.[0] || null })}
            className="bg-white border-slate-300 text-black"
            accept=".csv,.xlsx,.xls"
          />
          {formState.cerebroFile && (
            <p className="text-xs text-slate-600 mt-1">{formState.cerebroFile.name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <Button 
          type="submit" 
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
          disabled={!formState.asin || !formState.competitorAsins || !formState.cerebroFile}
        >
          Generate Catalog
        </Button>
        <Button
          type="button"
          onClick={handleKeywordFilter}
          variant="outline"
          className="w-full bg-white border-slate-300 hover:bg-slate-50"
          disabled={!formState.cerebroFile}
        >
          Filter Keywords
        </Button>
      </div>
    </form>
  )
}