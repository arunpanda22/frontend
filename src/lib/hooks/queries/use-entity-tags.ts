import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

// NOTE: assumes tagging_v2's urls.py is mounted at /api/v1/tagging-v2/ —
// adjust API_BASE below if your project mounts it under a different prefix.
const API_BASE = '/api/v1/tagging-v2'

export type EntityType = 'ASIN' | 'TARGET' | 'CAMPAIGN'

// Reserved CSV columns shrank going from the old JSONB system to
// tagging_v2 — campaign_id is no longer a special column (TaggableEntity
// has no campaign_id field at all now), so only entity_key/display_name
// are reserved. See tagging_v2/services/upload.py RESERVED_COLUMNS.
export const RESERVED_TAG_TYPE_NAMES = ['entity_key', 'display_name'] as const

function normalizeForReservedCheck(name: string) {
  return name.trim().toLowerCase().replace(/[\s._-]+/g, '_')
}

export function isReservedTagTypeName(name: string) {
  const normalized = normalizeForReservedCheck(name)
  return RESERVED_TAG_TYPE_NAMES.some((reserved) => normalizeForReservedCheck(reserved) === normalized)
}

export interface TagType {
  id: string
  entity_type: EntityType
  name: string
  slug: string
  allow_multiple: boolean
  display_order: number
  is_active: boolean
  // Renamed from the old (removed) `is_system`. User-controlled, not
  // system-managed: when true, this TagType has a closed vocabulary —
  // values must be pre-defined via the Tag management endpoints below
  // before they can be assigned to an entity (inline or via CSV).
  restrict_to_existing_values: boolean
}

// A single defined value under a TagType — e.g. "Racold" under a
// "Competitor Brand" TagType. New concept in tagging_v2; the old JSONB
// system had no equivalent (values were just strings inside the tags blob).
export interface Tag {
  id: string
  tag_type: string
  tag_type_name: string
  name: string
  slug: string
  is_active: boolean
}

export interface EntityTagRow {
  id: string
  entity_type: EntityType
  entity_key: string
  display_name: string | null
  // Keyed by TagType id (not slug, and not tag_type name) — matches
  // TaggableEntitySerializer.get_tags() in tagging_v2/serializers.py.
  tags: Record<string, string[]>
}

export interface PaginatedEntityTags {
  count: number
  next: string | null
  previous: string | null
  results: EntityTagRow[]
}

export interface BulkUploadResult {
  rows_processed: number
  rows_failed: number
  errors: { row: number; entity_key: string; error: string }[]
}

export type UploadMode = 'incremental' | 'replace'

// ---------------------------------------------------------------------
// TagType CRUD
// ---------------------------------------------------------------------

export function useTagTypesQuery(entityType: EntityType) {
  return useQuery({
    queryKey: ['tag-types-v2', entityType],
    queryFn: async () => {
      const { data } = await apiClient.get<TagType[]>(`${API_BASE}/tag-types/`, {
        params: { entity_type: entityType },
      })
      return data
    },
  })
}

export function useCreateTagTypeMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; allow_multiple?: boolean; restrict_to_existing_values?: boolean }) => {
      const { data } = await apiClient.post<TagType>(`${API_BASE}/tag-types/`, {
        entity_type: entityType,
        ...payload,
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tag-types-v2', entityType] }),
  })
}

export function useRenameTagTypeMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await apiClient.patch<TagType>(`${API_BASE}/tag-types/${id}/`, { name })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tag-types-v2', entityType] }),
  })
}

export function useDeleteTagTypeMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_BASE}/tag-types/${id}/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tag-types-v2', entityType] }),
  })
}

// ---------------------------------------------------------------------
// Tag (value) management — new in tagging_v2. Mainly used for TagTypes
// with restrict_to_existing_values=true, where values must be defined
// here before they can be assigned to an entity.
// ---------------------------------------------------------------------

export function useTagValuesQuery(tagTypeId: string | null) {
  return useQuery({
    queryKey: ['tag-values-v2', tagTypeId],
    queryFn: async () => {
      const { data } = await apiClient.get<Tag[]>(`${API_BASE}/tags/`, {
        params: { tag_type: tagTypeId },
      })
      return data
    },
    enabled: !!tagTypeId,
  })
}

export function useCreateTagValueMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { tag_type: string; name: string }) => {
      const { data } = await apiClient.post<Tag>(`${API_BASE}/tags/`, payload)
      return data
    },
    onSuccess: (tag) => qc.invalidateQueries({ queryKey: ['tag-values-v2', tag.tag_type] }),
  })
}

// ---------------------------------------------------------------------
// Entities (the grid rows) + inline cell assignment
// ---------------------------------------------------------------------

export function useEntityTagsQuery(entityType: EntityType, page: number, pageSize = 50) {
  return useQuery({
    queryKey: ['entities-v2', entityType, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedEntityTags>(`${API_BASE}/entities/`, {
        params: { entity_type: entityType, page, page_size: pageSize },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useAssignTagMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      entity_key: string
      tag_type: string
      values: string[]
      display_name?: string
    }) => {
      const { data } = await apiClient.post<EntityTagRow>(`${API_BASE}/assign/`, {
        entity_type: entityType,
        ...payload,
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities-v2', entityType] }),
  })
}

// ---------------------------------------------------------------------
// Bulk CSV upload
// ---------------------------------------------------------------------

export function useBulkUploadTagsMutation(entityType: EntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, mode }: { file: File; mode: UploadMode }) => {
      const form = new FormData()
      form.append('entity_type', entityType)
      form.append('mode', mode)
      form.append('file', file)
      const { data } = await apiClient.post<BulkUploadResult>(`${API_BASE}/upload/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
        'axios-retry': { retries: 0 }, // never retry — a bulk upload isn't safe to silently resend
      })
      return data
    },
    // Bulk upload can create brand-new TagTypes on the fly from CSV
    // headers (see resolve_tag_type in tagging_v2/services/upload.py) —
    // invalidating only 'entities-v2' left new columns invisible until
    // something else happened to refetch tag-types-v2 (e.g. a manual
    // page refresh). Both need to go stale together.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities-v2', entityType] })
      qc.invalidateQueries({ queryKey: ['tag-types-v2', entityType] })
    },
  })
}
// (the old TagUploadTemplateView / generate_tag_template_csv wasn't
// ported over). useDownloadTagTemplate is intentionally omitted here —
// wire it back up once that endpoint exists on the new app, or point it
// at the old /api/v1/tagging/template/ endpoint if the CSV shape is
// still close enough to be a useful starting point.