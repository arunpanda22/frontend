// lib/hooks/queries/use-tag-types.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

export interface TagType {
  id: string
  name: string
  slug: string
  entity_type: 'ASIN' | 'TARGET' | 'CAMPAIGN'
  allow_multiple: boolean
  display_order: number
  is_active: boolean
  restrict_to_existing_values: boolean
}

export function useTagTypesQuery(entityType: TagType['entity_type'], enabled = true) {
  return useQuery({
    queryKey: ['tag-types', entityType],
    queryFn: async () => {
      // Endpoint returns a raw array, not { tag_types: [...] }.
      const { data } = await apiClient.get<TagType[]>('/api/v1/tagging-v2/tag-types/', {
        params: { entity_type: entityType },
      })
      return data
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}