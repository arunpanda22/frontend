'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScriptType = 'daily' | 'dayparting'

export interface ScriptVersionDetail {
  id:          string
  script_type: ScriptType
  version:     string
  created_at:  string
}

export interface TenantScriptConfig {
  id:                    string
  script_type:           ScriptType
  script_version:        string | null
  script_version_detail: ScriptVersionDetail | null
  is_enabled:            boolean
  updated_at:            string
}

export interface UpdateScriptConfigPayload {
  script_version?: string | null
  is_enabled?:     boolean
}

// ── Script Versions ───────────────────────────────────────────────────────────

export const useScriptVersions = (scriptType?: ScriptType) => {
  return useQuery({
    queryKey: ['script-versions', scriptType ?? 'all'],
    queryFn:  async () => {
      const params   = scriptType ? `?script_type=${scriptType}` : ''
      const response = await apiClient.get(`/api/v1/user-config/script-versions/${params}`)
      return response.data as ScriptVersionDetail[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ── Tenant Script Configs ─────────────────────────────────────────────────────

export const useScriptConfigs = () => {
  return useQuery({
    queryKey: ['script-configs'],
    queryFn:  async () => {
      const response = await apiClient.get('/api/v1/user-config/script-configs/')
      return response.data as TenantScriptConfig[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdateScriptConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ type, ...payload }: UpdateScriptConfigPayload & { type: ScriptType }) => {
      const response = await apiClient.patch(`/api/v1/user-config/script-configs/${type}/`, payload)
      return response.data as TenantScriptConfig
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-configs'] })
    },
  })
}

// ── ASIN Overrides ────────────────────────────────────────────────────────────

export interface AsinOverride {
  id:                  string
  asin:                string
  script_type:         ScriptType
  is_excluded:         boolean | null
  acos_change_percent: string | null
  updated_at:          string
}

export interface UpsertAsinOverrideRow {
  asin:                 string
  script_type:          ScriptType
  is_excluded?:         boolean | null
  acos_change_percent?: number | null
}

export const useAsinOverrides = (scriptType?: ScriptType) => {
  return useQuery({
    queryKey: ['asin-overrides', scriptType ?? 'all'],
    queryFn:  async () => {
      const params   = scriptType ? `?script_type=${scriptType}` : ''
      const response = await apiClient.get(`/api/v1/user-config/asin-overrides/${params}`)
      return response.data as AsinOverride[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpsertAsinOverrides = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rows: UpsertAsinOverrideRow[]) => {
      const response = await apiClient.post('/api/v1/user-config/asin-overrides/', { rows })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asin-overrides'] })
    },
  })
}

export const useDeleteAsinOverrides = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // Each entry needs asin + script_type so the backend deletes the right row
    mutationFn: async (rows: Array<{ asin: string; script_type: ScriptType }>) => {
      const response = await apiClient.delete('/api/v1/user-config/asin-overrides/', {
        data: { rows },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asin-overrides'] })
    },
  })
}

// ── Campaign Overrides ────────────────────────────────────────────────────────

export interface CampaignOverride {
  id:                  string
  campaign_name:       string
  script_type:         ScriptType
  is_excluded:         boolean | null
  acos_change_percent: string | null
  updated_at:          string
}

export interface UpsertCampaignOverrideRow {
  campaign_name:        string
  script_type:          ScriptType
  is_excluded?:         boolean | null
  acos_change_percent?: number | null
}

export const useCampaignOverrides = (scriptType?: ScriptType) => {
  return useQuery({
    queryKey: ['campaign-overrides', scriptType ?? 'all'],
    queryFn:  async () => {
      const params   = scriptType ? `?script_type=${scriptType}` : ''
      const response = await apiClient.get(`/api/v1/user-config/campaign-overrides/${params}`)
      return response.data as CampaignOverride[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpsertCampaignOverrides = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rows: UpsertCampaignOverrideRow[]) => {
      const response = await apiClient.post('/api/v1/user-config/campaign-overrides/', { rows })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-overrides'] })
    },
  })
}

export const useDeleteCampaignOverrides = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rows: Array<{ campaign_name: string; script_type: ScriptType }>) => {
      const response = await apiClient.delete('/api/v1/user-config/campaign-overrides/', {
        data: { rows },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-overrides'] })
    },
  })
}