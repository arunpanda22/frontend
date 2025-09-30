'use client'

import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import { 
  useAdminUserDetails, 
  useAdminUserPermissions,
  useAdminRoles, 
  useAdminPermissions, 
  useAdminAgencies,
  useAdminQueryRefresh 
} from '@/lib/hooks/queries/use-admin'

export default function AdminUserManagePage() {
  const params = useParams<{ id: string }>()
  const userId = useMemo(() => Number(params?.id), [params])
  const { userProfile, isAdmin } = useAuth()

  // Fetch user data
  const userQuery = useAdminUserDetails(userId.toString())
  const userPermissionsQuery = useAdminUserPermissions(userId.toString())
  
  // Fetch metadata
  const shouldFetchMetadata = Boolean(userQuery.data && !userQuery.error)
  const rolesQuery = useAdminRoles({ enabled: shouldFetchMetadata })
  const permissionsQuery = useAdminPermissions({ enabled: shouldFetchMetadata })
  const agenciesQuery = useAdminAgencies({ enabled: shouldFetchMetadata })
  const { refreshUserDetails, refreshUserPermissions } = useAdminQueryRefresh()

  const user = userQuery.data
  const currentRole = user?.current_role
  const userPermissions = useMemo(() => userPermissionsQuery.data?.permission_overrides || [], [userPermissionsQuery.data])
  
  const availableRoles = useMemo(() => rolesQuery.data?.roles || [], [rolesQuery.data])
  const availablePermissions = useMemo(() => permissionsQuery.data?.permissions || [], [permissionsQuery.data])
  const agencies = useMemo(() => agenciesQuery.data || [], [agenciesQuery.data])

  const [status, setStatus] = useState<{ saving: boolean; message?: string; error?: string }>({ saving: false })
  const [activeTab, setActiveTab] = useState<'role' | 'permissions' | 'hierarchy'>('role')

  // Role change form
  const [roleChange, setRoleChange] = useState({
    new_role: '' as 'super_admin' | 'admin' | 'agency' | 'seller' | 'user' | '',
    agency_id: '',
    parent_seller_id: ''
  })

  // Permission override form
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [bulkGranted, setBulkGranted] = useState(true)
  const [bulkReason, setBulkReason] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = [...new Set(availablePermissions.map((perm: any) => perm.category))];
    return categories.sort();
  }, [availablePermissions])

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let filtered = availablePermissions;
    
    if (selectedCategory) {
      filtered = filtered.filter((perm: any) => perm.category === selectedCategory);
    }
    
    if (permissionSearch) {
      const search = permissionSearch.toLowerCase();
      filtered = filtered.filter((perm: any) => 
        perm.name.toLowerCase().includes(search) ||
        perm.codename.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [availablePermissions, permissionSearch, selectedCategory])

  // Check if role requires agency
  const roleRequiresAgency = useMemo(() => {
    return roleChange.new_role === 'agency';
  }, [roleChange.new_role])

  // Check if role requires parent seller
  const roleSupportsParentSeller = useMemo(() => {
    return roleChange.new_role === 'user';
  }, [roleChange.new_role])

  const handleChangeRole = async () => {
    if (!roleChange.new_role) return
    if (roleRequiresAgency && !roleChange.agency_id) return
    // if (roleSupportsParentSeller && !roleChange.parent_seller_id) return
    
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
      setStatus({ saving: false, error: e?.message || 'Failed to change role' })
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
          reason: bulkReason || `Bulk ${bulkGranted ? 'grant' : 'revoke'} operation`
        })
      )
      
      await Promise.all(promises)
      
      setSelectedPermissions([])
      setBulkReason('')
      
      refreshUserPermissions(userId.toString())
      setStatus({ 
        saving: false, 
        message: `Successfully ${bulkGranted ? 'granted' : 'revoked'} ${selectedPermissions.length} permission(s)` 
      })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to update permissions' })
    }
  }

  const handleRemovePermissionOverride = async (overrideId: number) => {
    setStatus({ saving: true })
    try {
      await adminDashboardService.removePermissionOverride(userId, overrideId)
      refreshUserPermissions(userId.toString())
      setStatus({ saving: false, message: 'Permission override removed' })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to remove override' })
    }
  }

  if (userQuery.isLoading) return <div className="p-4">Loading user details...</div>
  
  if (userQuery.isError && (userQuery.error as any)?.response?.status === 403) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h1>
          <p className="text-red-700">You don't have permission to manage users.</p>
        </div>
      </div>
    )
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Manage User</h1>
          <p className="text-gray-600 mt-1">
            {user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email}
            <span className="text-gray-400 mx-2">•</span>
            {user.email}
          </p>
        </div>
        <button
          onClick={() => {
            refreshUserDetails(userId.toString())
            refreshUserPermissions(userId.toString())
          }}
          disabled={userQuery.isLoading}
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

      {/* Current Role Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Current Role Assignment</h3>
        {currentRole ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-md font-medium ${getRoleBadgeColor(currentRole.role_code)}`}>
                {currentRole.role_name}
              </span>
              {currentRole.agency_name && (
                <span className="text-sm text-blue-700">
                  Agency: {currentRole.agency_name}
                </span>
              )}
              {currentRole.parent_seller_email && (
                <span className="text-sm text-blue-700">
                  Under: {currentRole.parent_seller_email}
                </span>
              )}
            </div>
            <p className="text-xs text-blue-600">
              Assigned {new Date(currentRole.assigned_at).toLocaleDateString()}
              {currentRole.assigned_by_email && ` by ${currentRole.assigned_by_email}`}
            </p>
            {currentRole.transition_reason && (
              <p className="text-xs text-blue-600">Reason: {currentRole.transition_reason}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-blue-700">No role assigned (default: user)</p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('role')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'role'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Change Role
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Permission Overrides ({userPermissions.length})
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hierarchy'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Hierarchy Info
          </button>
        </nav>
      </div>

      {/* Role Tab */}
      {activeTab === 'role' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Change User Role</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Role *</label>
              <select
                value={roleChange.new_role}
                onChange={(e) => setRoleChange(prev => ({ 
                  ...prev, 
                  new_role: e.target.value as any,
                  agency_id: '',
                  parent_seller_id: ''
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select a role...</option>
                <option value="super_admin">Super Admin - Full system access</option>
                <option value="admin">Admin - Manage agencies and users</option>
                <option value="agency">Agency - Manage sellers as clients</option>
                <option value="seller">Seller - Amazon account holder</option>
                <option value="user">User - Basic access (can view assigned dashboards)</option>
              </select>
            </div>

            {roleRequiresAgency && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agency *</label>
                <select
                  value={roleChange.agency_id}
                  onChange={(e) => setRoleChange(prev => ({ ...prev, agency_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select an agency...</option>
                  {agencies.map(agency => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {roleSupportsParentSeller  && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Seller (Optional)</label>
                <select
                  value={roleChange.parent_seller_id}
                  onChange={(e) => setRoleChange(prev => ({ ...prev, parent_seller_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select a seller...</option>
                  {/* You'll need to fetch sellers list */}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Users with this role can view dashboards for their parent seller
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleChangeRole}
                disabled={
                  !roleChange.new_role || 
                  (roleRequiresAgency && !roleChange.agency_id) ||
                  status.saving
                }
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {status.saving ? 'Changing Role...' : 'Change Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Bulk Permission Override */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Permission Overrides
            </h3>
            
            <div className="space-y-4">
              <div className="border border-gray-300 rounded-md max-h-80 overflow-y-auto">
                <div className="sticky top-0 bg-white p-3 border-b space-y-3">
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map((cat: string) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="p-3 space-y-2">
                  {filteredPermissions.map((perm: any) => (
                    <label key={perm.id} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions(prev => [...prev, perm.id]);
                          } else {
                            setSelectedPermissions(prev => prev.filter(p => p !== perm.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{perm.name}</div>
                        <div className="text-xs text-gray-500">{perm.codename} • {perm.category}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedPermissions.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-3">
                    Override Settings ({selectedPermissions.length} selected)
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={bulkGranted}
                          onChange={() => setBulkGranted(true)}
                          className="h-4 w-4 text-green-600"
                        />
                        <span className="ml-2 text-sm text-green-700">Grant</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!bulkGranted}
                          onChange={() => setBulkGranted(false)}
                          className="h-4 w-4 text-red-600"
                        />
                        <span className="ml-2 text-sm text-red-700">Revoke</span>
                      </label>
                    </div>
                    
                    <input
                      type="text"
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                    
                    <div className="flex justify-end space-x-3 pt-3 border-t">
                      <button
                        onClick={() => {
                          setSelectedPermissions([]);
                          setBulkReason('');
                        }}
                        className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleBulkPermissionOverride}
                        disabled={status.saving}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {status.saving ? 'Saving...' : `Apply ${selectedPermissions.length} Override(s)`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Overrides */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Overrides</h3>
            {userPermissions.length === 0 ? (
              <p className="text-gray-500 text-sm">No permission overrides</p>
            ) : (
              <div className="space-y-2">
                {userPermissions.map((override: any) => (
                  <div key={override.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{override.permission_name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          override.is_granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {override.is_granted ? 'Granted' : 'Revoked'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {override.permission_codename} • {override.permission_category}
                      </div>
                      {override.reason && (
                        <div className="text-xs text-gray-600 mt-1">Reason: {override.reason}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePermissionOverride(override.id)}
                      disabled={status.saving}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hierarchy Tab */}
      {activeTab === 'hierarchy' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">RBAC Hierarchy Information</h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">Role Hierarchy</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>1. Super Admin:</strong> Complete system access</p>
                <p><strong>2. Admin:</strong> Manages agencies and users under their control</p>
                <p><strong>3. Agency:</strong> Manages sellers as clients</p>
                <p><strong>4. Seller:</strong> Amazon account holder</p>
                <p><strong>5. User:</strong> Basic access + specific permissions</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="font-medium text-gray-900 mb-2">Permission System</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• Each role has default permissions</p>
                <p>• Additional permissions can be granted/revoked per user</p>
                <p>• Sellers belong to one agency only</p>
                <p>• Users can be given access to specific seller dashboards</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}