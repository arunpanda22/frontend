'use client'

import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import { 
  useAdminUserDetails, 
  useAdminUserPermissions,
  useAdminRoles, 
  useAdminPermissions, 
  useAdminAgencies,
  useAdminQueryRefresh, 
  useAdminUsers
} from '@/lib/hooks/queries/use-admin'
import UserDetailsForm from '@/components/admin/UserDetailsForm'

export default function AdminUserManagePage() {
  const params = useParams<{ id: string }>()
  const userId = useMemo(() => Number(params?.id), [params])

  const userQuery = useAdminUserDetails(userId.toString())
  const userPermissionsQuery = useAdminUserPermissions(userId.toString())
  
  const shouldFetchMetadata = Boolean(userQuery.data && !userQuery.error)
  const rolesQuery = useAdminRoles({ enabled: shouldFetchMetadata })
  const permissionsQuery = useAdminPermissions({ enabled: shouldFetchMetadata })
  const agenciesQuery = useAdminAgencies({ enabled: shouldFetchMetadata })
  
  const sellersQuery = useAdminUsers({ role_name: 'seller', page_size: 1000 })
  const staffUsersQuery = useAdminUsers({ role_name: 'user', page_size: 1000 })

  const { refreshUserDetails, refreshUserPermissions, refreshUsers } = useAdminQueryRefresh()

  const user = userQuery.data
  const currentRole = user?.current_role
  const userPermissions = useMemo(() => userPermissionsQuery.data?.permission_overrides || [], [userPermissionsQuery.data])
  
  const availableRoles = useMemo(() => rolesQuery.data?.roles || [], [rolesQuery.data])
  const availablePermissions = useMemo(() => permissionsQuery.data?.permissions || [], [permissionsQuery.data])
  const agencies = useMemo(() => agenciesQuery.data || [], [agenciesQuery.data])
  const allSellers = useMemo(() => sellersQuery.data?.results || [], [sellersQuery.data])
  const allStaffUsers = useMemo(() => staffUsersQuery.data?.results || [], [staffUsersQuery.data])

  const [status, setStatus] = useState<{ saving: boolean; message?: string; error?: string }>({ saving: false })
  const [activeTab, setActiveTab] = useState<'role' | 'permissions' | 'assignments'>('role')

  const [roleChange, setRoleChange] = useState({
    new_role: '' as 'super_admin' | 'admin' | 'agency' | 'seller' | 'user' | '',
    agency_id: '',
    parent_seller_id: ''
  })

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [bulkGranted, setBulkGranted] = useState(true)
  const [bulkReason, setBulkReason] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Admin agency assignments
  const [selectedAgenciesToAssign, setSelectedAgenciesToAssign] = useState<number[]>([])

  // Seller-agency assignments
  const [selectedAgencyForSellers, setSelectedAgencyForSellers] = useState('')
  const [selectedSellersToAssign, setSelectedSellersToAssign] = useState<number[]>([])
  const [searchAssignedSellers, setSearchAssignedSellers] = useState('')
  const [searchUnassignedSellers, setSearchUnassignedSellers] = useState('')

  // Staff assignments
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState<number[]>([])
  const [searchAssignedStaff, setSearchAssignedStaff] = useState('')
  const [searchUnassignedStaff, setSearchUnassignedStaff] = useState('')

  const { assignedSellers, unassignedSellers } = useMemo(() => {
    const assigned = allSellers.filter(s => s.current_role?.agency_name != null)
    const unassigned = allSellers.filter(s => s.current_role?.agency_name == null)
    return { assignedSellers: assigned, unassignedSellers: unassigned }
  }, [allSellers])

  const { assignedStaff, unassignedStaff } = useMemo(() => {
    const assigned = allStaffUsers.filter(u => u.current_role?.parent_seller_id === userId)
    const unassigned = allStaffUsers.filter(u => 
      u.current_role?.parent_seller_id == null || 
      u.current_role?.parent_seller_id !== userId
    )
    return { assignedStaff: assigned, unassignedStaff: unassigned }
  }, [allStaffUsers, userId])

  const filteredAssignedSellers = useMemo(() => {
    if (!searchAssignedSellers) return assignedSellers
    const s = searchAssignedSellers.toLowerCase()
    return assignedSellers.filter(seller =>
      seller.email.toLowerCase().includes(s) ||
      seller.display_name?.toLowerCase().includes(s) ||
      seller.current_role?.agency_name?.toLowerCase().includes(s)
    )
  }, [assignedSellers, searchAssignedSellers])

  const filteredUnassignedSellers = useMemo(() => {
    if (!searchUnassignedSellers) return unassignedSellers
    const s = searchUnassignedSellers.toLowerCase()
    return unassignedSellers.filter(seller =>
      seller.email.toLowerCase().includes(s) ||
      seller.display_name?.toLowerCase().includes(s)
    )
  }, [unassignedSellers, searchUnassignedSellers])

  const filteredAssignedStaff = useMemo(() => {
    if (!searchAssignedStaff) return assignedStaff
    const s = searchAssignedStaff.toLowerCase()
    return assignedStaff.filter(u =>
      u.email.toLowerCase().includes(s) ||
      u.display_name?.toLowerCase().includes(s)
    )
  }, [assignedStaff, searchAssignedStaff])

  const filteredUnassignedStaff = useMemo(() => {
    if (!searchUnassignedStaff) return unassignedStaff
    const s = searchUnassignedStaff.toLowerCase()
    return unassignedStaff.filter(u =>
      u.email.toLowerCase().includes(s) ||
      u.display_name?.toLowerCase().includes(s)
    )
  }, [unassignedStaff, searchUnassignedStaff])

  const availableCategories = useMemo(() => {
    const categories = [...new Set(availablePermissions.map((p: any) => p.category))]
    return categories.sort()
  }, [availablePermissions])

  const filteredPermissions = useMemo(() => {
    let filtered = availablePermissions
    if (selectedCategory) filtered = filtered.filter((p: any) => p.category === selectedCategory)
    if (permissionSearch) {
      const s = permissionSearch.toLowerCase()
      filtered = filtered.filter((p: any) => 
        p.name.toLowerCase().includes(s) || p.codename.toLowerCase().includes(s)
      )
    }
    return filtered
  }, [availablePermissions, permissionSearch, selectedCategory])

  const roleRequiresAgency = useMemo(() => roleChange.new_role === 'agency', [roleChange.new_role])
  const roleSupportsParentSeller = useMemo(() => roleChange.new_role === 'user', [roleChange.new_role])

  const availableTabs = useMemo(() => {
    const tabs: Array<{ key: string; label: string; count?: number }> = [
      { key: 'role', label: 'Role Management' }
    ]

    if (currentRole) {
      const roleCode = currentRole.role_code

      if (roleCode === 'admin') {
        tabs.push({ 
          key: 'assignments', 
          label: 'Agency Management',
          count: 0 // Will show managed agencies count
        })
      }

      if (roleCode === 'seller') {
        tabs.push({ 
          key: 'assignments', 
          label: 'Staff Management',
          count: assignedStaff.length
        })
      }

      tabs.push({ 
        key: 'permissions', 
        label: 'Permission Overrides',
        count: userPermissions.length
      })
    }

    return tabs
  }, [currentRole, userPermissions.length, assignedStaff.length])

  const managedAgencies = useMemo(() => {
    if (!user || user.current_role?.role_code !== 'admin') return []
    return user.managed_agencies || []
  }, [user])

  const handleUpdateUserDetails = async (updates: {
    first_name?: string
    last_name?: string
    username?: string
    is_active?: boolean
  }) => {
    setStatus({ saving: true })
    try {
      const response = await adminDashboardService.updateUser(userId, updates)
      await refreshUserDetails(userId.toString())
      
      setStatus({ 
        saving: false, 
        message: response.message || 'User details updated successfully' 
      })
    } catch (error: any) {
      setStatus({ 
        saving: false, 
        error: error?.response?.data?.error || error?.message || 'Failed to update user details' 
      })
    }
  }


  const handleChangeRole = async () => {
    if (!roleChange.new_role) return
    if (roleRequiresAgency && !roleChange.agency_id) return
    
    setStatus({ saving: true })
    try {
      await adminDashboardService.changeUserRole(userId, roleChange.new_role, {
        agencyId: roleChange.agency_id ? parseInt(roleChange.agency_id) : undefined,
        parentSellerId: roleChange.parent_seller_id ? parseInt(roleChange.parent_seller_id) : undefined
      })
      
      setRoleChange({ new_role: '', agency_id: '', parent_seller_id: '' })
      refreshUserDetails(userId.toString())
      setStatus({ saving: false, message: 'Role changed successfully' })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || e?.message || 'Failed to change role' })
    }
  }

  const handleBulkPermissionOverride = async () => {
    if (selectedPermissions.length === 0) return
    
    setStatus({ saving: true })
    try {
      const promises = selectedPermissions.map(permissionId =>
        adminDashboardService.grantUserPermission(userId, {
          permission_id: permissionId,
          is_granted: bulkGranted,
          reason: bulkReason || `Bulk ${bulkGranted ? 'grant' : 'revoke'}`
        })
      )
      
      await Promise.all(promises)
      setSelectedPermissions([])
      setBulkReason('')
      refreshUserPermissions(userId.toString())
      setStatus({ saving: false, message: `${bulkGranted ? 'Granted' : 'Revoked'} ${selectedPermissions.length} permission(s)` })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || 'Failed to update permissions' })
    }
  }

  const handleRemovePermissionOverride = async (overrideId: number) => {
    setStatus({ saving: true })
    try {
      await adminDashboardService.removePermissionOverride(userId, overrideId)
      refreshUserPermissions(userId.toString())
      setStatus({ saving: false, message: 'Permission override removed' })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.response?.data?.error || 'Failed to remove override' })
    }
  }

  const handleAssignAdminAgencies = async () => {
    if (selectedAgenciesToAssign.length === 0) {
      setStatus({ saving: false, error: 'Select at least one agency' })
      return
    }

    setStatus({ saving: true })
    try {
      await adminDashboardService.assignAdminToAgencies(userId, selectedAgenciesToAssign)
      setSelectedAgenciesToAssign([])
      await refreshUsers()
      setStatus({ saving: false, message: `Assigned ${selectedAgenciesToAssign.length} agency/agencies` })
    } catch (error: any) {
      setStatus({ saving: false, error: error?.response?.data?.error || 'Failed to assign agencies' })
    }
  }

  const handleAssignSellers = async () => {
    if (selectedSellersToAssign.length === 0 || !selectedAgencyForSellers) {
      setStatus({ saving: false, error: 'Select agency and sellers' })
      return
    }

    setStatus({ saving: true })
    try {
      const promises = selectedSellersToAssign.map(sellerId =>
        adminDashboardService.assignSellerToAgency(sellerId, parseInt(selectedAgencyForSellers))
      )
      await Promise.all(promises)
      setSelectedSellersToAssign([])
      setSelectedAgencyForSellers('')
      await refreshUsers()
      setStatus({ saving: false, message: `Assigned ${selectedSellersToAssign.length} seller(s)` })
    } catch (error: any) {
      setStatus({ saving: false, error: error?.response?.data?.error || 'Failed to assign sellers' })
    }
  }

  const handleRemoveSeller = async (sellerId: number, agencyId: number, sellerEmail: string) => {
    if (!confirm(`Remove ${sellerEmail} from agency? They'll keep seller role.`)) return

    setStatus({ saving: true })
    try {
      await adminDashboardService.removeSellerFromAgency(sellerId, agencyId)
      await refreshUsers()
      setStatus({ saving: false, message: `Removed ${sellerEmail}` })
    } catch (error: any) {
      setStatus({ saving: false, error: error?.response?.data?.error || 'Failed to remove' })
    }
  }

  const handleAssignStaff = async () => {
    if (selectedStaffToAssign.length === 0) {
      setStatus({ saving: false, error: 'Select at least one user' })
      return
    }

    setStatus({ saving: true })
    try {
      const promises = selectedStaffToAssign.map(staffUserId =>
        adminDashboardService.assignUserToSeller(staffUserId, userId, { access_level: 'limited' })
      )
      await Promise.all(promises)
      setSelectedStaffToAssign([])
      await refreshUsers()
      setStatus({ saving: false, message: `Assigned ${selectedStaffToAssign.length} user(s)` })
    } catch (error: any) {
      setStatus({ saving: false, error: error?.response?.data?.error || 'Failed to assign staff' })
    }
  }

  const handleRemoveStaff = async (staffUserId: number, staffEmail: string) => {
    if (!confirm(`Remove ${staffEmail} from staff? They'll keep user role.`)) return

    setStatus({ saving: true })
    try {
      await adminDashboardService.removeUserFromSeller(staffUserId)
      await refreshUsers()
      setStatus({ saving: false, message: `Removed ${staffEmail}` })
    } catch (error: any) {
      setStatus({ saving: false, error: error?.response?.data?.error || 'Failed to remove' })
    }
  }

  const handleRemoveAdminAgency = async (agencyId: number, agencyName: string) => {
    if (!confirm(`Remove ${user?.email} from managing ${agencyName}?`)) return

    setStatus({ saving: true })
    try {
      await adminDashboardService.removeAdminFromAgency(userId, agencyId)
      await refreshUserDetails(userId.toString())
      setStatus({ saving: false, message: `Removed from ${agencyName}` })
    } catch (error: any) {
      setStatus({ saving: false, error: error?.response?.data?.error || 'Failed to remove agency' })
    }
  }

  if (userQuery.isLoading) return <div className="p-4">Loading...</div>
  if (userQuery.isError && (userQuery.error as any)?.response?.status === 403) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><div className="bg-red-50 border border-red-200 rounded-lg p-6"><h1 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h1><p className="text-red-700">You don't have permission to manage users.</p></div></div>
  }
  if (userQuery.isError) return <div className="p-4 text-red-600">Failed to load user</div>
  if (!user) return <div className="p-4">User not found</div>

  const getRoleBadgeColor = (roleCode: string) => {
    switch (roleCode) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'agency': return 'bg-blue-100 text-blue-800'
      case 'seller': return 'bg-green-100 text-green-800'
      case 'user': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Manage User</h1>
          <p className="text-gray-600 mt-1">
            {user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email}
            <span className="text-gray-400 mx-2">•</span>
            {user.email}
          </p>
        </div>
        <button onClick={() => { refreshUserDetails(userId.toString()); refreshUserPermissions(userId.toString()) }} disabled={userQuery.isLoading} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Refresh</button>
      </div>

      {status.error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{status.error}</div>}
      {status.message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">{status.message}</div>}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Current Role</h3>
        {currentRole ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-md font-medium ${getRoleBadgeColor(currentRole.role_code)}`}>{currentRole.role_name}</span>
              {currentRole.agency_name && <span className="text-sm text-blue-700">Agency: {currentRole.agency_name}</span>}
              {currentRole.parent_seller_email && <span className="text-sm text-blue-700">Staff under: {currentRole.parent_seller_email}</span>}
            </div>
            <p className="text-xs text-blue-600">Assigned {new Date(currentRole.assigned_at).toLocaleDateString()}{currentRole.assigned_by_email && ` by ${currentRole.assigned_by_email}`}</p>
          </div>
        ) : (
          <p className="text-sm text-blue-700">No role assigned</p>
        )}
      </div>

      <UserDetailsForm
        user={{
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active
        }}
        onUpdate={handleUpdateUserDetails}
        isUpdating={status.saving}
      />


      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'role' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Change User Role</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Role *</label>
              <select value={roleChange.new_role} onChange={(e) => setRoleChange(prev => ({ ...prev, new_role: e.target.value as any, agency_id: '', parent_seller_id: '' }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">Select role...</option>
                <option value="super_admin">Super Admin - Full system access</option>
                <option value="admin">Admin - Manage agencies and users</option>
                <option value="agency">Agency - Manage sellers as clients</option>
                <option value="seller">Seller - Amazon account holder</option>
                <option value="user">User - Basic access</option>
              </select>
            </div>
            {roleRequiresAgency && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agency *</label>
                <select value={roleChange.agency_id} onChange={(e) => setRoleChange(prev => ({ ...prev, agency_id: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">Select agency...</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            {roleSupportsParentSeller && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Seller (Optional)</label>
                <select value={roleChange.parent_seller_id} onChange={(e) => setRoleChange(prev => ({ ...prev, parent_seller_id: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" disabled={sellersQuery.isLoading}>
                  <option value="">Select seller (optional)...</option>
                  {allSellers.map(s => <option key={s.id} value={s.id}>{s.display_name || `${s.first_name} ${s.last_name}`.trim() || s.email}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">Assign as staff for a seller</p>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t">
              <button onClick={handleChangeRole} disabled={!roleChange.new_role || (roleRequiresAgency && !roleChange.agency_id) || status.saving} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                {status.saving ? 'Changing...' : 'Change Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && currentRole?.role_code === 'admin' && (
  <div className="space-y-6">
    {/* Current Managed Agencies */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Currently Managing ({managedAgencies.length} {managedAgencies.length === 1 ? 'Agency' : 'Agencies'})
        </h3>
      </div>
      
      {managedAgencies.length === 0 ? (
  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
    <p className="text-sm text-amber-800">
      This admin is not currently managing any agencies. Assign agencies below to grant management access.
    </p>
  </div>
) : (
  <div className="space-y-2">
    {managedAgencies.map((ma) => (
      <div key={ma.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{ma.agency_name}</span>
            <span className="text-xs text-gray-500">({ma.agency_slug})</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Assigned {new Date(ma.assigned_at).toLocaleDateString()}
            {ma.assigned_by_email && ` by ${ma.assigned_by_email}`}
          </div>
        </div>
        <button
          onClick={() => handleRemoveAdminAgency(ma.agency_id, ma.agency_name)}
          disabled={status.saving}
          className="ml-4 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    ))}
  </div>
)}
    </div>

    {/* Assign/Update Agencies */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {managedAgencies.length > 0 ? 'Update Agency Assignments' : 'Assign Agencies'}
      </h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
          <p className="text-sm text-blue-800">
            {managedAgencies.length > 0 
              ? 'Selecting new agencies will replace current assignments. This admin will only manage the newly selected agencies.'
              : 'Select agencies this admin should manage. Admins can manage sellers within their assigned agencies.'
            }
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Agencies ({selectedAgenciesToAssign.length} selected)
          </label>
          <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto p-3 space-y-2">
            {agencies.map(a => {
              const isCurrentlyManaged = managedAgencies.some(ma => ma.agency_id === a.id)
              return (
                <label 
                  key={a.id} 
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    isCurrentlyManaged ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedAgenciesToAssign.includes(a.id)} 
                    onChange={(e) => { 
                      if (e.target.checked) 
                        setSelectedAgenciesToAssign(prev => [...prev, a.id])
                      else 
                        setSelectedAgenciesToAssign(prev => prev.filter(id => id !== a.id)) 
                    }} 
                    className="h-4 w-4 text-blue-600 rounded" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{a.name}</span>
                      {isCurrentlyManaged && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Currently Managed
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{a.slug}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
        
        {selectedAgenciesToAssign.length > 0 && (
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button 
              onClick={() => setSelectedAgenciesToAssign([])} 
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Selection
            </button>
            <button 
              onClick={handleAssignAdminAgencies} 
              disabled={status.saving} 
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {status.saving ? 'Assigning...' : `${managedAgencies.length > 0 ? 'Update' : 'Assign'} ${selectedAgenciesToAssign.length} ${selectedAgenciesToAssign.length === 1 ? 'Agency' : 'Agencies'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {activeTab === 'assignments' && currentRole?.role_code === 'seller' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Staff Users</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                <p className="text-sm text-blue-800">Staff can view/manage this seller's dashboards based on permissions.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Available Users ({filteredUnassignedStaff.length})</label>
                  <input type="text" placeholder="Search..." value={searchUnassignedStaff} onChange={(e) => setSearchUnassignedStaff(e.target.value)} className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md" />
                </div>
                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                  {filteredUnassignedStaff.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">No users found</div>
                  ) : (
                    <div className="divide-y">
                      {filteredUnassignedStaff.map(u => (
                        <label key={u.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={selectedStaffToAssign.includes(u.id)} onChange={(e) => { if (e.target.checked) setSelectedStaffToAssign(prev => [...prev, u.id]); else setSelectedStaffToAssign(prev => prev.filter(id => id !== u.id)) }} className="h-4 w-4 text-blue-600 rounded" />
                          <div className="ml-3"><div className="text-sm font-medium">{u.display_name || u.email}</div><div className="text-xs text-gray-500">{u.email}</div></div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {selectedStaffToAssign.length > 0 && (
                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button onClick={() => setSelectedStaffToAssign([])} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Clear ({selectedStaffToAssign.length})</button>
                  <button onClick={handleAssignStaff} disabled={status.saving} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {status.saving ? 'Assigning...' : `Assign ${selectedStaffToAssign.length} User(s)`}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Current Staff ({filteredAssignedStaff.length})</h3>
              <input type="text" placeholder="Search staff..." value={searchAssignedStaff} onChange={(e) => setSearchAssignedStaff(e.target.value)} className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md" />
            </div>
            {filteredAssignedStaff.length === 0 ? (
              <p className="text-gray-500 text-sm">No staff assigned</p>
            ) : (
              <div className="space-y-2">
                {filteredAssignedStaff.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded">
                    <div><div className="font-medium text-sm">{u.display_name || u.email}</div><div className="text-xs text-gray-500">{u.email}<span className="ml-2 text-green-600">• Staff</span></div></div>
                    <button onClick={() => handleRemoveStaff(u.id, u.email)} disabled={status.saving} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Permission Overrides</h3>
            <div className="space-y-4">
              <div className="border border-gray-300 rounded-md max-h-80 overflow-y-auto">
                <div className="sticky top-0 bg-white p-3 border-b space-y-3">
                  <input type="text" placeholder="Search permissions..." value={permissionSearch} onChange={(e) => setPermissionSearch(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md" />
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
                    <option value="">All Categories</option>
                    {availableCategories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="p-3 space-y-2">
                  {filteredPermissions.map((perm: any) => (
                    <label key={perm.id} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer">
                      <input type="checkbox" checked={selectedPermissions.includes(perm.id)} onChange={(e) => { if (e.target.checked) setSelectedPermissions(prev => [...prev, perm.id]); else setSelectedPermissions(prev => prev.filter(p => p !== perm.id)) }} className="h-4 w-4 text-blue-600 rounded" />
                      <div className="flex-1"><div className="text-sm font-medium">{perm.name}</div><div className="text-xs text-gray-500">{perm.codename} • {perm.category}</div></div>
                    </label>
                  ))}
                </div>
              </div>
              {selectedPermissions.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-3">Override Settings ({selectedPermissions.length} selected)</h4>
                  <div className="space-y-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input type="radio" checked={bulkGranted} onChange={() => setBulkGranted(true)} className="h-4 w-4 text-green-600" />
                        <span className="ml-2 text-sm text-green-700">Grant</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" checked={!bulkGranted} onChange={() => setBulkGranted(false)} className="h-4 w-4 text-red-600" />
                        <span className="ml-2 text-sm text-red-700">Revoke</span>
                      </label>
                    </div>
                    <input type="text" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} placeholder="Reason (optional)" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md" />
                    <div className="flex justify-end space-x-3 pt-3 border-t">
                      <button onClick={() => { setSelectedPermissions([]); setBulkReason('') }} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Clear</button>
                      <button onClick={handleBulkPermissionOverride} disabled={status.saving} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                        {status.saving ? 'Saving...' : `Apply ${selectedPermissions.length} Override(s)`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Permission Overrides</h3>
            {userPermissions.length === 0 ? (
              <p className="text-gray-500 text-sm">No permission overrides</p>
            ) : (
              <div className="space-y-2">
                {userPermissions.map((override: any) => (
                  <div key={override.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{override.permission_name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${override.is_granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {override.is_granted ? 'Granted' : 'Revoked'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{override.permission_codename} • {override.permission_category}</div>
                      {override.reason && <div className="text-xs text-gray-600 mt-1">Reason: {override.reason}</div>}
                    </div>
                    <button onClick={() => handleRemovePermissionOverride(override.id)} disabled={status.saving} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}