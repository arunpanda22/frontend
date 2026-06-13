'use client'

import { useMemo, useState } from 'react'
import { ReportFilters, ReportListItem } from '@/lib/api/services/admin-dashboard.service'
import { useAdminReports, useAdminReportStatusSummary, useAdminQueryRefresh } from '@/lib/hooks/queries/use-admin'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import Link from 'next/link'

export default function AdminReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, page_size: 20 })
  const [rerunningReports, setRerunningReports] = useState<Set<string>>(new Set())
  
  const reportsQuery = useAdminReports(filters)
  const statusSummaryQuery = useAdminReportStatusSummary()
  const { refreshReports, refreshStatusSummary } = useAdminQueryRefresh()

  const data = useMemo(() => reportsQuery.data || { count: 0, results: [] }, [reportsQuery.data])
  const loading = reportsQuery.isLoading
  const error = reportsQuery.isError ? 'Failed to load reports' : null
  const summary = useMemo(() => statusSummaryQuery.data || [], [statusSummaryQuery.data])

  // Helper function to update filters and reset pagination
  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })) // Reset to page 1 when filters change
  }

  // Handle report rerun
  const handleRerunReport = async (report: ReportListItem) => {
    if (rerunningReports.has(report.id)) return // Already rerunning
    
    try {
      setRerunningReports(prev => new Set([...prev, report.id]))
      
      await adminDashboardService.rerunReport(report.id, report.report_source)
      
      // Show success message (you might want to use a toast notification here)
      alert(`Report rerun initiated successfully for ${report.report_type_name}`)
      
      // Refresh the reports list and status summary
      await Promise.all([refreshReports(), refreshStatusSummary()])
      
    } catch (error: any) {
      console.error('Failed to rerun report:', error)
      const errorMessage = error.response?.data?.error || 'Failed to rerun report'
      alert(`Error: ${errorMessage}`)
    } finally {
      setRerunningReports(prev => {
        const newSet = new Set(prev)
        newSet.delete(report.id)
        return newSet
      })
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.count / (filters.page_size || 20))), [data.count, filters.page_size])
  const canPrev = (filters.page || 1) > 1
  const canNext = (filters.page || 1) < totalPages

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <button
          onClick={refreshReports}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Status Summary */}
      {summary.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex flex-wrap gap-2">
            {summary.map((s, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 rounded border px-3 py-1 text-xs text-gray-700 border-gray-200">
                <span className={`h-2 w-2 rounded-full ${s.status === 'COMPLETED' ? 'bg-green-500' : s.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-400'}`} />
                {s.source.toUpperCase()} {s.status}: {s.count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Filters</span>
          <button
            onClick={() => setFilters({ page: 1, page_size: 20 })}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <input
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
              placeholder="Report type"
              value={filters.report_type || ''}
              onChange={e => updateFilters({ report_type: e.target.value || undefined })}
            />
          </div>
          <div className="md:col-span-1">
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
              value={filters.source || ''}
              onChange={e => updateFilters({ source: (e.target.value || undefined) as any })}
            >
              <option value="">All sources</option>
              <option value="ads">Ads</option>
              <option value="fba">FBA</option>
              <option value="vendor">VENDOR</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
              value={filters.status || ''}
              onChange={e => updateFilters({ status: (e.target.value || undefined) as any })}
            >
              <option value="">All status</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="GENERATED">GENERATED</option>
              <option value="COMPLETED">COMPLETED</option> 
              <option value="CANCELLED">CANCELLED</option> 
              <option value="FAILED">FAILED</option>
              
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-0"
              placeholder="Start date"
              value={filters.start_date || ''}
              onChange={e => updateFilters({ start_date: e.target.value || undefined })}
            />
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-0"
              placeholder="End date"
              value={filters.end_date || ''}
              onChange={e => updateFilters({ end_date: e.target.value || undefined })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-56">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-56">Tenant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Completed</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-56">Rows Processed</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading reports...
                </div>
              </td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-red-600">{error}</td></tr>
            ) : data.results.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No reports found</td></tr>
            ) : (
              data.results.map((r) => {
                const isRerunning = rerunningReports.has(r.id)
                const canRerun = r.status === 'FAILED'
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{r.report_source.toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm truncate" title={r.report_type_name}>{r.report_type_name}</td>
                    <td className="px-4 py-3 text-sm truncate" title={r.tenant_name}>{r.tenant_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        r.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        r.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{r.completed_at ? new Date(r.completed_at).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-sm truncate" title={String(r.rows_processed)}>{r.rows_processed}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canRerun && (
                          <button
                            onClick={() => handleRerunReport(r)}
                            disabled={isRerunning}
                            className={`text-xs px-2 py-1 rounded border ${
                              isRerunning 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                            }`}
                            title={`Rerun failed ${r.report_source.toUpperCase()} report`}
                          >
                            {isRerunning ? (
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                Rerunning
                              </span>
                            ) : (
                              'Rerun'
                            )}
                          </button>
                        )}
                        <Link 
                          href={`/admin/reports/${r.report_source}/${r.id}`} 
                          className="text-indigo-600 hover:underline text-xs"
                        >
                          Details
                        </Link>
                        
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">Page {filters.page || 1} of {totalPages} • Total {data.count}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              disabled={!canPrev}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
            >Prev</button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
              disabled={!canNext}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}