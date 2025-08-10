'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAdminReportDetails, useAdminQueryRefresh } from '@/lib/hooks/queries/use-admin'

export default function ReportDetailPage() {
  const params = useParams<{ source: 'ads' | 'fba'; id: string }>()
  const reportId = useMemo(() => params?.id as string, [params])
  const reportSource = useMemo(() => (params?.source as 'ads' | 'fba') || 'ads', [params])

  const detailQuery = useAdminReportDetails(reportId, reportSource)
  const { refreshReportDetails } = useAdminQueryRefresh()

  const handleRefresh = () => {
    refreshReportDetails(reportId, reportSource)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Report Details</h1>
        <button
          onClick={handleRefresh}
          disabled={detailQuery.isLoading}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {detailQuery.isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {detailQuery.isLoading && <div className="text-sm text-gray-500">Loading...</div>}
      {detailQuery.isError && <div className="text-sm text-red-600">Failed to load report</div>}
      {!detailQuery.isLoading && !detailQuery.isError && !detailQuery.data && (
        <div className="text-sm text-gray-500">No details found.</div>
      )}
      {detailQuery.data && <ReportDetailView data={detailQuery.data} />}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="text-xs text-gray-500 col-span-1">{label}</div>
      <div className="text-sm text-gray-900 col-span-2 break-words">{value}</div>
    </div>
  )
}

function ReportDetailView({ data }: { data: any }) {
  // Best-effort extraction of top-level fields commonly present in docs
  const meta = data || {}
  
  const statusConfig = {
    COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', icon: '✓' },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', icon: '✗' },
    IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: '⟳' },
    PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', icon: '⏳' },
  }
  
  const status = meta.status?.toUpperCase() || 'UNKNOWN'
  const statusStyle = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
  
  return (
    <div className="space-y-8">
      {/* Header Card with Key Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${statusStyle.dot}`}></div>
              <h2 className="text-xl font-semibold text-gray-900">
                {meta.report_type_name || meta.type || 'Report'}
              </h2>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                <span>{statusStyle.icon}</span>
                {status}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Report ID:</span>
                <div className="font-mono text-gray-900 mt-1">{meta.id || meta.report_id || '-'}</div>
              </div>
              <div>
                <span className="text-gray-500">Source:</span>
                <div className="font-semibold text-gray-900 mt-1 uppercase">
                  {meta.report_source || meta.source || '-'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Tenant:</span>
                <div className="font-medium text-gray-900 mt-1">{meta.tenant_name || meta.tenant || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Created</div>
              <div className="text-sm text-gray-500">
                {meta.created_at ? new Date(meta.created_at).toLocaleString() : '-'}
              </div>
            </div>
          </div>
          
          {meta.completed_at && (
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {status === 'COMPLETED' ? 'Completed' : 'Failed'}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(meta.completed_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          
          {meta.rows_processed && (
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Rows Processed</div>
                <div className="text-sm text-gray-500">{meta.rows_processed.toLocaleString()} rows</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {meta.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-500 text-xl">⚠</div>
            <div>
              <h3 className="text-sm font-semibold text-red-900 mb-2">Error Details</h3>
              <p className="text-sm text-red-700">{meta.error_message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameters */}
        {meta.parameters && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-xs text-blue-600">⚙</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Parameters</h3>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 max-h-80 overflow-y-auto">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(meta.parameters, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Metrics */}
        {meta.metrics && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                <span className="text-xs text-green-600">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Metrics</h3>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 max-h-80 overflow-y-auto">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(meta.metrics, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible raw JSON */}
      <details className="bg-white border border-gray-200 rounded-lg">
        <summary className="p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">Raw Data</span>
            <span className="text-sm text-gray-500">(Click to expand)</span>
          </div>
        </summary>
        <div className="p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 max-h-96 overflow-auto">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
              {JSON.stringify(meta, null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </div>
  )
}

