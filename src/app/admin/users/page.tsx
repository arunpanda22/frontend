'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AdminUser } from '@/lib/api/services/admin-dashboard.service'
import { useAdminUsers, useAdminQueryRefresh } from '@/lib/hooks/queries/use-admin'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false)
  const usersQuery = useAdminUsers({ search, page })
  const { refreshUsers } = useAdminQueryRefresh()

  const data = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('👥 Users query data:', usersQuery.data);
    }
    return usersQuery.data || { count: 0, results: [] };
  }, [usersQuery.data])
  
  const users = useMemo(() => {
    const results = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
    if (process.env.NODE_ENV === 'development') {
      console.log('👥 Processed users:', results);
    }
    return results;
  }, [data])
  
  const loading = usersQuery.isLoading
  const error = usersQuery.isError ? 'Failed to load users. Check console for details.' : null

  const totalPages = Math.max(1, Math.ceil(data.count / 20)) 
  const canPrev = page > 1
  const canNext = page < totalPages

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setShowRefreshSuccess(false)
    try {
      await refreshUsers()
      setIsRefreshing(false)
      setShowRefreshSuccess(true)
      // Hide success message after 2 seconds
      setTimeout(() => setShowRefreshSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to refresh users:', error)
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <div className="flex items-center gap-3">
          {/* Success notification */}
          {showRefreshSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md transition-all duration-300 ease-in-out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Refreshed!
            </div>
          )}
          
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(loading || isRefreshing) ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {loading ? 'Loading...' : 'Refreshing...'}
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
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex items-center gap-3">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 md:max-w-80"
            placeholder="Search users by email or name"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-gray-500 hover:text-gray-700 px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-56">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-72">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-72">Roles</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading users...
                </div>
              </td></tr>
            ) : usersQuery.error ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-red-600">
                <div className="space-y-2">
                  <div>Failed to load users</div>
                  {(usersQuery.error as any)?.response?.status === 403 && (
                    <div className="text-xs text-gray-600">
                      You don't have permission to view users. Contact your administrator.
                    </div>
                  )}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs font-mono text-gray-500">
                      Error: {usersQuery.error?.message}
                    </div>
                  )}
                </div>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                {data.count === 0 ? 'No users found' : 'No users match your search'}
              </td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm truncate">
                    {u.display_name || ''} 
                    {u.is_superuser && <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Super Admin</span>}
                  </td>
                  <td className="px-4 py-3 text-sm truncate">{u.email}</td>
                  <td className="px-4 py-3 text-sm truncate">
                    {u.roles.map((r: any, index: number) => (
                      <span key={`${u.id}-${r.id || r.role_id}-${r.agency_id}-${index}`} className="inline-block mr-2 mb-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {r.role_name} @ {r.agency_name}
                        {r.is_primary && ' (Primary)'}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Link href={`/admin/users/${u.id}`} className="text-indigo-600 hover:underline">Manage</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">Page {page} of {totalPages} • Total {data.count} users</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={!canPrev}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
            >Prev</button>
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={!canNext}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

