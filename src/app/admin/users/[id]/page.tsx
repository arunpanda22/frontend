'use client'

import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import { 
  useAdminUserDetails, 
  useAdminUserRoles, 
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

  // Debug current user permissions
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Current user permissions for admin access:', {
      userProfile,
      role: userProfile?.rbac_context?.role_name,
      isAdmin: isAdmin()
    });
  }
  
  // // Debug selected user assignment access
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('👤 Selected user assignment access:', {
  //     selectedUserHasAssignmentAccess,
  //     user,
  //     userRoles
  //   });
  // }

  // Only fetch user details first, then fetch other data conditionally
  const userQuery = useAdminUserDetails(userId.toString())
  const userRolesQuery = useAdminUserRoles(userId.toString())
  const userPermissionsQuery = useAdminUserPermissions(userId.toString())
  
  // Only fetch metadata when we have a valid user and no 403 errors (or in development mode)
  const shouldFetchMetadata = process.env.NODE_ENV === 'development' || 
    Boolean(userQuery.data && !userQuery.error && !((userQuery.error as any)?.response?.status === 403))
  const rolesQuery = useAdminRoles({ enabled: shouldFetchMetadata })
  const permissionsQuery = useAdminPermissions({ enabled: shouldFetchMetadata })
  const agenciesQuery = useAdminAgencies({ enabled: shouldFetchMetadata })
  const { refreshUserDetails, refreshUserRoles, refreshUserPermissions } = useAdminQueryRefresh()

  const user = userQuery.data
  const userRoles = useMemo(() => userRolesQuery.data?.roles || [], [userRolesQuery.data])
  const userPermissions = useMemo(() => userPermissionsQuery.data?.permission_overrides || [], [userPermissionsQuery.data])
  
  // Check if the selected user has admin or agency role to show assignments tab
  const selectedUserHasAssignmentAccess = useMemo(() => {
    if (!user || !userRoles.length) return false;
    
    // Check if any of the user's roles is admin, superadmin, or agency
    return userRoles.some((role: any) => 
      ['admin', 'superadmin', 'agency'].includes(role.role_name?.toLowerCase())
    );
  }, [user, userRoles]);
  const availableRoles = useMemo(() => {
    const roles = rolesQuery.data?.results || [];
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 Available roles:', roles);
      console.log('🎭 Roles query status:', { loading: rolesQuery.isLoading, error: rolesQuery.error });
    }
    return roles;
  }, [rolesQuery.data, rolesQuery.isLoading, rolesQuery.error])
  
  const availablePermissions = useMemo(() => {
    const permissions = permissionsQuery.data?.results || [];
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Available permissions:', permissions);
      console.log('🔑 Permissions query status:', { loading: permissionsQuery.isLoading, error: permissionsQuery.error });
    }
    return permissions;
  }, [permissionsQuery.data, permissionsQuery.isLoading, permissionsQuery.error])
  
  const agencies = useMemo(() => {
    const agencyList = agenciesQuery.data?.results || [];
    if (process.env.NODE_ENV === 'development') {
      console.log('🏢 Available agencies:', agencyList);
      console.log('🏢 Agencies query status:', { loading: agenciesQuery.isLoading, error: agenciesQuery.error });
    }
    return agencyList;
  }, [agenciesQuery.data, agenciesQuery.isLoading, agenciesQuery.error])

  const [status, setStatus] = useState<{ saving: boolean; message?: string; error?: string }>({ saving: false })
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'assignments'>('roles')

  // Role assignment form - default to 'user' role
  const [newRole, setNewRole] = useState({ role_id: '', agency_id: '', is_primary: false })
  // Permission override form  
  const [newPermission, setNewPermission] = useState({ 
    permission_codename: '', 
    agency_id: '', 
    is_granted: true, 
    reason: '' 
  })
  
  // Multi-permission override management
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [bulkAgency, setBulkAgency] = useState('')
  const [bulkGranted, setBulkGranted] = useState(true)
  const [bulkReason, setBulkReason] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  
  // Available assignments (new simplified structure)
  const [availableAssignments, setAvailableAssignments] = useState<any>(null)
  
  // Quick assignment state
  const [quickAssignment, setQuickAssignment] = useState({
    action: '',
    target_admin_id: '',
    target_agency_id: '',
    new_role: ''
  })
  
  // Set default role to 'user' when roles are loaded
  React.useEffect(() => {
    if (availableRoles.length > 0 && !newRole.role_id) {
      const userRole = availableRoles.find((role: any) => role.name === 'user');
      if (userRole) {
        setNewRole(prev => ({ ...prev, role_id: userRole.id }));
      }
    }
  }, [availableRoles, newRole.role_id])
  
  // Get selected role permissions
  const selectedRolePermissions = React.useMemo(() => {
    if (!newRole.role_id) return [];
    const role = availableRoles.find((r: any) => r.id === newRole.role_id);
    return role?.permissions || [];
  }, [newRole.role_id, availableRoles])
  
  // Filter permissions based on search and module
  const filteredPermissions = React.useMemo(() => {
    let filtered = availablePermissions;
    
    // Filter by module
    if (selectedModule) {
      filtered = filtered.filter((perm: any) => perm.module === selectedModule);
    }
    
    // Filter by search text
    if (permissionSearch) {
      const search = permissionSearch.toLowerCase();
      filtered = filtered.filter((perm: any) => 
        perm.name.toLowerCase().includes(search) ||
        perm.codename.toLowerCase().includes(search) ||
        perm.module.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [availablePermissions, permissionSearch, selectedModule])
  
  // Get unique modules for filter
  const availableModules = React.useMemo(() => {
    const modules = [...new Set(availablePermissions.map((perm: any) => perm.module as string))];
    return modules.sort();
  }, [availablePermissions])
  
  // Check if selected role requires agency
  const selectedRoleRequiresAgency = React.useMemo(() => {
    if (!newRole.role_id) return false;
    const role = availableRoles.find((r: any) => r.id === newRole.role_id);
    // Admin and superadmin roles don't require agency selection
    return role && !['admin', 'superadmin'].includes(role.name.toLowerCase());
  }, [newRole.role_id, availableRoles])
  
  // Load available assignments and users
  React.useEffect(() => {
    const loadAssignmentData = async () => {
      try {
        // Get the available assignments for user hierarchy management
        const assignments = await adminDashboardService.getAvailableAssignments();
        
        // Get all users for assignment (excluding the current user being managed)
        const allUsers = await adminDashboardService.listUsers({ page: 1 });
        
        // Handle different response structures safely
        const usersArray = Array.isArray(allUsers) ? allUsers : allUsers?.results || [];
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Raw Users Response:', allUsers);
          console.log('👥 Users Array:', usersArray);
        }
        
        // Filter out the current user and only show users with 'user' role
        const assignableUsers = usersArray.filter((u: any) => 
          u.id !== userId && 
          u.roles?.some((role: any) => role.role_name?.toLowerCase() === 'user')
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Raw Available Assignments:', assignments);
          console.log('👥 Assignable Users:', assignableUsers);
          console.log('🔍 Filtering Details:', {
            totalUsers: usersArray.length,
            currentUserId: userId,
            usersWithUserRole: usersArray.filter((u: any) => 
              u.roles?.some((role: any) => role.role_name?.toLowerCase() === 'user')
            ).length,
            finalAssignableCount: assignableUsers.length
          });
        }
        
        // Store the assignments and users for user management
        setAvailableAssignments({
          ...assignments,
          assignable_users: assignableUsers
        });
      } catch (error) {
        console.error('Failed to load assignment data:', error);
      }
    };
    
    // Only load assignments if we're on the assignments tab or if the selected user has admin/agency role
    if (activeTab === 'assignments' || selectedUserHasAssignmentAccess) {
      loadAssignmentData();
    }
  }, [activeTab, selectedUserHasAssignmentAccess, userId])

  const handleQuickAssignment = async () => {
    if (!quickAssignment.action) return
    
    setStatus({ saving: true })
    try {
      const params: any = {}
      const action = quickAssignment.action
      
      if (action === 'assign_to_admin' && quickAssignment.target_admin_id) {
        params.target_admin_id = parseInt(quickAssignment.target_admin_id)
      } else if (action === 'assign_to_agency' && quickAssignment.target_agency_id) {
        params.target_agency_id = parseInt(quickAssignment.target_agency_id)
      } else if (action === 'change_role' && quickAssignment.new_role) {
        params.new_role = quickAssignment.new_role
      }
      
      await adminDashboardService.assignUserToRole(userId, action as any, params)
      
      // Reset the form
      setQuickAssignment({
        action: '',
        target_admin_id: '',
        target_agency_id: '',
        new_role: ''
      })
      
      // Refresh user data
      refreshUserRoles(userId.toString())
      refreshUserDetails(userId.toString())
      
      // Reload assignment data to refresh the user list
      const loadAssignmentData = async () => {
        try {
          const assignments = await adminDashboardService.getAvailableAssignments();
          const allUsers = await adminDashboardService.listUsers({ page: 1 });
          
          // Handle different response structures safely
          const usersArray = Array.isArray(allUsers) ? allUsers : allUsers?.results || [];
          
          const assignableUsers = usersArray.filter((u: any) => 
            u.id !== userId && 
            u.roles?.some((role: any) => role.role_name?.toLowerCase() === 'user')
          );
          setAvailableAssignments({
            ...assignments,
            assignable_users: assignableUsers
          });
        } catch (error) {
          console.error('Failed to refresh assignment data:', error);
        }
      };
      loadAssignmentData();
      
      // Show success message
      setStatus({ saving: false, message: 'User successfully assigned' })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to assign user' })
    }
  }

  const handleAssignRole = async () => {
    if (!newRole.role_id) return
    if (selectedRoleRequiresAgency && !newRole.agency_id) return
    
    setStatus({ saving: true })
    try {
      const role = availableRoles.find((r: any) => r.id === newRole.role_id);
      const roleName = role?.name?.toLowerCase();
      
      // Use new simplified assignment API
      if (roleName === 'admin' || roleName === 'superadmin') {
        // For admin roles, use change_role action (no agency needed)
        await adminDashboardService.assignUserToRole(userId, 'change_role', {
          new_role: roleName as 'admin'
        });
      } else if (roleName === 'agency' && newRole.agency_id) {
        // For agency role, assign to specific agency
        await adminDashboardService.assignUserToRole(userId, 'assign_to_agency', {
          target_agency_id: parseInt(newRole.agency_id)
        });
      } else if (roleName === 'user') {
        // For user role, use change_role
        await adminDashboardService.assignUserToRole(userId, 'change_role', {
          new_role: 'user'
        });
      } else {
        // Fallback to traditional approach
        const roleId = newRole.role_id;
        const agencyId = parseInt(newRole.agency_id);
        
        await adminDashboardService.assignUserRole(userId, {
          role_id: roleId,
          agency_id: agencyId,
          is_primary: newRole.is_primary
        })
      }
      
      setNewRole({ role_id: '', agency_id: '', is_primary: false })
      refreshUserRoles(userId.toString())
      refreshUserDetails(userId.toString())
      setStatus({ saving: false, message: 'Role assigned successfully' })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to assign role' })
    }
  }

  const handleRemoveRole = async (roleAssignmentId: number) => {
    setStatus({ saving: true })
    try {
      await adminDashboardService.removeUserRole(userId, roleAssignmentId)
      refreshUserRoles(userId.toString())
      refreshUserDetails(userId.toString())
      setStatus({ saving: false, message: 'Role removed successfully' })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to remove role' })
    }
  }

  const handleGrantPermission = async () => {
    if (!newPermission.permission_codename || !newPermission.agency_id) return
    
    setStatus({ saving: true })
    try {
      await adminDashboardService.grantUserPermission(userId, {
        permission_codename: newPermission.permission_codename,
        agency_id: parseInt(newPermission.agency_id),
        is_granted: newPermission.is_granted,
        reason: newPermission.reason
      })
      setNewPermission({ permission_codename: '', agency_id: '', is_granted: true, reason: '' })
      refreshUserPermissions(userId.toString())
      setStatus({ saving: false, message: 'Permission override created successfully' })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to create permission override' })
    }
  }

  const handleRemovePermissionOverride = async (overrideId: number) => {
    setStatus({ saving: true })
    try {
      await adminDashboardService.removePermissionOverride(userId, overrideId)
      refreshUserPermissions(userId.toString())
      setStatus({ saving: false, message: 'Permission override removed successfully' })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to remove permission override' })
    }
  }

  const handleBulkPermissionOverride = async () => {
    if (selectedPermissions.length === 0) return
    
    // Check if agency is required (not required for admin permissions if no agency selected)
    const hasAdminPermissions = selectedPermissions.some(p => p.startsWith('rbac_admin'))
    if (!bulkAgency && !hasAdminPermissions) return
    
    setStatus({ saving: true })
    try {
      // Create multiple permission overrides in parallel
      const promises = selectedPermissions.map(codename =>
        adminDashboardService.grantUserPermission(userId, {
          permission_codename: codename,
          agency_id: bulkAgency ? parseInt(bulkAgency) : null, // null for global admin permissions
          is_granted: bulkGranted,
          reason: bulkReason || `Bulk ${bulkGranted ? 'grant' : 'deny'} operation${!bulkAgency ? ' (global)' : ''}`
        })
      )
      
      await Promise.all(promises)
      
      // Reset form
      setSelectedPermissions([])
      setBulkAgency('')
      setBulkReason('')
      
      refreshUserPermissions(userId.toString())
      setStatus({ 
        saving: false, 
        message: `Successfully created ${selectedPermissions.length} permission override${selectedPermissions.length !== 1 ? 's' : ''}${!bulkAgency ? ' (global)' : ''}` 
      })
    } catch (e: any) {
      setStatus({ saving: false, error: e?.message || 'Failed to create permission overrides' })
    }
  }

  if (userQuery.isLoading) return <div className="p-4">Loading user details...</div>
  
  // Handle 403 Forbidden specifically
  if (userQuery.isError && (userQuery.error as any)?.response?.status === 403) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h1>
          <p className="text-red-700">You don't have permission to manage users. Please contact your administrator.</p>
          <p className="text-red-600 text-sm mt-2">Required permissions: view_users, manage_users, or superuser access</p>
        </div>
      </div>
    )
  }
  
  if (userQuery.isError) return <div className="p-4 text-red-600">Failed to load user details</div>
  if (!user) return <div className="p-4">User not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Manage User</h1>
          <p className="text-gray-600 mt-1">
            {user.first_name} {user.last_name} &lt;{user.email}&gt;
            {user.is_superuser && <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Super Admin</span>}
          </p>
        </div>
        <button
          onClick={() => {
            refreshUserDetails(userId.toString())
            refreshUserRoles(userId.toString())
            refreshUserPermissions(userId.toString())
          }}
          disabled={userQuery.isLoading}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {userQuery.isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {status.error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{status.error}</div>}
      {status.message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">{status.message}</div>}

      {/* Workflow Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📚 Updated User Management Workflow</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>🏗️ Hierarchy:</strong> Superadmin manages everyone → Admins under superadmin → Agencies under superadmin/admin → Users under any level</p>
          <p><strong>1. Role Assignment:</strong> Assign users to agencies with specific roles (superadmin → admin → agency → user)</p>
          <p><strong>2. Permission Inheritance:</strong> Lower roles inherit permissions from higher roles automatically</p>
          <p><strong>3. Permission Overrides:</strong> Grant or deny specific permissions beyond role inheritance within each agency</p>
          <p><strong>4. Multi-Agency Support:</strong> Users can belong to multiple agencies with different roles and permissions</p>
          <p><strong>5. Primary Agency:</strong> One agency marked as primary for default context and user switching</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Role Assignments ({userRoles.length})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Permission Overrides ({userPermissions.length})
          </button>
          {/* Show Assignments tab if the selected user has admin or agency role */}
          {selectedUserHasAssignmentAccess && (
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Assignments
            </button>
          )}
        </nav>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Quick User Assignment - New Simplified Flow */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Quick User Assignment</h3>
              <span className="text-xs text-gray-500">Simplified Hierarchy Management</span>
            </div>
            
            <div className="space-y-4">
              {/* Assignment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type *</label>
                <select
                  value={quickAssignment.action}
                  onChange={(e) => setQuickAssignment(prev => ({ 
                    ...prev, 
                    action: e.target.value,
                    target_admin_id: '',
                    target_agency_id: '',
                    new_role: ''
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose assignment type...</option>
                  <option value="assign_to_admin">👤 Assign User Under Admin</option>
                  <option value="assign_to_agency">🏢 Assign Agency Under Admin</option>
                  <option value="change_role">🔄 Change User Role</option>
                </select>
              </div>
              
              {/* Conditional Fields Based on Assignment Type */}
              {quickAssignment.action === 'assign_to_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Admin *</label>
                  <select
                    value={quickAssignment.target_admin_id}
                    onChange={(e) => setQuickAssignment(prev => ({ ...prev, target_admin_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose admin...</option>
                    {availableAssignments?.available_admins?.map((admin: any) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.username || admin.email} ({admin.first_name} {admin.last_name})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">This user will be managed under the selected admin</p>
                </div>
              )}
              
              {quickAssignment.action === 'assign_to_agency' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Agency *</label>
                  <select
                    value={quickAssignment.target_agency_id}
                    onChange={(e) => setQuickAssignment(prev => ({ ...prev, target_agency_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose agency...</option>
                    {availableAssignments?.available_agencies?.map((agency: any) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name} ({agency.slug})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Assign this agency under current admin</p>
                </div>
              )}
              
              {quickAssignment.action === 'change_role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Role *</label>
                  <select
                    value={quickAssignment.new_role}
                    onChange={(e) => setQuickAssignment(prev => ({ ...prev, new_role: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose new role...</option>
                    <option value="admin">🔴 Admin (Global Access)</option>
                    <option value="agency">🟡 Agency (Agency-scoped)</option>
                    <option value="user">🟢 User (Basic Access)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Change user's primary role in the system</p>
                </div>
              )}
              
              {/* Action Button */}
              {quickAssignment.action && (
                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleQuickAssignment}
                    disabled={
                      !quickAssignment.action || 
                      (quickAssignment.action === 'assign_to_admin' && !quickAssignment.target_admin_id) ||
                      (quickAssignment.action === 'assign_to_agency' && !quickAssignment.target_agency_id) ||
                      (quickAssignment.action === 'change_role' && !quickAssignment.new_role) ||
                      status.saving
                    }
                    className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {status.saving ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      {
                        'assign_to_admin': 'Assign Under Admin',
                        'assign_to_agency': 'Assign Agency',
                        'change_role': 'Change Role'
                      }[quickAssignment.action] || 'Execute Assignment'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Assign New Role - Simplified */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Role</h3>
              <span className="text-xs text-gray-500">Simplified Role Management</span>
            </div>
            
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={newRole.role_id}
                  onChange={(e) => setNewRole(prev => ({ ...prev, role_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={rolesQuery.isLoading}
                >
                  <option value="">
                    {rolesQuery.isLoading ? 'Loading roles...' : 
                     rolesQuery.error ? 'Error loading roles' : 
                     availableRoles.length === 0 ? 'No roles available' : 'Choose a role...'}
                  </option>
                  {availableRoles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name.toUpperCase()} {role.parent_role ? `(inherits from ${role.parent_role.name})` : '(system role)'} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Agency Selection - Only for agency/user roles */}
              {selectedRoleRequiresAgency && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agency/Scope *</label>
                  <select
                    value={newRole.agency_id}
                    onChange={(e) => setNewRole(prev => ({ ...prev, agency_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={agenciesQuery.isLoading}
                  >
                    <option value="">
                      {agenciesQuery.isLoading ? 'Loading agencies...' : 
                       agenciesQuery.error ? 'Error loading agencies' : 
                       agencies.length === 0 ? 'No agencies available' : 'Choose an agency/scope...'}
                    </option>
                    {agencies.map(agency => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name} ({agency.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Info message for admin roles */}
              {!selectedRoleRequiresAgency && newRole.role_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>System Role:</strong> This role has global permissions and doesn't require agency assignment.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Primary Role Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="primary-role"
                  checked={newRole.is_primary}
                  onChange={(e) => setNewRole(prev => ({ ...prev, is_primary: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="primary-role" className="text-sm text-gray-700">
                  Set as primary agency (for user switching context)
                </label>
              </div>
              
              {/* Role Permissions Preview */}
              {selectedRolePermissions.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    📋 Role Permissions Preview ({selectedRolePermissions.length} permissions)
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                      {selectedRolePermissions.map((perm: any) => (
                        <div key={perm.id} className="text-blue-700">
                          ✓ {perm.name} ({perm.codename})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleAssignRole}
                  disabled={!newRole.role_id || (selectedRoleRequiresAgency && !newRole.agency_id) || status.saving}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status.saving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning Role...
                    </span>
                  ) : 'Assign Role'}
                </button>
              </div>
            </div>
          </div>

          {/* Current Roles */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Role Assignments</h3>
            {userRoles.length === 0 ? (
              <p className="text-gray-500">No roles assigned</p>
            ) : (
              <div className="space-y-2">
                {userRoles.map((role: any) => (
                  <div key={role.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">{role.role_name}</span>
                        <span className="mx-2 text-gray-400">@</span>
                        <span className="text-gray-600">{role.agency_name}</span>
                        {role.is_primary && <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Primary</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Role ID: {role.role_id} • Agency ID: {role.agency_id} • Created: {new Date(role.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        📋 Inherits permissions from higher-level roles in the hierarchy
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveRole(role.id)}
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

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* User Assignment Tab */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Users to {user?.first_name || user?.email}</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    // Refresh assignments data
                    if (activeTab === 'assignments' || selectedUserHasAssignmentAccess) {
                      const loadAssignmentData = async () => {
                        try {
                          const assignments = await adminDashboardService.getAvailableAssignments();
                          const allUsers = await adminDashboardService.listUsers({ page: 1 });
                          
                          // Handle different response structures safely
                          const usersArray = Array.isArray(allUsers) ? allUsers : allUsers?.results || [];
                          
                          const assignableUsers = usersArray.filter((u: any) => 
                            u.id !== userId && 
                            u.roles?.some((role: any) => role.role_name?.toLowerCase() === 'user')
                          );
                          setAvailableAssignments({
                            ...assignments,
                            assignable_users: assignableUsers
                          });
                        } catch (error) {
                          console.error('Failed to refresh assignment data:', error);
                        }
                      };
                      loadAssignmentData();
                    }
                  }}
                  className="text-xs flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <span className="text-xs text-gray-500">User Management</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Introduction and Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">About User Assignments</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Assign normal users to {user?.first_name || user?.email} for management and impersonation purposes. 
                  {userRoles.some((role: any) => role.role_name?.toLowerCase() === 'admin') && ' As an admin, you can manage and impersonate assigned users.'}
                  {userRoles.some((role: any) => role.role_name?.toLowerCase() === 'agency') && ' As an agency user, you can manage users within your agency.'}
                </p>
              </div>
              
              {/* List of Assignable Users */}
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">👥 Available Users to Assign</h4>
                
                {availableAssignments?.assignable_users?.length > 0 ? (
                  <div className="space-y-3">
                    {availableAssignments.assignable_users.map((assignableUser: any) => (
                      <div key={assignableUser.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {(assignableUser.first_name?.[0] || assignableUser.email?.[0] || 'U').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {assignableUser.first_name} {assignableUser.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{assignableUser.email}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Assign this user to the current user being managed
                            setQuickAssignment({
                              action: 'assign_to_admin',
                              target_admin_id: userId.toString(),
                              target_agency_id: '',
                              new_role: ''
                            });
                            handleQuickAssignment();
                          }}
                          disabled={status.saving}
                          className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {status.saving ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No users available for assignment</p>
                    <p className="text-xs text-gray-400 mt-1">All users are either already assigned or have admin/agency roles</p>
                  </div>
                )}
              </div>

              {/* Current User's Role Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Current User's Role</h4>
                <div className="flex flex-wrap gap-2">
                  {userRoles.map((role: any, index: number) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {role.role_name} @ {role.agency_name}
                      {role.is_primary && ' (Primary)'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Bulk Permission Override - Simplified */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Permission Overrides</h3>
              <span className="text-xs text-gray-500">Module-based Permission Management</span>
            </div>
            
            <div className="space-y-6">
              {/* Permission Search & Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Permissions to Override ({selectedPermissions.length} selected)
                </label>
                <div className="border border-gray-300 rounded-md max-h-80 overflow-y-auto">
                  {/* Search and Filter Box */}
                  <div className="sticky top-0 bg-white p-3 border-b border-gray-200 space-y-3">
                    <input
                      type="text"
                      placeholder="Search permissions... (e.g., 'view_users', 'manage')"
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Module Filter */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Modules</option>
                        {(availableModules as string[]).map((module: string) => (
                          <option key={module} value={module}>
                            {module.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                      
                      {/* Module Legend */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        <span>Admin</span>
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span>Tools</span>
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        <span>Data</span>
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>Accounts</span>
                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                        <span>Actions</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Permission List */}
                  <div className="p-3 space-y-2">
                    {filteredPermissions.map((perm: any) => (
                      <label key={perm.id} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.codename)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions(prev => [...prev, perm.codename]);
                            } else {
                              setSelectedPermissions(prev => prev.filter(p => p !== perm.codename));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              perm.module === 'rbac_admin' ? 'bg-red-400' :
                              perm.module === 'tools' ? 'bg-blue-400' :
                              perm.module === 'data' ? 'bg-green-400' :
                              perm.module === 'accounts' ? 'bg-purple-400' :
                              perm.module === 'user_actions' ? 'bg-yellow-400' :
                              'bg-gray-400'
                            }`}></span>
                            {perm.codename} • {perm.module}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Bulk Settings */}
              {selectedPermissions.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Bulk Override Settings for {selectedPermissions.length} permissions
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Agency Selection - Optional for admin permissions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agency/Scope {selectedPermissions.some(p => p.startsWith('rbac_admin')) ? '(Optional for admin permissions)' : '*'}
                      </label>
                      <select
                        value={bulkAgency}
                        onChange={(e) => setBulkAgency(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">
                          {selectedPermissions.some(p => p.startsWith('rbac_admin')) 
                            ? 'Global (no agency scope)' 
                            : 'Choose agency...'}
                        </option>
                        {agencies.map(agency => (
                          <option key={agency.id} value={agency.id}>
                            {agency.name} ({agency.slug})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedPermissions.some(p => p.startsWith('rbac_admin'))
                          ? 'Admin permissions can be global or scoped to specific agency'
                          : 'Permission overrides are scoped to a specific agency'}
                      </p>
                    </div>
                    
                    {/* Grant/Deny Toggle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Override Type</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={bulkGranted}
                            onChange={() => setBulkGranted(true)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-green-700">✓ Grant</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!bulkGranted}
                            onChange={() => setBulkGranted(false)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-red-700">✗ Deny</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reason */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                    <input
                      type="text"
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      placeholder="e.g., 'Temporary access for project XYZ'"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Selected Permissions Preview */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Permissions:</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedPermissions.map(codename => (
                        <span key={codename} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {codename}
                          <button
                            onClick={() => setSelectedPermissions(prev => prev.filter(p => p !== codename))}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedPermissions([]);
                        setBulkAgency('');
                        setBulkReason('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleBulkPermissionOverride}
                      disabled={
                        selectedPermissions.length === 0 || 
                        status.saving ||
                        (!bulkAgency && !selectedPermissions.some(p => p.startsWith('rbac_admin')))
                      }
                      className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {status.saving ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating {selectedPermissions.length} Overrides...
                        </span>
                      ) : `Create ${selectedPermissions.length} Override${selectedPermissions.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Permission Overrides */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Permission Overrides</h3>
            {userPermissions.length === 0 ? (
              <p className="text-gray-500">No permission overrides</p>
            ) : (
              <div className="space-y-2">
                {userPermissions.map((override: any) => (
                  <div key={override.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div>
                      <span className="font-medium">{override.permission_name}</span>
                      <span className="mx-2 text-gray-400">@</span>
                      <span className="text-gray-600">{override.agency_name}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        override.is_granted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {override.is_granted ? 'Granted' : 'Denied'}
                      </span>
                      {override.reason && (
                        <div className="text-sm text-gray-500 mt-1">Reason: {override.reason}</div>
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
    </div>
  )
}