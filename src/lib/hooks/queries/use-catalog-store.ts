import { create } from 'zustand'
import type {
  CatalogGenerationResponse,
  KeywordData,
  ImageGuidelineItem,
  AplusBannerItem,
} from '@/app/dashboard/catalogue/lib/types'
import type { CatalogueFormState } from '@/app/dashboard/catalogue/components/catalogue-form'

interface CatalogState {
  // Form state
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

  // Main keywords list
  keywords: string[]

  // Content editor state
  title: string
  bullets: string[]
  description: string
  backendKeywords: string

  // Content optimization state
  isOptimizing: boolean

  // Parsed image data from backend (populated when catalog is generated)
  imageGuidelines: ImageGuidelineItem[]   // product images (1–7)
  aplusBriefs: AplusBannerItem[]          // A+ banners   (1–5)

  // Generated image URLs / data-URIs keyed by image_number / banner_number
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

  setIsOptimizing: (loading: boolean) => void

  populateFromCatalog: () => void

  setGeneratedImage: (imageNumber: number, imageUrl: string) => void
  setGeneratedBanner: (bannerNumber: number, imageUrl: string) => void

  baseProductImage: File | null
  baseBannerImage: File | null
  setBaseProductImage: (file: File | null) => void
  setBaseBannerImage: (file: File | null) => void

  reset: () => void
}

const INITIAL_BULLETS = ['', '', '', '', '', '', '']

function extractDescriptionSection(raw: string): string {
  if (!raw?.trim()) return ''

  const match = raw.match(
    /Product\s+Description[:\s*]+\*?\*?\s*\n?([\s\S]*?)(?:\n\s*\*\*Product|\n\s*#{1,3}\s*Product|\n\s*---|\s*$)/i
  )
  if (match?.[1]?.trim()) return match[1].trim()

  if (!/Product\s+(Title|Bullet)/i.test(raw)) return raw.trim()

  return ''
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
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

  isOptimizing: false,

  imageGuidelines: [],
  aplusBriefs: [],

  generatedImages: {},
  generatedBanners: {},

  // ── Form ──────────────────────────────────────────────────────────────────
  setCatalogueFormState: (catalogueFormState) => set({ catalogueFormState }),

  // ── Catalog ───────────────────────────────────────────────────────────────
  setCatalogData: (data) => set({ catalogData: data, catalogError: null }),
  setIsCatalogGenerating: (loading) => set({ isCatalogGenerating: loading }),
  setCatalogError: (error) => set({ catalogError: error }),

  // ── Keyword filter ────────────────────────────────────────────────────────
  setKeywordFilterData: (data) => set({ keywordFilterData: data, keywordFilterError: null }),
  setIsKeywordFiltering: (loading) => set({ isKeywordFiltering: loading }),
  setKeywordFilterError: (error) => set({ keywordFilterError: error }),

  // ── Keyword selection ─────────────────────────────────────────────────────
  toggleKeywordSelection: (keyword) => set((state) => ({
    selectedKeywords: state.selectedKeywords.includes(keyword)
      ? state.selectedKeywords.filter(k => k !== keyword)
      : [...state.selectedKeywords, keyword],
  })),

  clearKeywordSelection: () => set({ selectedKeywords: [] }),

  addSelectedKeywordsToList: () => set((state) => ({
    keywords: [...state.keywords, ...state.selectedKeywords.filter(k => !state.keywords.includes(k))],
    selectedKeywords: [],
  })),

  // ── Keywords list ─────────────────────────────────────────────────────────
  setKeywords: (keywords) => set({ keywords }),
  addKeywords: (newKeywords) => set((state) => ({
    keywords: [...state.keywords, ...newKeywords.filter(k => !state.keywords.includes(k))],
  })),
  removeKeyword: (keyword) => set((state) => ({
    keywords: state.keywords.filter(k => k !== keyword),
  })),

  // ── Content editor ────────────────────────────────────────────────────────
  setTitle: (title) => set({ title }),
  setBullets: (bullets) => set({ bullets }),
  setDescription: (description) => set({ description }),
  setBackendKeywords: (backendKeywords) => set({ backendKeywords }),

  setIsOptimizing: (loading) => set({ isOptimizing: loading }),

  // ── Populate from generated catalog ───────────────────────────────────────
  populateFromCatalog: () => set((state) => {
  if (!state.catalogData) return {}

  const { product_title, bullet_points, product_description, image_guidelines, a_plus_brief } = state.catalogData

  // ── Title ──
  const firstTitle = (product_title ?? '').split('\n').find(l => l.trim()) ?? ''

  // ── Bullets ──
  const raw = bullet_points ?? ''
  const prefixedLines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^([•\-\*]|\d+[\.\)])\s+/.test(l))
    .map(l => l.replace(/^([•\-\*]|\d+[\.\)])\s+/, '').replace(/\*\*/g, '').trim())

  let bulletsList: string[]
  if (prefixedLines.length >= 2) {
    bulletsList = prefixedLines
  } else {
    const blocks = raw.split('\n\n').map(b => b.trim()).filter(Boolean)
    bulletsList = blocks.length >= 2
      ? blocks.map(b => b.replace(/^([•\-\*]|\d+[\.\)])\s+/, '').replace(/\*\*/g, '').trim())
      : raw.split('\n').map(b => b.trim()).filter(Boolean).map(b => b.replace(/^([•\-\*]|\d+[\.\)])\s+/, '').replace(/\*\*/g, '').trim())
  }

  const bullets = [...bulletsList, ...INITIAL_BULLETS].slice(0, 7)

  // ── Read structured image data directly from backend ──
  const imageGuidelines: ImageGuidelineItem[] = image_guidelines?.images ?? []
  const aplusBriefs: AplusBannerItem[]        = a_plus_brief?.banners   ?? []

  return {
    title: firstTitle,
    bullets,
    description: extractDescriptionSection(product_description ?? ''),
    imageGuidelines,
    aplusBriefs,
  }
}),

  // ── Image storage ─────────────────────────────────────────────────────────
  setGeneratedImage: (imageNumber, imageUrl) => set((state) => ({
    generatedImages: { ...state.generatedImages, [imageNumber]: imageUrl },
  })),

  setGeneratedBanner: (bannerNumber, imageUrl) => set((state) => ({
    generatedBanners: { ...state.generatedBanners, [bannerNumber]: imageUrl },
  })),

  baseProductImage: null,
  baseBannerImage: null,

  setBaseProductImage: (file) => set({ baseProductImage: file }),
  setBaseBannerImage: (file) => set({ baseBannerImage: file }),

  // ── Reset ─────────────────────────────────────────────────────────────────
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
    isOptimizing: false,
    imageGuidelines: [],
    aplusBriefs: [],
    generatedImages: {},
    generatedBanners: {},
    baseProductImage: null,
    baseBannerImage: null,
  }),
}))