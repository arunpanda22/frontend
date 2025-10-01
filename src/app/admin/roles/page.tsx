'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useAdminRoles, useAdminQueryRefresh } from '@/lib/hooks/queries/use-admin'

export default function AdminRolesPage() {
  const [search, setSearch] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false)
  
  const rolesQuery = useAdminRoles()
  const { refreshRoles } = useAdminQueryRefresh()

  const roles = useMemo(() => {
    const allRoles = rolesQuery.data?.roles || []
    if (!search) return allRoles
    
    const searchLower = search.toLowerCase()
    return allRoles.filter((role: any) => 
      role.display_name.toLowerCase().includes(searchLower) ||
      role.name.toLowerCase().includes(searchLower) ||
      role.description.toLowerCase().includes(searchLower)
    )
  }, [rolesQuery.data, search])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setShowRefreshSuccess(false)
    try {
      await refreshRoles()
      setShowRefreshSuccess(true)
      setTimeout(() => setShowRefreshSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

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

  const getHierarchyIcon = (level: number) => {
    return '★'.repeat(6 - level)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-600 mt-1">5 fixed roles with customizable permissions</p>
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
            onClick={handleRefresh}
            disabled={rolesQuery.isLoading || isRefreshing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {(rolesQuery.isLoading || isRefreshing) ? (
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

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Search roles by name or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Roles Grid */}
      {rolesQuery.isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading roles...
          </div>
        </div>
      ) : rolesQuery.isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-sm text-red-600">Failed to load roles</div>
          {(rolesQuery.error as any)?.response?.status === 403 && (
            <div className="text-xs text-gray-600 mt-1">
              You don't have permission to view roles
            </div>
          )}
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No roles found matching your search
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role: any) => (
            <Link
              key={role.id}
              href={`/admin/roles/${role.name}`}
              className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-3 py-1 rounded-md font-medium border text-sm ${getRoleBadgeColor(role.name)}`}>
                  {role.display_name}
                </span>
                <span className="text-yellow-500 text-lg" title={`Hierarchy level ${role.hierarchy_level}`}>
                  {getHierarchyIcon(role.hierarchy_level)}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {role.description || 'No description available'}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 rounded px-3 py-2">
                  <div className="text-xs text-blue-600 mb-1">Users</div>
                  <div className="text-lg font-semibold text-blue-900">{role.user_count}</div>
                </div>
                <div className="bg-purple-50 rounded px-3 py-2">
                  <div className="text-xs text-purple-600 mb-1">Permissions</div>
                  <div className="text-lg font-semibold text-purple-900">{role.permission_count}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Level {role.hierarchy_level}</span>
                <span className="text-blue-600 font-medium">View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Role Hierarchy Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Role Hierarchy</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-yellow-500">★★★★★</span>
            <div>
              <span className="font-medium block">Super Admin (L1)</span>
              <span className="text-gray-600">Complete system access</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500">★★★★</span>
            <div>
              <span className="font-medium block">Admin (L2)</span>
              <span className="text-gray-600">Manages agencies & users</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500">★★★</span>
            <div>
              <span className="font-medium block">Agency (L3)</span>
              <span className="text-gray-600">Manages sellers as clients</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500">★★</span>
            <div>
              <span className="font-medium block">Seller (L4)</span>
              <span className="text-gray-600">Amazon account holder</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500">★</span>
            <div>
              <span className="font-medium block">User (L5)</span>
              <span className="text-gray-600">Basic access + custom perms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Fixed Roles</h3>
        <div className="text-xs text-blue-800 space-y-1">
          <p>• Roles cannot be created or deleted - only the 5 system roles exist</p>
          <p>• Each role has default permissions that can be customized</p>
          <p>• Users can have additional permission overrides beyond their role</p>
          <p>• Click on a role to view and manage its permissions</p>
        </div>
      </div>
    </div>
  )
}