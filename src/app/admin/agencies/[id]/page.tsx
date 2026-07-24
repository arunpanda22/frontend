'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import {
  useAdminAgencyDetails,
  useAdminAgencySellers,
  useAdminUsers,
  useAdminQueryRefresh
} from '@/lib/hooks/queries/use-admin'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

type PendingConfirm =
  | { type: 'removeSeller'; sellerId: number; sellerEmail: string }
  | { type: 'removeAgencyUser'; userId: number; userEmail: string }
  | { type: 'deleteAgency' }
  | null

export default function AdminAgencyDetailPage() {
  const params = useParams<{ id: string }>()
  const agencyId = useMemo(() => Number(params?.id), [params])

  const agencyQuery = useAdminAgencyDetails(agencyId)
  const agencySellersQuery = useAdminAgencySellers(agencyId)
  const agencyUsersQuery = useAdminUsers({ role_name: 'agency', page_size: 1000 })
  const plainUsersQuery = useAdminUsers({ role_name: 'user', page_size: 1000 })

  const { refreshAgencies, refreshUsers, refreshAgencySellers } = useAdminQueryRefresh()

  const agency = agencyQuery.data

  const [status, setStatus] = useState<{ saving: boolean; message?: string; error?: string }>({ saving: false })
  const [editMode, setEditMode] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', is_active: true })

  const [selectedSellersToAssign, setSelectedSellersToAssign] = useState<number[]>([])
  const [serviceTier, setServiceTier] = useState('')
  const [searchAssigned, setSearchAssigned] = useState('')
  const [searchUnassigned, setSearchUnassigned] = useState('')

  const [selectedAgencyUserId, setSelectedAgencyUserId] = useState('')
  const [searchEligibleUsers, setSearchEligibleUsers] = useState('')

  const currentAgencyUsers = useMemo(() => {
    const all = agencyUsersQuery.data?.results || []
    return all.filter((u: any) => u.current_role?.agency_id === agencyId)
  }, [agencyUsersQuery.data, agencyId])

  const eligibleUsers = useMemo(() => {
    const all = plainUsersQuery.data?.results || []
    if (!searchEligibleUsers) return all
    const s = searchEligibleUsers.toLowerCase()
    return all.filter((u: any) =>
      u.email.toLowerCase().includes(s) || u.display_name?.toLowerCase().includes(s)
    )
  }, [plainUsersQuery.data, searchEligibleUsers])

  // Source of truth now comes from the dedicated backend endpoint, which computes
  // the split from AgencyClientAssignment directly instead of guessing from
  // current_role.agency_id (which is always null for sellers, since only the
  // agency-role user's own UserRole carries the agency FK).
  const assignedSellers = agencySellersQuery.data?.assigned_sellers || []
  const unassignedSellers = agencySellersQuery.data?.available_sellers || []

  const filteredAssigned = useMemo(() => {
    if (!searchAssigned) return assignedSellers
    const s = searchAssigned.toLowerCase()
    return assignedSellers.filter((seller: any) =>
      seller.email.toLowerCase().includes(s) || seller.display_name?.toLowerCase().includes(s)
    )
  }, [assignedSellers, searchAssigned])

  const filteredUnassigned = useMemo(() => {
    if (!searchUnassigned) return unassignedSellers
    const s = searchUnassigned.toLowerCase()
    return unassignedSellers.filter((seller: any) =>
      seller.email.toLowerCase().includes(s) || seller.display_name?.toLowerCase().includes(s)
    )
  }, [unassignedSellers, searchUnassigned])

  const startEdit = () => {
    if (!agency) return
    setEditForm({ name: agency.name, description: agency.description || '', is_active: agency.is_active })
    setEditMode(true)
  }

  const handleSaveEdit = async () => {
    setStatus({ saving: true })
    try {
      await adminDashboardService.updateAgency(agencyId, editForm)
      setEditMode(false)
      await refreshAgencies()
      setStatus({ saving: false, message: 'Agency updated' })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || 'Failed to update agency' })
      setTimeout(() => setStatus({ saving: false }), 5000)
    }
  }

  const handleAssignSellers = async () => {
    if (selectedSellersToAssign.length === 0) return
    setStatus({ saving: true })
    try {
      const promises = selectedSellersToAssign.map(sellerId =>
        adminDashboardService.assignSellerToAgency(sellerId, agencyId, {
          serviceTier: serviceTier || undefined
        })
      )
      await Promise.all(promises)
      setSelectedSellersToAssign([])
      setServiceTier('')
      await Promise.all([refreshAgencySellers(agencyId), refreshAgencies()])
      setStatus({ saving: false, message: `Assigned ${selectedSellersToAssign.length} seller(s)` })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || 'Failed to assign sellers' })
      setTimeout(() => setStatus({ saving: false }), 5000)
    }
  }

  const handleAssignAgencyUser = async () => {
    if (!selectedAgencyUserId) return
    setStatus({ saving: true })
    try {
      await adminDashboardService.changeUserRole(
        parseInt(selectedAgencyUserId),
        'agency',
        { agencyId }
      )
      setSelectedAgencyUserId('')
      await Promise.all([refreshUsers(), refreshAgencies()])
      setStatus({ saving: false, message: 'Agency user assigned' })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || 'Failed to assign agency user' })
      setTimeout(() => setStatus({ saving: false }), 5000)
    }
  }

  const handleRemoveAgencyUser = (userId: number, userEmail: string) => {
    setPendingConfirm({ type: 'removeAgencyUser', userId, userEmail })
  }

  const executeRemoveAgencyUser = async (userId: number, userEmail: string) => {
    setStatus({ saving: true })
    try {
      await adminDashboardService.removeAgencyRole(userId)
      await Promise.all([refreshUsers(), refreshAgencies()])
      setStatus({ saving: false, message: `Removed ${userEmail} from agency` })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || 'Failed to remove agency user' })
      setTimeout(() => setStatus({ saving: false }), 5000)
    } finally {
      setPendingConfirm(null)
    }
  }

  const handleRemoveSeller = (sellerId: number, sellerEmail: string) => {
    setPendingConfirm({ type: 'removeSeller', sellerId, sellerEmail })
  }

  const executeRemoveSeller = async (sellerId: number, sellerEmail: string) => {
    setStatus({ saving: true })
    try {
      await adminDashboardService.removeSellerFromAgency(sellerId, agencyId)
      await Promise.all([refreshAgencySellers(agencyId), refreshAgencies()])
      setStatus({ saving: false, message: `Removed ${sellerEmail}` })
      setTimeout(() => setStatus({ saving: false }), 3000)
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || 'Failed to remove seller' })
      setTimeout(() => setStatus({ saving: false }), 5000)
    } finally {
      setPendingConfirm(null)
    }
  }

  const handleDeleteAgency = () => {
    if (!agency) return
    if (assignedSellers.length > 0 || (agency.agency_staff_count ?? 0) > 0) {
      setStatus({ saving: false, error: 'Cannot delete an agency with assigned sellers or agency users' })
      return
    }
    setPendingConfirm({ type: 'deleteAgency' })
  }

  const executeDeleteAgency = async () => {
    setStatus({ saving: true })
    try {
      await adminDashboardService.deleteAgency(agencyId)
      window.location.href = '/admin/agencies'
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || 'Failed to delete agency' })
      setTimeout(() => setStatus({ saving: false }), 5000)
      setPendingConfirm(null)
    }
  }

  if (agencyQuery.isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Loading agency...
        </div>
      </div>
    )
  }

  if (agencyQuery.isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-900 mb-2">Error Loading Agency</h1>
          <p className="text-red-700">
            {(agencyQuery.error as any)?.response?.status === 404
              ? 'This agency was not found, or you do not have access to it.'
              : 'Failed to load agency details'}
          </p>
          <Link href="/admin/agencies" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
            ← Back to Agencies
          </Link>
        </div>
      </div>
    )
  }

  if (!agency) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/agencies" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">{agency.name}</h1>
            {!agency.is_active && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-mono ml-8">{agency.slug}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { refreshAgencies(); refreshUsers(); refreshAgencySellers(agencyId) }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
          <button
            onClick={handleDeleteAgency}
            disabled={status.saving}
            className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {status.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{status.error}</div>
      )}
      {status.message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">{status.message}</div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">Assigned Sellers</div>
          <div className="text-2xl font-bold text-green-900">{assignedSellers.length}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">Agency Users</div>
          <div className="text-2xl font-bold text-blue-900">{agency.agency_staff_count ?? 0}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 mb-1">Staff (under sellers)</div>
          <div className="text-2xl font-bold text-purple-900">{agency.staff_count ?? 0}</div>
        </div>
      </div>

      {/* Agency Details / Edit */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Agency Details</h3>
          {!editMode && (
            <button onClick={startEdit} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={status.saving}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {status.saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{agency.description || 'No description'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(agency.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Agency Login User */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Agency Login User</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
            <p className="text-sm text-blue-800">
              This is the account your client logs in with to switch between their linked seller
              accounts. It must be a plain user with no existing seller/Amazon connection.
            </p>
          </div>

          {currentAgencyUsers.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-sm text-amber-800">No agency user assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentAgencyUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-sm">{u.display_name || u.email}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      View User
                    </Link>
                    <button
                      onClick={() => handleRemoveAgencyUser(u.id, u.email)}
                      disabled={status.saving}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign a User Account ({eligibleUsers.length} available)
            </label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchEligibleUsers}
              onChange={(e) => setSearchEligibleUsers(e.target.value)}
              className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
            <select
              value={selectedAgencyUserId}
              onChange={(e) => setSelectedAgencyUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={plainUsersQuery.isLoading}
            >
              <option value="">Select user...</option>
              {eligibleUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.display_name || u.email} ({u.email})</option>
              ))}
            </select>
            <div className="flex justify-end pt-3">
              <button
                onClick={handleAssignAgencyUser}
                disabled={!selectedAgencyUserId || status.saving}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {status.saving ? 'Assigning...' : 'Assign as Agency User'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Sellers */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Seller Accounts</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
            <p className="text-sm text-blue-800">
              Only sellers not currently linked to any agency are shown. Assigning links their existing
              Amazon-connected seller account to this agency, enabling seamless switching for the agency user.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Available Sellers ({filteredUnassigned.length})
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={searchUnassigned}
                onChange={(e) => setSearchUnassigned(e.target.value)}
                className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {agencySellersQuery.isLoading ? (
                <div className="p-4 text-sm text-gray-500 text-center">Loading sellers...</div>
              ) : filteredUnassigned.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">No unassigned sellers found</div>
              ) : (
                <div className="divide-y">
                  {filteredUnassigned.map((s: any) => (
                    <label key={s.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSellersToAssign.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSellersToAssign(prev => [...prev, s.id])
                          else setSelectedSellersToAssign(prev => prev.filter(id => id !== s.id))
                        }}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium">{s.display_name || s.email}</div>
                        <div className="text-xs text-gray-500">{s.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedSellersToAssign.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Service Tier <span className="text-gray-400">(optional, applies to all selected)</span>
                </label>
                <input
                  type="text"
                  value={serviceTier}
                  onChange={(e) => setServiceTier(e.target.value)}
                  placeholder="e.g. premium"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => { setSelectedSellersToAssign([]); setServiceTier('') }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear ({selectedSellersToAssign.length})
                </button>
                <button
                  onClick={handleAssignSellers}
                  disabled={status.saving}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {status.saving ? 'Assigning...' : `Assign ${selectedSellersToAssign.length} Seller(s)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Sellers */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Assigned Sellers ({filteredAssigned.length})
          </h3>
          <input
            type="text"
            placeholder="Search assigned sellers..."
            value={searchAssigned}
            onChange={(e) => setSearchAssigned(e.target.value)}
            className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md"
          />
        </div>
        {agencySellersQuery.isLoading ? (
          <p className="text-gray-500 text-sm">Loading assigned sellers...</p>
        ) : filteredAssigned.length === 0 ? (
          <p className="text-gray-500 text-sm">No sellers assigned to this agency yet</p>
        ) : (
          <div className="space-y-2">
            {filteredAssigned.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                <div>
                  <div className="font-medium text-sm">{s.display_name || s.email}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/users/${s.id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    View User
                  </Link>
                  <button
                    onClick={() => handleRemoveSeller(s.id, s.email)}
                    disabled={status.saving}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingConfirm?.type === 'removeSeller'}
        title="Remove Seller from Agency"
        message={
          pendingConfirm?.type === 'removeSeller'
            ? `Remove ${pendingConfirm.sellerEmail} from this agency? They'll keep their seller role.`
            : ''
        }
        confirmLabel="Remove"
        isLoading={status.saving}
        onConfirm={() => {
          if (pendingConfirm?.type === 'removeSeller') {
            executeRemoveSeller(pendingConfirm.sellerId, pendingConfirm.sellerEmail)
          }
        }}
        onCancel={() => setPendingConfirm(null)}
      />

      <ConfirmDialog
        open={pendingConfirm?.type === 'removeAgencyUser'}
        title="Remove Agency User"
        message={
          pendingConfirm?.type === 'removeAgencyUser'
            ? `Remove ${pendingConfirm.userEmail} as the agency user? They'll revert to basic user access.`
            : ''
        }
        confirmLabel="Remove"
        isLoading={status.saving}
        onConfirm={() => {
          if (pendingConfirm?.type === 'removeAgencyUser') {
            executeRemoveAgencyUser(pendingConfirm.userId, pendingConfirm.userEmail)
          }
        }}
        onCancel={() => setPendingConfirm(null)}
      />

      <ConfirmDialog
        open={pendingConfirm?.type === 'deleteAgency'}
        title="Delete Agency"
        message={agency ? `Delete agency "${agency.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        isLoading={status.saving}
        onConfirm={executeDeleteAgency}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  )
}