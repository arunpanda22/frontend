import { create } from 'zustand'
import type { CatalogGenerationResponse, KeywordData } from '@/app/dashboard/catalogue/lib/types'
import type { CatalogueFormState } from '@/app/dashboard/catalogue/components/catalogue-form'

interface CatalogState {
  // Form state (persists across collapse/expand)
  catalogueFormState: CatalogueFormState
  
  // Catalog generation state
  catalogData: CatalogGenerationResponse['data'] | null
  isCatalogGenerating: boolean
  catalogError: string | null
  
  // Keyword filter state
  keywordFilterData: KeywordData[]
  isKeywordFiltering: boolean
  keywordFilterError: string | null
  selectedKeywords: string[]
  
  // Main keywords list (for Words/Phrases panels)
  keywords: string[]
  
  // Content editor state
  title: string
  bullets: string[]
  description: string
  backendKeywords: string
  
  // Image generation state (for future)
  generatedImages: Record<number, string>
  generatedBanners: Record<number, string>
  
  // Actions
  setCatalogueFormState: (state: CatalogueFormState) => void
  
  setCatalogData: (data: CatalogGenerationResponse['data']) => void
  setIsCatalogGenerating: (loading: boolean) => void
  setCatalogError: (error: string | null) => void
  
  setKeywordFilterData: (data: KeywordData[]) => void
  setIsKeywordFiltering: (loading: boolean) => void
  setKeywordFilterError: (error: string | null) => void
  
  toggleKeywordSelection: (keyword: string) => void
  clearKeywordSelection: () => void
  addSelectedKeywordsToList: () => void
  
  setKeywords: (keywords: string[]) => void
  addKeywords: (newKeywords: string[]) => void
  removeKeyword: (keyword: string) => void
  
  setTitle: (title: string) => void
  setBullets: (bullets: string[]) => void
  setDescription: (description: string) => void
  setBackendKeywords: (keywords: string) => void
  
  populateFromCatalog: () => void
  
  setGeneratedImage: (imageNumber: number, imageUrl: string) => void
  setGeneratedBanner: (bannerNumber: number, imageUrl: string) => void
  
  reset: () => void
}

const INITIAL_BULLETS = ['', '', '', '', '', '', '']

export const useCatalogStore = create<CatalogState>((set, get) => ({
  // Initial state
  catalogueFormState: {
    asin: '',
    competitorAsins: '',
    brand: '',
    description: '',
    tone: '',
    cerebroFile: null,
  },
  
  catalogData: null,
  isCatalogGenerating: false,
  catalogError: null,
  
  keywordFilterData: [],
  isKeywordFiltering: false,
  keywordFilterError: null,
  selectedKeywords: [],
  
  keywords: [],
  
  title: '',
  bullets: INITIAL_BULLETS,
  description: '',
  backendKeywords: '',
  
  generatedImages: {},
  generatedBanners: {},
  
  // Form state
  setCatalogueFormState: (catalogueFormState) => set({ catalogueFormState }),
  
  // Catalog actions
  setCatalogData: (data) => set({ catalogData: data, catalogError: null }),
  setIsCatalogGenerating: (loading) => set({ isCatalogGenerating: loading }),
  setCatalogError: (error) => set({ catalogError: error }),
  
  // Keyword filter actions
  setKeywordFilterData: (data) => set({ keywordFilterData: data, keywordFilterError: null }),
  setIsKeywordFiltering: (loading) => set({ isKeywordFiltering: loading }),
  setKeywordFilterError: (error) => set({ keywordFilterError: error }),
  
  // Keyword selection
  toggleKeywordSelection: (keyword) => set((state) => {
    const isSelected = state.selectedKeywords.includes(keyword)
    return {
      selectedKeywords: isSelected
        ? state.selectedKeywords.filter(k => k !== keyword)
        : [...state.selectedKeywords, keyword]
    }
  }),
  
  clearKeywordSelection: () => set({ selectedKeywords: [] }),
  
  addSelectedKeywordsToList: () => set((state) => {
    const newKeywords = state.selectedKeywords.filter(k => !state.keywords.includes(k))
    return {
      keywords: [...state.keywords, ...newKeywords],
      selectedKeywords: []
    }
  }),
  
  // Keywords list management
  setKeywords: (keywords) => set({ keywords }),
  addKeywords: (newKeywords) => set((state) => ({
    keywords: [...state.keywords, ...newKeywords.filter(k => !state.keywords.includes(k))]
  })),
  removeKeyword: (keyword) => set((state) => ({
    keywords: state.keywords.filter(k => k !== keyword)
  })),
  
  // Content editor
  setTitle: (title) => set({ title }),
  setBullets: (bullets) => set({ bullets }),
  setDescription: (description) => set({ description }),
  setBackendKeywords: (backendKeywords) => set({ backendKeywords }),
  
  // Populate content from generated catalog
  populateFromCatalog: () => set((state) => {
    if (!state.catalogData) return {}

    const product_title = state.catalogData.product_title ?? ''
    const bullet_points = state.catalogData.bullet_points ?? ''
    const product_description = state.catalogData.product_description ?? ''

    const firstTitle = product_title.split('\n').find(line => line.trim()) ?? ''

    let bulletsList: string[] = []

    const prefixedLines = bullet_points
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^([•\-\*]|\d+[\.\)])\s+/.test(line))
      .map(line => line.replace(/^([•\-\*]|\d+[\.\)])\s+/, '').trim())

    if (prefixedLines.length >= 2) {
      bulletsList = prefixedLines
    } else {
      const blocks = bullet_points.split('\n\n').map(b => b.trim()).filter(Boolean)
      if (blocks.length >= 2) {
        bulletsList = blocks.map(b => b.replace(/^([•\-\*]|\d+[\.\)])\s+/, '').trim())
      } else {
        bulletsList = bullet_points
          .split('\n')
          .map(b => b.trim())
          .filter(Boolean)
          .map(b => b.replace(/^([•\-\*]|\d+[\.\)])\s+/, '').trim())
      }
    }

    const bullets = [...bulletsList, ...INITIAL_BULLETS].slice(0, 7)

    return {
      title: firstTitle,
      bullets,
      description: product_description,
    }
  }),
  
  // Image generation
  setGeneratedImage: (imageNumber, imageUrl) => set((state) => ({
    generatedImages: { ...state.generatedImages, [imageNumber]: imageUrl }
  })),
  
  setGeneratedBanner: (bannerNumber, imageUrl) => set((state) => ({
    generatedBanners: { ...state.generatedBanners, [bannerNumber]: imageUrl }
  })),
  
  // Reset
  reset: () => set({
    catalogueFormState: { asin: '', competitorAsins: '', brand: '', description: '', tone: '', cerebroFile: null },
    catalogData: null,
    isCatalogGenerating: false,
    catalogError: null,
    keywordFilterData: [],
    isKeywordFiltering: false,
    keywordFilterError: null,
    selectedKeywords: [],
    keywords: [],
    title: '',
    bullets: INITIAL_BULLETS,
    description: '',
    backendKeywords: '',
    generatedImages: {},
    generatedBanners: {},
  }),
}))