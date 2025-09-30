'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useAdminUsers, useAdminQueryRefresh } from '@/lib/hooks/queries/use-admin'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false)
  
  const usersQuery = useAdminUsers({ 
    search, 
    page,
    role_name: roleFilter || undefined
  })
  const { refreshUsers } = useAdminQueryRefresh()

  const data = useMemo(() => {
    return usersQuery.data || { count: 0, results: [] };
  }, [usersQuery.data])
  
  const users = useMemo(() => {
    return Array.isArray(data.results) ? data.results : [];
  }, [data])

  const totalPages = Math.max(1, Math.ceil(data.count / 20))

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setShowRefreshSuccess(false)
    try {
      await refreshUsers()
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

  const formatRoleDisplay = (currentRole: any) => {
    if (!currentRole) return 'No role'
    
    let display = currentRole.role_name
    
    if (currentRole.agency_name) {
      display += ` @ ${currentRole.agency_name}`
    }
    
    if (currentRole.parent_seller_email) {
      display += ` (under ${currentRole.parent_seller_email})`
    }
    
    return display
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage user roles and permissions</p>
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
            disabled={usersQuery.isLoading || isRefreshing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {(usersQuery.isLoading || isRefreshing) ? (
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="agency">Agency</option>
              <option value="seller">Seller</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
        {(search || roleFilter) && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                setSearch('')
                setRoleFilter('')
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {usersQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : usersQuery.isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <div className="text-sm text-red-600">Failed to load users</div>
                    {(usersQuery.error as any)?.response?.status === 403 && (
                      <div className="text-xs text-gray-600 mt-1">
                        You don't have permission to view users
                      </div>
                    )}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.username}
                          </div>
                          {user.is_superuser && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded mt-1">
                              Superuser
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      {user.current_role ? (
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(user.current_role.role_code)}`}>
                            {user.current_role.role_name}
                          </span>
                          {(user.current_role.agency_name || user.current_role.parent_seller_email) && (
                            <span className="text-xs text-gray-500">
                              {user.current_role.agency_name && `@ ${user.current_role.agency_name}`}
                              {user.current_role.parent_seller_email && `under ${user.current_role.parent_seller_email}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">
                          No role
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link 
                        href={`/admin/users/${user.id}`} 
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500">
              {data.count} total users
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Role Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Role Hierarchy</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-medium">
              Super Admin
            </span>
            <span className="text-gray-600">Full system access</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-medium">
              Admin
            </span>
            <span className="text-gray-600">Manages agencies & users</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-medium">
              Agency
            </span>
            <span className="text-gray-600">Manages sellers as clients</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 font-medium">
              Seller
            </span>
            <span className="text-gray-600">Amazon account holder</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200 font-medium">
              User
            </span>
            <span className="text-gray-600">Basic access + custom perms</span>
          </div>
        </div>
      </div>
    </div>
  )
}