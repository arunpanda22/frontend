// Common API types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface SheetRow {
  [key: string]: string | number | boolean | null;
}

// Listing types
export interface Listing {
  [key: string]: string;
}

export interface ListingPayload {
  asins: string;
  geography: string;
}

// SP Ads types
export interface SpAdsPayload {
  file: File;
  useUnifiedAcos: boolean;
  target_acos?: number; // Used when useUnifiedAcos is true
  sp_target_acos?: number;
  sb_target_acos?: number;
  sd_target_acos?: number;
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  processedUrl: string;
  createdAt: string;
}

// N-gram Analysis types
export interface NgramPayload {
  file: File;
  target_acos: number;
}

export interface NgramFile {
  filename: string;
  url: string;
  file_id: string;
  type: string;
}

export interface NgramResponse {
  data: {
    status: string;
    message: string;
    sk_asin_count: number;
    mk_asin_count: number;
    data: Record<string, any[]>;
    files: NgramFile[];
  };
  status: number;
}

// SQP Analysis types
export interface SqpPayload {
  file: File;
}

export interface SqpFile {
  filename: string;
  url?: string;
  file_id: string;
}

export interface SqpResponse {
  data: {
    data: {
      'Good CTR & CVR': any[];
      'CTR Improve': any[];
      'CVR Improve': any[];
      'Declining Trend': any[];
    };
    keywords?: string[];
    file: SqpFile;
  };
  status: number;
}

// Topical Analysis types
export interface TopicalPayload {
  file: File;
  min_search_volume: number;
}

export interface TopicalFile {
  filename: string;
  url: string;
  file_id: string;
}

export interface TopicalResponse {
  data: {
    status: string;
    message: string;
    b0_asin_count: number;
    non_b0_asin_count: number;
    data: Record<string, any[]>;
    file: TopicalFile;
  };
  status: number;
}

// Cerebro Analysis types
export interface CerebroPayload {
  file: File;
  min_search_volume: number;
}

export interface CerebroFile {
  filename: string;
  url: string;
  file_id: string;
}

export interface CerebroResponse {
  data: {
    status: string;
    message: string;
    keyword_count: number;
    search_volume_avg: number;
    data: Record<string, any[]>;
    file: CerebroFile;
    keywords?: any[];
  };
  status: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Common file interface used across multiple response types
export interface FileInfo {
  filename: string;
  url?: string;
  file_id: string;
  content_type?: string;
}

export interface SpAdsResponse {
  data: {
    [sheetName: string]: SheetRow[];
  };
  excel_file?: {
    filename: string;
    content: string;
    content_type: string;
    file_id?: string;
  };
  file?: FileInfo;
  file_id?: string;
} 


// ASIN Analysis types
export interface ASINAnalysisPayload {
  asin: string;
}

export interface ASINAnalysisFile {
  filename: string;
  url: string;
  file_id: string;
}

export interface ASINAnalysisResponse {
  asin: string;
  text_analysis: string;
  image_analysis: string;
  download_file?: ASINAnalysisFile;
  analysis_summary: {
    text_length: number;
    image_length: number;
    generated_at?: string;
  };
  warning?: string;
}


// ASIN Images Analysis Types
export interface ASINImagesPayload {
  asins: string[];
}

export interface ASINImagesFile {
  filename: string;
  url: string;
  file_id: string;
}

export interface ASINVariants {
  MAIN: string;
  [key: string]: string; // PT01, PT02, etc.
}

export interface ASINAnalysisResult {
  success: boolean;
  error: string | null;
  variants: ASINVariants;
  total_variants: number;
}

export interface ASINImagesResponse {
  asins: string[];
  total_asins: number;
  successful_asins: number;
  failed_asins: number;
  analysis_results: {
    [asin: string]: ASINAnalysisResult;
  };
  download_file: ASINImagesFile;
  summary: {
    total_variants: number;
    generated_at: string | null;
  };
}


export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
  preset: DateRangePreset;
}

export interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  updatePreset: (preset: DateRangePreset) => void;
  updateCustomDates: (startDate: string, endDate: string) => void;
}

export interface CurrencyInfo {
  symbol: string;
  name: string;
  position: 'before' | 'after';
}

export interface MarketplaceCurrency {
  currency_code: string;
  currency_info: CurrencyInfo;
}

export interface CurrencyData {
  [marketplaceId: string]: MarketplaceCurrency;
}

export interface CurrencyContextType {
  currencies: CurrencyData;
  isLoading: boolean;
  error: string | null;
  formatCurrency: (value: number, marketplaceId?: string) => string;
  formatNumber: (value: number) => string;
  formatPercentage: (value: number) => string;
  formatChange: (change: number, suffix?: string) => string;
  primaryCurrency: CurrencyInfo | null;
  refetchCurrencies: () => Promise<void>;
}