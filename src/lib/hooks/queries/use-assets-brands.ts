'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssetType = 'VIDEO' | 'IMAGE' | 'BRAND_LOGO'

export interface AmazonAsset {
  id:                 string
  asset_id:           string
  asset_type:         AssetType
  asset_type_display: string
  asset_name:         string
  asin:               string | null
  asset_url:          string | null
  created_at:         string
  updated_at:         string
}

export interface AmazonBrand {
  id:              string
  brand_name:      string
  brand_entity_id: string
  is_active:       boolean
  created_at:      string
  updated_at:      string
}

export interface CreateAssetPayload {
  asset_id:   string
  asset_type: AssetType
  asset_name: string
  asin?:      string
  asset_url?: string
}

export interface CreateBrandPayload {
  brand_name:      string
  brand_entity_id: string
}

// ── Assets ────────────────────────────────────────────────────────────────────

export const useAssets = (assetType?: AssetType) => {
  return useQuery({
    queryKey: ['assets', assetType ?? 'all'],
    queryFn:  async () => {
      const params = assetType ? `?asset_type=${assetType}` : ''
      const response = await apiClient.get(`/api/v1/user-config/assets/${params}`)
      return response.data as AmazonAsset[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateAsset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateAssetPayload) => {
      const response = await apiClient.post('/api/v1/user-config/assets/', payload)
      return response.data as AmazonAsset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export const useUpdateAsset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CreateAssetPayload> & { id: string }) => {
      const response = await apiClient.patch(`/api/v1/user-config/assets/${id}/`, patch)
      return response.data as AmazonAsset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export const useDeleteAsset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/user-config/assets/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

// ── Brands ────────────────────────────────────────────────────────────────────

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn:  async () => {
      const response = await apiClient.get('/api/v1/user-config/brands/')
      return response.data as AmazonBrand[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateBrandPayload) => {
      const response = await apiClient.post('/api/v1/user-config/brands/', payload)
      return response.data as AmazonBrand
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

export const useUpdateBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CreateBrandPayload> & { id: string }) => {
      const response = await apiClient.patch(`/api/v1/user-config/brands/${id}/`, patch)
      return response.data as AmazonBrand
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

export const useDeleteBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/user-config/brands/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}