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
  asin: string
  competitor_asins: string  
}

export interface KeywordData {
  keyword: string
  is_primary: boolean
  frequency: number
  word_count: number
  keyword_type: "long_tail" | "standard"
  searchTermImpressionRank?: number
  searchTermImpressionShare?: number
  // match-type pivoted columns (present when API returns them)
  broad_bid?: number
  broad_rank?: number
  broad_bid_lower?: number
  broad_bid_median?: number
  broad_bid_upper?: number
  phrase_bid?: number
  phrase_rank?: number
  phrase_bid_lower?: number
  phrase_bid_median?: number
  phrase_bid_upper?: number
  exact_bid?: number
  exact_rank?: number
  exact_bid_lower?: number
  exact_bid_median?: number
  exact_bid_upper?: number
}

export interface KeywordFilterResponse {
  success: boolean
  data: {
    primary_asin: string
    competitor_asins: string[]
    total_keywords: number
    keywords: KeywordData[]
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