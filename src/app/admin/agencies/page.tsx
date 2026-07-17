'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useAdminAgencies, useAdminQueryRefresh } from '@/lib/hooks/queries/use-admin'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminAgenciesPage() {
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false)

  const agenciesQuery = useAdminAgencies()
  const { refreshAgencies } = useAdminQueryRefresh()

  const [newAgency, setNewAgency] = useState({ name: '', slug: '', description: '' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState<{ saving: boolean; message?: string; error?: string }>({ saving: false })

  const agencies = useMemo(() => {
    const all = agenciesQuery.data || []
    if (!search) return all
    const s = search.toLowerCase()
    return all.filter((a: any) =>
      a.name.toLowerCase().includes(s) ||
      a.slug.toLowerCase().includes(s) ||
      (a.description || '').toLowerCase().includes(s)
    )
  }, [agenciesQuery.data, search])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setShowRefreshSuccess(false)
    try {
      await refreshAgencies()
      setShowRefreshSuccess(true)
      setTimeout(() => setShowRefreshSuccess(false), 2000)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleNameChange = (name: string) => {
    setNewAgency(prev => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name)
    }))
  }

  const handleCreateAgency = async () => {
    if (!newAgency.name || !newAgency.slug) {
      setStatus({ saving: false, error: 'Name and slug are required' })
      return
    }
    setStatus({ saving: true })
    try {
      const created = await adminDashboardService.createAgency({
        name: newAgency.name,
        slug: newAgency.slug,
        description: newAgency.description || undefined
      })
      setNewAgency({ name: '', slug: '', description: '' })
      setSlugTouched(false)
      setShowCreateForm(false)
      await refreshAgencies()
      setStatus({ saving: false, message: `Agency "${created.name}" created` })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || e?.message || 'Failed to create agency' })
      setTimeout(() => setStatus({ saving: false }), 5000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agency Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage client agencies and their linked seller accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showRefreshSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Refreshed!
            </div>
          )}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {showCreateForm ? 'Cancel' : '+ Create Agency'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={agenciesQuery.isLoading || isRefreshing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {(agenciesQuery.isLoading || isRefreshing) ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {status.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{status.error}</div>
      )}
      {status.message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">{status.message}</div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Agency</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newAgency.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug * <span className="text-xs text-gray-500">(auto-generated, editable)</span>
                </label>
                <input
                  type="text"
                  value={newAgency.slug}
                  onChange={(e) => { setSlugTouched(true); setNewAgency(prev => ({ ...prev, slug: e.target.value })) }}
                  placeholder="acme-corp"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newAgency.description}
                onChange={(e) => setNewAgency(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Optional notes about this client/agency"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => { setShowCreateForm(false); setNewAgency({ name: '', slug: '', description: '' }); setSlugTouched(false) }}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgency}
                disabled={!newAgency.name || !newAgency.slug || status.saving}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {status.saving ? 'Creating...' : 'Create Agency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Search agencies by name, slug, or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="mt-2 text-xs text-blue-600 hover:text-blue-800">
            Clear search
          </button>
        )}
      </div>

      {/* Agencies Grid */}
      {agenciesQuery.isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading agencies...
          </div>
        </div>
      ) : agenciesQuery.isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-sm text-red-600">Failed to load agencies</div>
          {(agenciesQuery.error as any)?.response?.status === 403 && (
            <div className="text-xs text-gray-600 mt-1">You don't have permission to view agencies</div>
          )}
        </div>
      ) : agencies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search ? 'No agencies found matching your search' : 'No agencies yet — create one to get started'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agencies.map((agency: any) => (
            <Link
              key={agency.id}
              href={`/admin/agencies/${agency.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="px-3 py-1 rounded-md font-medium border text-sm bg-blue-100 text-blue-800 border-blue-200">
                  {agency.name}
                </span>
                {!agency.is_active && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono mb-2">{agency.slug}</p>
              {agency.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{agency.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 rounded px-3 py-2">
                  <div className="text-xs text-green-600 mb-1">Sellers</div>
                  <div className="text-lg font-semibold text-green-900">{agency.client_count ?? 0}</div>
                </div>
                <div className="bg-blue-50 rounded px-3 py-2">
                  <div className="text-xs text-blue-600 mb-1">Agency Users</div>
                  <div className="text-lg font-semibold text-blue-900">{agency.agency_staff_count ?? 0}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end text-xs">
                <span className="text-blue-600 font-medium">Manage →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}