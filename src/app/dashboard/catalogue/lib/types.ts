export interface CatalogGenerationRequest {
  asin: string
  competitor_asins: string
  cerebro_file?: File
  brand: string
  description: string
  tone: string
}

// ── Structured image types (parsed by backend) ────────────────────────────

export interface NanoBananaArguments {
  num_images: number
  aspect_ratio: string
  output_format: string
  resolution: string
  prompt: string
  negative_prompt: string
}

export interface ImageGuidelineItem {
  image_number: number
  title: string
  headline: string
  subheadline: string
  labels: string[]
  nano_banana_arguments: NanoBananaArguments
}

export interface ImageGuidelinesData {
  total_images: number
  images: ImageGuidelineItem[]
}

export interface AplusBannerItem {
  banner_number: number
  title: string
  headline: string
  overlay_text: string
  bullet_points: string[]
  alt_text: string
  nano_banana_arguments: NanoBananaArguments
}

export interface AplusBriefData {
  total_banners: number
  banners: AplusBannerItem[]
}

// ─────────────────────────────────────────────────────────────────────────

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
    image_guidelines: ImageGuidelinesData
    video_brief: string
    a_plus_brief: AplusBriefData
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