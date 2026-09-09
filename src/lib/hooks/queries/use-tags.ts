// lib/hooks/queries/use-tags.ts
'use client'

import { useQueries, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

export interface Tag {
  id: string
  tag_type: string
  tag_type_name: string
  name: string
  slug: string
  is_active: boolean
}

interface PaginatedTags {
  results: Tag[]
  count: number
  next: string | null
  previous: string | null
}

// Defensive against either response shape — TagViewSet is a plain
// ModelViewSet with no explicit pagination_class set, so whether it
// returns a bare array or a paginated {results: [...]} envelope depends
// on this project's global DRF settings, which I haven't seen. Confirm
// against a real response and simplify this once known for certain.
function normalizeTagsResponse(data: Tag[] | PaginatedTags): Tag[] {
  return Array.isArray(data) ? data : data.results;
}

export function useTagsQuery(tagTypeId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['tags', tagTypeId],
    queryFn: async () => {
      const { data } = await apiClient.get<Tag[] | PaginatedTags>('/api/v1/tagging-v2/tags/', {
        params: { tag_type: tagTypeId },
      })
      return normalizeTagsResponse(data)
    },
    enabled: enabled && !!tagTypeId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// Fetches tag values for however many TagType dimensions are currently
// active at once — the count changes at runtime as the user adds/removes
// filter dimensions, so this uses useQueries (a dynamic array of
// queries) rather than a fixed number of useTagsQuery calls, which would
// violate the rules of hooks.
export function useTagsForTagTypes(tagTypeIds: string[]) {
  const results = useQueries({
    queries: tagTypeIds.map((id) => ({
      queryKey: ['tags', id],
      queryFn: async () => {
        const { data } = await apiClient.get<Tag[] | PaginatedTags>('/api/v1/tagging-v2/tags/', {
          params: { tag_type: id },
        })
        return normalizeTagsResponse(data)
      },
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    })),
  })

  const byTagTypeId: Record<string, { tags: Tag[]; isLoading: boolean }> = {}
  tagTypeIds.forEach((id, i) => {
    byTagTypeId[id] = { tags: results[i]?.data ?? [], isLoading: results[i]?.isLoading ?? false }
  })
  return byTagTypeId
}