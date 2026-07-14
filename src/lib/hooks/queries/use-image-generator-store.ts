import { create } from 'zustand'

export type ImageGenMode = 'product' | 'aplus'

export interface GenResult {
  id: string
  mode: ImageGenMode
  prompt: string
  imageUrl: string
  createdAt: number
}

interface ImageGeneratorState {
  mode: ImageGenMode
  baseImage: File | null

  promptByMode: Record<ImageGenMode, string>
  editPrompt: string

  results: GenResult[]
  activeResultId: string | null

  isGenerating: boolean
  isEditing: boolean

  nextCounterByMode: Record<ImageGenMode, number>

  setMode: (mode: ImageGenMode) => void
  setBaseImage: (file: File | null) => void
  setPrompt: (mode: ImageGenMode, prompt: string) => void
  setEditPrompt: (text: string) => void

  setIsGenerating: (v: boolean) => void
  setIsEditing: (v: boolean) => void

  addResult: (mode: ImageGenMode, prompt: string, imageUrl: string) => string
  setActiveResultId: (id: string | null) => void
  removeResult: (id: string) => void

  /** Returns a valid image_number for this mode (1-7 for product, 101-105 for banner), cycling as needed. */
  consumeCounter: (mode: ImageGenMode) => number

  reset: () => void
}

const initialPrompts: Record<ImageGenMode, string> = { product: '', aplus: '' }
const initialCounters: Record<ImageGenMode, number> = { product: 1, aplus: 1 }

export const useImageGeneratorStore = create<ImageGeneratorState>((set, get) => ({
  mode: 'product',
  baseImage: null,

  promptByMode: { ...initialPrompts },
  editPrompt: '',

  results: [],
  activeResultId: null,

  isGenerating: false,
  isEditing: false,

  nextCounterByMode: { ...initialCounters },

  setMode: (mode) => set({ mode }),
  setBaseImage: (file) => set({ baseImage: file }),
  setPrompt: (mode, prompt) =>
    set((state) => ({ promptByMode: { ...state.promptByMode, [mode]: prompt } })),
  setEditPrompt: (editPrompt) => set({ editPrompt }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsEditing: (isEditing) => set({ isEditing }),

  addResult: (mode, prompt, imageUrl) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set((state) => ({
      results: [...state.results, { id, mode, prompt, imageUrl, createdAt: Date.now() }],
      activeResultId: id,
    }))
    return id
  },
  setActiveResultId: (id) => set({ activeResultId: id }),
  removeResult: (id) =>
    set((state) => {
      const results = state.results.filter((r) => r.id !== id)
      const activeResultId =
        state.activeResultId === id ? results[results.length - 1]?.id ?? null : state.activeResultId
      return { results, activeResultId }
    }),

  consumeCounter: (mode) => {
    const n = get().nextCounterByMode[mode]
    set((state) => ({
      nextCounterByMode: { ...state.nextCounterByMode, [mode]: n + 1 },
    }))
    // Backend requires 1-7 for product, 101-105 for banner — cycle within range.
    return mode === 'product' ? ((n - 1) % 7) + 1 : ((n - 1) % 5) + 101
  },

  reset: () =>
    set({
      mode: 'product',
      baseImage: null,
      promptByMode: { ...initialPrompts },
      editPrompt: '',
      results: [],
      activeResultId: null,
      isGenerating: false,
      isEditing: false,
      nextCounterByMode: { ...initialCounters },
    }),
}))