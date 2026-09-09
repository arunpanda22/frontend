'use client'

import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import { 
  useAdminRoleDetails,
  useAdminPermissions,
  useAdminQueryRefresh 
} from '@/lib/hooks/queries/use-admin'

export default function AdminRoleDetailPage() {
  const params = useParams<{ roleName: string }>()
  const roleName = params?.roleName
  
  const roleQuery = useAdminRoleDetails(roleName)
  const permissionsQuery = useAdminPermissions()
  const { refreshRoles, refreshPermissions } = useAdminQueryRefresh()

  const role = roleQuery.data
  const allPermissions = useMemo(() => permissionsQuery.data?.permissions || [], [permissionsQuery.data])
  const permissionCategories = useMemo(() => permissionsQuery.data?.categories || [], [permissionsQuery.data])
  
  const [status, setStatus] = useState<{ saving: boolean; message?: string; error?: string }>({ saving: false })
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'users'>('overview')
  
  // Permission management state
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissionSearch, setPermissionSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  // Get assigned permission IDs
  const assignedPermissionIds = useMemo(() => {
    if (!role?.permissions_by_category) return new Set<string>()
    const ids = new Set<string>()
    Object.values(role.permissions_by_category).forEach((perms: any) => {
      perms.forEach((p: any) => ids.add(p.id))
    })
    return ids
  }, [role])

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let filtered = allPermissions

    // Filter by assignment status
    if (showAvailableOnly) {
      filtered = filtered.filter((p: any) => !assignedPermissionIds.has(p.id))
    }
    
    if (selectedCategory) {
      filtered = filtered.filter((p: any) => p.category === selectedCategory)
    }
    
    if (permissionSearch) {
      const search = permissionSearch.toLowerCase()
      filtered = filtered.filter((p: any) => 
        p.name.toLowerCase().includes(search) ||
        p.codename.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      )
    }
    
    return filtered
  }, [allPermissions, permissionSearch, selectedCategory, showAvailableOnly, assignedPermissionIds])

  const handleAddPermissions = async () => {
    if (selectedPermissions.length === 0) return
    
    setStatus({ saving: true })
    try {
      await adminDashboardService.addRolePermissions(roleName, selectedPermissions)
      
      setSelectedPermissions([])
      setPermissionSearch('')
      
      await refreshRoles()
      await refreshPermissions()
      
      setStatus({ 
        saving: false, 
        message: `Successfully added ${selectedPermissions.length} permission(s)` 
      })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to add permissions' })
      setTimeout(() => setStatus({ saving: false }), 5000)
    }
  }

  const handleRemovePermissions = async (permissionIds: string[]) => {
    if (permissionIds.length === 0) return
    
    const confirmMessage = permissionIds.length === 1
      ? 'Remove this permission from the role?'
      : `Remove ${permissionIds.length} permissions from the role?`
    
    if (!confirm(confirmMessage)) return
    
    setStatus({ saving: true })
    try {
      await adminDashboardService.removeRolePermissions(roleName, permissionIds)
      
      await refreshRoles()
      await refreshPermissions()
      
      setStatus({ 
        saving: false, 
        message: `Successfully removed ${permissionIds.length} permission(s)` 
      })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to remove permissions' })
      setTimeout(() => setStatus({ saving: false }), 5000)
    }
  }

  if (roleQuery.isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Loading role details...
        </div>
      </div>
    )
  }
  
  if (roleQuery.isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-900 mb-2">Error Loading Role</h1>
          <p className="text-red-700">
            {(roleQuery.error as any)?.response?.status === 404 
              ? `Role "${roleName}" not found. Valid roles: super_admin, admin, agency, seller, user`
              : 'Failed to load role details'
            }
          </p>
          <Link href="/admin/roles" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
            ← Back to Roles
          </Link>
        </div>
      </div>
    )
  }
  
  if (!role) return null

  const getRoleBadgeColor = (roleCode: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-800 border-red-200',
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      agency: 'bg-blue-100 text-blue-800 border-blue-200',
      seller: 'bg-green-100 text-green-800 border-green-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[roleCode] || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/admin/roles"
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Role Details</h1>
          </div>
          <div className="flex items-center gap-3 ml-8">
            <span className={`px-3 py-1 rounded-md font-medium border ${getRoleBadgeColor(role.name)}`}>
              {role.display_name}
            </span>
            <span className="text-sm text-gray-500">Level {role.hierarchy_level}</span>
          </div>
        </div>
        <button
          onClick={() => {
            refreshRoles()
            refreshPermissions()
          }}
          disabled={roleQuery.isLoading}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh
        </button>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">Active Users</div>
          <div className="text-2xl font-bold text-blue-900">{role.user_count}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 mb-1">Total Permissions</div>
          <div className="text-2xl font-bold text-purple-900">{role.total_permissions}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">System Role</div>
          <div className="text-sm font-medium text-gray-900 mt-2">
            {role.can_be_deleted ? '🔓 Can be modified' : '🔒 Fixed role'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Manage Permissions ({role.total_permissions})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Users ({role.user_count})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Role Code</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{role.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{role.display_name}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{role.description || 'No description'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Hierarchy Level</dt>
                <dd className="mt-1 text-sm text-gray-900">Level {role.hierarchy_level}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(role.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Permissions by Category */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Default Permissions by Category
            </h3>
            {Object.keys(role.permissions_by_category).length === 0 ? (
              <p className="text-gray-500 text-sm">No permissions assigned to this role</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(role.permissions_by_category).map(([category, perms]: [string, any]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {category}
                      </span>
                      <span className="text-sm text-gray-500">({perms.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {perms.map((perm: any) => (
                        <div key={perm.id} className="text-sm">
                          <div className="font-medium text-gray-900">{perm.name}</div>
                          <div className="text-xs text-gray-500">{perm.codename}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Add Permissions Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Permissions to Role
            </h3>
            
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Search permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  {permissionCategories.map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <label className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md">
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) => setShowAvailableOnly(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span>Show unassigned only</span>
                </label>
              </div>

              {/* Permission Selection */}
              <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {permissionsQuery.isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading permissions...</div>
                  ) : filteredPermissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {showAvailableOnly && assignedPermissionIds.size === allPermissions.length
                        ? 'All permissions are already assigned to this role'
                        : 'No permissions found matching your filters'
                      }
                    </div>
                  ) : (
                    filteredPermissions.map((perm: any) => {
                      const isAssigned = assignedPermissionIds.has(perm.id)
                      return (
                        <label 
                          key={perm.id} 
                          className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                            isAssigned ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissions(prev => [...prev, perm.id])
                              } else {
                                setSelectedPermissions(prev => prev.filter(p => p !== perm.id))
                              }
                            }}
                            disabled={isAssigned}
                            className="h-4 w-4 text-blue-600 rounded disabled:opacity-50"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{perm.name}</span>
                              {isAssigned && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  Already assigned
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {perm.codename} • {perm.category}
                            </div>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Add Button */}
              {selectedPermissions.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {selectedPermissions.length} permission(s) selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPermissions([])}
                        className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleAddPermissions}
                        disabled={status.saving}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {status.saving ? 'Adding...' : `Add ${selectedPermissions.length} Permission(s)`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Permissions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Current Role Permissions ({role.total_permissions})
              </h3>
            </div>
            
            {Object.keys(role.permissions_by_category).length === 0 ? (
              <p className="text-gray-500 text-sm">No permissions assigned to this role</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(role.permissions_by_category).map(([category, perms]: [string, any]) => (
                  <div key={category} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {category}
                        </span>
                        <span className="text-sm text-gray-500">({perms.length} permissions)</span>
                      </div>
                      <button
                        onClick={() => handleRemovePermissions(perms.map((p: any) => p.id))}
                        disabled={status.saving}
                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        Remove all from category
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      {perms.map((perm: any) => (
                        <div key={perm.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">{perm.name}</div>
                            <div className="text-xs text-gray-500">{perm.codename}</div>
                            {perm.description && (
                              <div className="text-xs text-gray-600 mt-1">{perm.description}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemovePermissions([perm.id])}
                            disabled={status.saving}
                            className="ml-4 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Users with {role.display_name} Role
          </h3>
          
          {role.sample_users.length === 0 ? (
            <p className="text-gray-500 text-sm">No users assigned to this role</p>
          ) : (
            <div className="space-y-3">
              {role.sample_users.map((user: any) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-sm text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Manage →</span>
                </Link>
              ))}
              
              {role.user_count > role.sample_users.length && (
                <div className="text-center pt-4 border-t">
                  <Link
                    href={`/admin/users?role=${role.name}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all {role.user_count} users with this role →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}