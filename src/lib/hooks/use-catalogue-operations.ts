import { useCallback } from 'react'
import { apiClient } from '@/lib/api/config'
import { useCatalogStore } from './queries/use-catalog-store'
import type {
  CatalogGenerationRequest,
  CatalogGenerationResponse,
  KeywordFilterRequest,
  KeywordFilterResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageEditRequest,
  ImageEditResponse,
} from  '@/app/dashboard/catalogue/lib/types'

interface ContentOptimizationRequest {
  bullets: string[]
  description: string
  keywords: string[]
}

interface ContentOptimizationResponse {
  success: boolean
  data: {
    bullets: string[]
    description: string
    backend_keywords: string
    unused_keywords_count: number
  }
  message: string
}

export function useCatalogOperations() {
  const {
    setCatalogData,
    setIsCatalogGenerating,
    setCatalogError,
    setKeywordFilterData,
    setIsKeywordFiltering,
    setKeywordFilterError,
    populateFromCatalog,
    setBullets,
    setDescription,
    setBackendKeywords,
  } = useCatalogStore()

  /**
   * Generate catalog from ASIN and cerebro file
   */
  const generateCatalog = useCallback(
    async (params: CatalogGenerationRequest): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsCatalogGenerating(true)
        setCatalogError(null)

        const formData = new FormData()
        formData.append('asin', params.asin)
        formData.append('competitor_asins', params.competitor_asins)
        formData.append('cerebro_file', params.cerebro_file)
        formData.append('brand', params.brand)
        formData.append('description', params.description)
        formData.append('tone', params.tone)

        const response = await apiClient.post<CatalogGenerationResponse>(
          '/api/v1/catalogue-api/catalog/generate/',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        if (response.data.success) {
          setCatalogData(response.data.data)
          // Auto-populate content editor with generated data
          populateFromCatalog()
          console.log('✅ Catalog generated successfully:', response.data)
          return { success: true }
        } else {
          const error = 'Catalog generation failed'
          setCatalogError(error)
          return { success: false, error }
        }
      } catch (error: any) {
        console.error('❌ Catalog generation failed:', error)
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error'
        setCatalogError(errorMsg)
        return { success: false, error: errorMsg }
      } finally {
        setIsCatalogGenerating(false)
      }
    },
    [setCatalogData, setIsCatalogGenerating, setCatalogError, populateFromCatalog]
  )

  /**
   * Filter keywords from cerebro file
   */
  const filterKeywords = useCallback(
    async (params: KeywordFilterRequest): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsKeywordFiltering(true)
        setKeywordFilterError(null)

        const formData = new FormData()
        formData.append('cerebro_file', params.cerebro_file)
        if (params.min_search_volume) {
          formData.append('min_search_volume', params.min_search_volume.toString())
        }

        const response = await apiClient.post<KeywordFilterResponse>(
          '/api/v1/catalogue-api/cerebro/analyze/',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        if (response.data.success) {
          // ✅ FIX: Map API field names to frontend KeywordData interface
          const mappedKeywords = response.data.data.keywords.map((item: any) => ({
            keywordPhrase: item['Keyword Phrase'] || item.keywordPhrase || '',
            searchVolume: item['Search Volume'] || item.searchVolume || 0,
            kwType: item['kw_type'] || item.kwType || '',
            position: 0, // Not in API response
            competitorCount: 0, // Not in API response
            relevance: item['Relevance'] || item.relevance || '',
            wordCount: 0, // Not in API response
            sponsoredRank: 0, // Not in API response
            manualScore: item['score'] || item.manualScore || 0,
          }))

          setKeywordFilterData(mappedKeywords)
          console.log('✅ Keywords filtered successfully:', mappedKeywords.length, 'keywords')
          return { success: true }
        } else {
          const error = 'Keyword filtering failed'
          setKeywordFilterError(error)
          return { success: false, error }
        }
      } catch (error: any) {
        console.error('❌ Keyword filtering failed:', error)
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error'
        setKeywordFilterError(errorMsg)
        return { success: false, error: errorMsg }
      } finally {
        setIsKeywordFiltering(false)
      }
    },
    [setKeywordFilterData, setIsKeywordFiltering, setKeywordFilterError]
  )

  /**
   * Optimize content (bullets and description) with keywords
   */
  const optimizeContent = useCallback(
    async (params: ContentOptimizationRequest): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await apiClient.post<ContentOptimizationResponse>(
          '/api/v1/catalogue-api/catalog/optimize/',
          params
        )

        if (response.data.success) {
          // Update store with optimized content
          setBullets(response.data.data.bullets)
          setDescription(response.data.data.description)
          setBackendKeywords(response.data.data.backend_keywords)
          
          console.log('✅ Content optimized successfully:', response.data)
          return { success: true }
        } else {
          const error = 'Content optimization failed'
          return { success: false, error }
        }
      } catch (error: any) {
        console.error('❌ Content optimization failed:', error)
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error'
        return { success: false, error: errorMsg }
      }
    },
    [setBullets, setDescription, setBackendKeywords]
  )

  /**
   * Generate AI image (for future use)
   */
  const generateImage = useCallback(
    async (params: ImageGenerationRequest): Promise<{ success: boolean; data?: ImageGenerationResponse['data']; error?: string }> => {
      try {
        const formData = new FormData()
        formData.append('base_image', params.base_image)
        formData.append('prompt', params.prompt)
        formData.append('image_type', params.image_type)
        formData.append('image_number', params.image_number.toString())
        if (params.additional_prompt) {
          formData.append('additional_prompt', params.additional_prompt)
        }

        const response = await apiClient.post<ImageGenerationResponse>(
          '/api/v1/catalogue-api/images/generate/',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        if (response.data.success) {
          console.log('✅ Image generated successfully:', response.data)
          return { success: true, data: response.data.data }
        } else {
          const error = 'Image generation failed'
          return { success: false, error }
        }
      } catch (error: any) {
        console.error('❌ Image generation failed:', error)
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error'
        return { success: false, error: errorMsg }
      }
    },
    []
  )

  /**
   * Edit generated image (for future use)
   */
  const editImage = useCallback(
    async (params: ImageEditRequest): Promise<{ success: boolean; data?: ImageEditResponse['data']; error?: string }> => {
      try {
        const response = await apiClient.post<ImageEditResponse>(
          '/api/v1/catalogue-api/images/edit/',
          params
        )

        if (response.data.success) {
          console.log('✅ Image edited successfully:', response.data)
          return { success: true, data: response.data.data }
        } else {
          const error = 'Image edit failed'
          return { success: false, error }
        }
      } catch (error: any) {
        console.error('❌ Image edit failed:', error)
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error'
        return { success: false, error: errorMsg }
      }
    },
    []
  )

  return {
    generateCatalog,
    filterKeywords,
    optimizeContent,
    generateImage,
    editImage,
  }
}