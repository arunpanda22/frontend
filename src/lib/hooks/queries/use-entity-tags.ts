import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

export type EntityType = 'ASIN' | 'TARGET' | 'CAMPAIGN'

export interface TagType {
  id: string
  entity_type: EntityType
  name: string
  slug: string
  allow_multiple: boolean
  display_order: number
  is_active: boolean
  is_system: boolean
}

export interface EntityTagRow {
  id: string
  entity_type: EntityType
  entity_key: string
  campaign_id: string | null
  tags: Record<string, string | string[]>
}

export interface BulkUploadResult {
  rows_processed: number
  rows_failed: number
  errors: { row: number; entity_key: string; error: string }[]
}

export function useTagTypesQuery(entityType: EntityType) {
  return useQuery({
    queryKey: ['tag-types', entityType],
    queryFn: async () => {
      const { data } = await apiClient.get<TagType[]>('/api/v1/tagging/tag-types/', {
        params: { entity_type: entityType },
      })
      return data
    },
  })
}

export function useEntityTagsQuery(entityType: EntityType, entityKeys?: string[]) {
  return useQuery({
    queryKey: ['entity-tags', entityType, entityKeys],
    queryFn: async () => {
      const { data } = await apiClient.get<EntityTagRow[]>('/api/v1/tagging/entity-tags/', {
        params: { entity_type: entityType, entity_keys: entityKeys?.join(',') },
      })
      return data
    },
    enabled: !entityKeys || entityKeys.length > 0,
  })
}

export function useCreateTagTypeMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; allow_multiple?: boolean }) => {
      const { data } = await apiClient.post<TagType>('/api/v1/tagging/tag-types/', {
        entity_type: entityType,
        ...payload,
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tag-types', entityType] }),
  })
}

export function useRenameTagTypeMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await apiClient.patch<TagType>(`/api/v1/tagging/tag-types/${id}/`, { name })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tag-types', entityType] }),
  })
}

export function useDeleteTagTypeMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/tagging/tag-types/${id}/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tag-types', entityType] }),
  })
}

export function useApplyTagMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { entity_key: string; tags: Record<string, string>; campaign_id?: string }) => {
      const { data } = await apiClient.post<EntityTagRow>('/api/v1/tagging/apply/', {
        entity_type: entityType,
        ...payload,
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entity-tags', entityType] }),
  })
}

export function useBulkUploadTagsMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('entity_type', entityType)
      form.append('file', file)
      const { data } = await apiClient.post<BulkUploadResult>('/api/v1/tagging/bulk-upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entity-tags', entityType] }),
  })
}

export function useDownloadTagTemplate() {
  return useMutation({
    mutationFn: async (entityType: EntityType) => {
      const response = await apiClient.get('/api/v1/tagging/template/', {
        params: { entity_type: entityType },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `${entityType.toLowerCase()}_tags_template.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
  })
}