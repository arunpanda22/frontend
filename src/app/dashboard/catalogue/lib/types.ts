export interface CatalogGenerationRequest {
  asin: string
  competitor_asins: string
  cerebro_file: File
  brand: string
  description: string
  tone: string
}

export interface CatalogGenerationResponse {
  success: boolean
  data: {
    asin: string
    brand: string
    marketplace_id: string
    review_analysis: string
    product_title: string
    bullet_points: string
    product_description: string
    image_guidelines: string
    video_brief: string
    a_plus_brief: string
  }
  message: string
}

// Cerebro/Keyword Filter Types
export interface KeywordFilterRequest {
  cerebro_file: File
  min_search_volume?: number
}

export interface KeywordData {
  keywordPhrase: string
  searchVolume: number
  kwType: string
  position: number
  competitorCount: number
  relevance: string
  wordCount: number
  sponsoredRank: number
  manualScore: number
}

export interface KeywordFilterResponse {
  success: boolean
  data: {
    total_keywords: number
    unique_keywords: number
    keywords: KeywordData[]
    download_url: string
    columns: string[]
  }
  message: string
}

// Image Generation Types (for future use)
export interface ImageGenerationRequest {
  base_image: File
  prompt: string
  image_type: "product" | "banner"
  image_number: number
  additional_prompt?: string
}

export interface ImageGenerationResponse {
  success: boolean
  data: {
    image_type: string
    image_number: number
    image_base64: string
    image_url: string
    format: string
  }
  message: string
}

export interface ImageEditRequest {
  image_url: string
  edit_prompt: string
  image_type: "product" | "banner"
}

export interface ImageEditResponse {
  success: boolean
  data: {
    image_type: string
    image_base64: string
    image_url: string
    format: string
    edit_applied: string
  }
  message: string
}

// Parsed image guidelines for image generation
export interface ImageGuideline {
  headline: string
  subheadline?: string
  description: string
  labels?: string[]
}