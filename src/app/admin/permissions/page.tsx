'use client'

import { useMemo, useState } from 'react'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import { useAdminPermissions, useAdminQueryRefresh } from '@/lib/hooks/queries/use-admin'

export default function AdminPermissionsPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const permissionsQuery = useAdminPermissions()
  const { refreshPermissions } = useAdminQueryRefresh()

  const permissions = useMemo(() => permissionsQuery.data?.permissions || [], [permissionsQuery.data])
  const categories = useMemo(() => permissionsQuery.data?.categories || [], [permissionsQuery.data])

  const [status, setStatus] = useState<{ saving: boolean; message?: string; error?: string }>({ saving: false })
  
  // Create permission form
  const [newPermission, setNewPermission] = useState({
    codename: '',
    name: '',
    description: '',
    category: ''
  })

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let filtered = permissions
    
    if (selectedCategory) {
      filtered = filtered.filter((p: any) => p.category === selectedCategory)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((p: any) => 
        p.name.toLowerCase().includes(searchLower) ||
        p.codename.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  }, [permissions, search, selectedCategory])

  // Group by category
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    filteredPermissions.forEach((perm: any) => {
      const cat = perm.category || 'general'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(perm)
    })
    return grouped
  }, [filteredPermissions])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setShowRefreshSuccess(false)
    try {
      await refreshPermissions()
      setShowRefreshSuccess(true)
      setTimeout(() => setShowRefreshSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreatePermission = async () => {
    if (!newPermission.codename || !newPermission.name) {
      setStatus({ saving: false, error: 'Codename and name are required' })
      return
    }
    
    setStatus({ saving: true })
    try {
      await adminDashboardService.createPermission({
        codename: newPermission.codename,
        name: newPermission.name,
        description: newPermission.description,
        category: newPermission.category || 'general'
      })
      
      setNewPermission({ codename: '', name: '', description: '', category: '' })
      setShowCreateForm(false)
      
      await refreshPermissions()
      
      setStatus({ 
        saving: false, 
        message: 'Permission created successfully' 
      })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ 
        saving: false, 
        error: e?.response?.data?.error || e?.message || 'Failed to create permission' 
      })
      setTimeout(() => setStatus({ saving: false }), 5000)
    }
  }

  const handleDeletePermission = async (permissionId: string, permissionName: string) => {
    if (!confirm(`Are you sure you want to delete permission "${permissionName}"?\n\nThis cannot be undone and will fail if the permission is in use.`)) {
      return
    }
    
    setStatus({ saving: true })
    try {
      await adminDashboardService.deletePermission(permissionId)
      
      await refreshPermissions()
      
      setStatus({ 
        saving: false, 
        message: 'Permission deleted successfully' 
      })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ 
        saving: false, 
        error: e?.response?.data?.error || e?.message || 'Failed to delete permission' 
      })
      setTimeout(() => setStatus({ saving: false }), 5000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Permission Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage granular permissions across the system</p>
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
            {showCreateForm ? 'Cancel' : '+ Create Permission'}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={permissionsQuery.isLoading || isRefreshing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {(permissionsQuery.isLoading || isRefreshing) ? (
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

      {/* Status Messages */}
      {status.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {status.error}
        </div>
      )}
      {status.message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">
          {status.message}
        </div>
      )}

      {/* Create Permission Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Permission</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codename * <span className="text-xs text-gray-500">(e.g., view_reports)</span>
                </label>
                <input
                  type="text"
                  value={newPermission.codename}
                  onChange={(e) => setNewPermission(prev => ({ ...prev, codename: e.target.value }))}
                  placeholder="view_reports"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newPermission.name}
                  onChange={(e) => setNewPermission(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="View Reports"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={newPermission.category}
                onChange={(e) => setNewPermission(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select category...</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__new__">+ Create new category</option>
              </select>
              
              {newPermission.category === '__new__' && (
                <input
                  type="text"
                  onChange={(e) => setNewPermission(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter new category name"
                  className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newPermission.description}
                onChange={(e) => setNewPermission(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this permission allow?"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewPermission({ codename: '', name: '', description: '', category: '' })
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePermission}
                disabled={!newPermission.codename || !newPermission.name || status.saving}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {status.saving ? 'Creating...' : 'Create Permission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Search permissions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {(search || selectedCategory) && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                setSearch('')
                setSelectedCategory('')
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
            <span className="text-xs text-gray-500">
              Showing {filteredPermissions.length} of {permissions.length} permissions
            </span>
          </div>
        )}
      </div>

      {/* Permissions by Category */}
      {permissionsQuery.isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading permissions...
          </div>
        </div>
      ) : permissionsQuery.isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-sm text-red-600">Failed to load permissions</div>
          {(permissionsQuery.error as any)?.response?.status === 403 && (
            <div className="text-xs text-gray-600 mt-1">
              You don't have permission to view permissions
            </div>
          )}
        </div>
      ) : Object.keys(permissionsByCategory).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No permissions found
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(permissionsByCategory).sort().map(([category, perms]) => (
            <div key={category} className="bg-white border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {category}
                    </span>
                    <span className="text-sm text-gray-500">({perms.length} permissions)</span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {perms.map((perm: any) => (
                  <div key={perm.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{perm.name}</h4>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                            {perm.codename}
                          </span>
                        </div>
                        
                        {perm.description && (
                          <p className="text-sm text-gray-600 mb-2">{perm.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {perm.default_role_count || 0} role(s) by default
                          </span>
                          <span>•</span>
                          <span>
                            {perm.custom_grant_count || 0} custom grant(s)
                          </span>
                          {perm.default_roles && perm.default_roles.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {perm.default_roles.map((role: string) => (
                                  <span key={role} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeletePermission(perm.id, perm.name)}
                        disabled={status.saving || (perm.default_role_count > 0) || (perm.custom_grant_count > 0)}
                        className="ml-4 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          (perm.default_role_count > 0) || (perm.custom_grant_count > 0)
                            ? 'Cannot delete: Permission is in use'
                            : 'Delete permission'
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Permissions</h3>
        <div className="text-xs text-blue-800 space-y-1">
          <p>• Permissions can be assigned to roles as defaults</p>
          <p>• Permissions can be granted/revoked for individual users (overrides)</p>
          <p>• Permissions in use by roles or users cannot be deleted</p>
          <p>• Use descriptive codenames like "view_reports" or "edit_campaigns"</p>
        </div>
      </div>
    </div>
  )
}