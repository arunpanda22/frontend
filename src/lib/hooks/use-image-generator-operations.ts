import { useCallback } from 'react'
import { apiClient } from '@/lib/api/config'
import type {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageEditRequest,
  ImageEditResponse,
} from '@/app/dashboard/catalogue/lib/types'

export function useImageGeneratorOperations() {
  const generateImage = useCallback(
    async (
      params: ImageGenerationRequest,
    ): Promise<{ success: boolean; data?: ImageGenerationResponse['data']; error?: string }> => {
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
          { headers: { 'Content-Type': 'multipart/form-data' } },
        )

        if (response.data.success) {
          return { success: true, data: response.data.data }
        }
        return { success: false, error: 'Image generation failed' }
      } catch (error: any) {
        console.error('❌ Image generation failed:', error)
        return { success: false, error: error.response?.data?.error || error.message || 'Unknown error' }
      }
    },
    [],
  )

  const editImage = useCallback(
    async (
      params: ImageEditRequest,
    ): Promise<{ success: boolean; data?: ImageEditResponse['data']; error?: string }> => {
      try {
        const response = await apiClient.post<ImageEditResponse>(
          '/api/v1/catalogue-api/images/edit/',
          params,
        )
        if (response.data.success) {
          return { success: true, data: response.data.data }
        }
        return { success: false, error: 'Image edit failed' }
      } catch (error: any) {
        console.error('❌ Image edit failed:', error)
        return { success: false, error: error.response?.data?.error || error.message || 'Unknown error' }
      }
    },
    [],
  )

  return { generateImage, editImage }
}