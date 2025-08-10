import { apiClient } from '@/lib/api/config'

export interface AdminUser {
  id: number
  email: string
  username?: string
  first_name?: string
  last_name?: string
  is_active: boolean
  is_superuser: boolean
  roles: Array<{
    id: number
    role_id: number
    role_name: string
    agency_id: number
    agency_name: string
    is_primary: boolean
    created_at: string
  }>
}

export interface Role {
  id: string | number // Can be UUID (string) or integer, per documentation
  name: string
  description?: string
  is_system_role: boolean
  parent_role?: {
    id: string | number
    name: string
  } | null
  permission_count?: number
  permissions?: Permission[] // May include permissions array
  created_at: string
}

export interface Permission {
  id: string | number // Can be UUID (string) or integer, per documentation
  codename: string
  name: string
  description?: string
  module: string
  role_count?: number // May include role count per documentation
  created_at: string
}

export interface Agency {
  id: number
  name: string
  slug: string
  is_active: boolean
  user_count?: number
  created_at: string
}

export interface PermissionOverride {
  id: number
  permission_codename: string
  permission_name: string
  permission_module: string
  agency_id: number | null // Allow null for global admin permissions
  agency_name: string | null
  is_granted: boolean
  reason?: string
  granted_by?: string
  created_at: string
  expires_at?: string | null
}

export interface UserRoleAssignment {
  id: number
  user_id: number
  role_id: number
  role_name: string
  agency_id: number
  agency_name: string
  is_primary: boolean
  created_at: string
}

export interface ReportListItem {
  id: string
  report_source: 'ads' | 'fba'
  amazon_report_id: string
  report_type_name: string
  tenant_name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  start_date: string
  end_date: string
  created_at: string
  completed_at?: string | null
  error_message?: string | null
  rows_processed?: number
  created_by_email?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ReportFilters {
  page?: number
  page_size?: number
  report_type?: string
  source?: 'ads' | 'fba'
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  start_date?: string
  end_date?: string
  tenant_id?: string
}

export const adminDashboardService = {
  // User Management
  async listUsers(params?: { agency_id?: number; role_id?: number; search?: string; page?: number }) {
    const res = await apiClient.get<PaginatedResponse<AdminUser>>('/api/v1/rbac-admin/users/', { params })
    return res.data
  },

  async getUser(userId: number) {
    const res = await apiClient.get<AdminUser>(`/api/v1/rbac-admin/users/${userId}/`)
    return res.data
  },

  async getUserRoles(userId: number) {
    const res = await apiClient.get(`/api/v1/rbac-admin/users/${userId}/roles/`)
    return res.data
  },

  async assignUserRole(userId: number, data: { role_id: number | string; agency_id: number; is_primary?: boolean }) {
    // Handle both UUID (string) and integer role IDs for backward compatibility
    const res = await apiClient.post(`/api/v1/rbac-admin/users/${userId}/roles/`, data)
    return res.data
  },

  async removeUserRole(userId: number, roleAssignmentId: number) {
    const res = await apiClient.delete(`/api/v1/rbac-admin/users/${userId}/roles/${roleAssignmentId}/`)
    return res.data
  },

  // User Permission Overrides
  async getUserPermissionOverrides(userId: number, agencyId?: number) {
    const params = agencyId ? { agency_id: agencyId } : {}
    const res = await apiClient.get(`/api/v1/rbac-admin/users/${userId}/permissions/`, { params })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Raw user permissions API response:', res.data);
    }
    
    return res.data
  },

  async grantUserPermission(userId: number, data: {
    permission_codename: string
    agency_id: number | null // Allow null for global admin permissions
    is_granted: boolean
    reason?: string
    expires_at?: string
  }) {
    const res = await apiClient.post(`/api/v1/rbac-admin/users/${userId}/permissions/`, data)
    return res.data
  },

  async updatePermissionOverride(userId: number, overrideId: number, data: {
    is_granted?: boolean
    reason?: string
    expires_at?: string | null
  }) {
    const res = await apiClient.put(`/api/v1/rbac-admin/users/${userId}/permissions/${overrideId}/`, data)
    return res.data
  },

  async removePermissionOverride(userId: number, overrideId: number) {
    const res = await apiClient.delete(`/api/v1/rbac-admin/users/${userId}/permissions/${overrideId}/`)
    return res.data
  },

  async getUserEffectivePermissions(userId: number, agencyId: number) {
    const res = await apiClient.get(`/api/v1/rbac-admin/users/${userId}/effective-permissions/?agency_id=${agencyId}`)
    return res.data
  },

  async listReports(filters: ReportFilters) {
    const res = await apiClient.get<PaginatedResponse<ReportListItem>>('/api/v1/rbac-admin/reports/', {
      params: filters,
    })
    return res.data
  },

  async getReportDetails(reportId: string, reportSource: 'ads' | 'fba') {
    const res = await apiClient.get(`/api/v1/rbac-admin/reports/${reportId}/${reportSource}/`)
    return res.data
  },

  async getReportStatusSummary(days = 30) {
    const res = await apiClient.get('/api/v1/rbac-admin/reports/status-summary/', { params: { days } })
    return res.data as Array<{ status: string; count: number; source: 'ads' | 'fba' }>
  },

  async getReportDashboard(days = 30) {
    const res = await apiClient.get('/api/v1/rbac-admin/reports/dashboard/', { params: { days } })
    return res.data as any
  },

  // Role Management
  async listRoles(params?: { search?: string; is_system_role?: boolean }) {
    const res = await apiClient.get('/api/v1/rbac-admin/roles/', { params })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 Raw roles API response:', res.data);
    }
    
    // According to documentation, this returns direct array format, not paginated
    if (Array.isArray(res.data)) {
      // Handle doc format: direct array
      const result = { results: res.data, count: res.data.length };
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 Transformed roles response:', result);
      }
      return result;
    }
    // Handle potential paginated format as fallback
    return res.data
  },

  async getRole(roleId: number) {
    const res = await apiClient.get<Role>(`/api/v1/rbac-admin/roles/${roleId}/`)
    return res.data
  },

  async createRole(data: {
    name: string
    description?: string
    parent_role_id?: number
    permission_ids?: number[]
  }) {
    const res = await apiClient.post<Role>('/api/v1/rbac-admin/roles/', data)
    return res.data
  },

  async updateRole(roleId: number, data: {
    name?: string
    description?: string
    permission_ids?: number[]
  }) {
    const res = await apiClient.put<Role>(`/api/v1/rbac-admin/roles/${roleId}/`, data)
    return res.data
  },

  async deleteRole(roleId: number) {
    const res = await apiClient.delete(`/api/v1/rbac-admin/roles/${roleId}/`)
    return res.data
  },

  async addRolePermissions(roleId: number, permissionIds: number[]) {
    const res = await apiClient.post(`/api/v1/rbac-admin/roles/${roleId}/permissions/`, { permission_ids: permissionIds })
    return res.data
  },

  async removeRolePermissions(roleId: number, permissionIds: number[]) {
    const res = await apiClient.delete(`/api/v1/rbac-admin/roles/${roleId}/permissions/`, { data: { permission_ids: permissionIds } })
    return res.data
  },

  // Permission Management
  async listPermissions(params?: { module?: string; search?: string }) {
    const res = await apiClient.get('/api/v1/rbac-admin/permissions/', { params })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Raw permissions API response:', res.data);
    }
    
    // According to documentation, this returns direct permissions array, not paginated
    if (res.data.permissions) {
      // Handle doc format: { permissions: [...], modules: [...] }
      const result = { results: res.data.permissions, count: res.data.permissions.length };
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Transformed permissions response:', result);
      }
      return result;
    }
    // Handle potential paginated format as fallback
    return res.data
  },

  async getPermissionsByModule(module: string) {
    const res = await apiClient.get(`/api/v1/rbac-admin/permissions/module/${module}/`)
    return res.data
  },

  async createPermission(data: {
    codename: string
    name: string
    description?: string
    module: string
  }) {
    const res = await apiClient.post<Permission>('/api/v1/rbac-admin/permissions/', data)
    return res.data
  },

  // Agency Management
  async listAgencies(params?: { search?: string; is_active?: boolean }) {
    const res = await apiClient.get<PaginatedResponse<Agency>>('/api/v1/rbac-admin/agencies/', { params })
    return res.data
  },

  async getAgency(agencyId: number) {
    const res = await apiClient.get<Agency>(`/api/v1/rbac-admin/agencies/${agencyId}/`)
    return res.data
  },

  async createAgency(data: { name: string; slug: string }) {
    const res = await apiClient.post<Agency>('/api/v1/rbac-admin/agencies/', data)
    return res.data
  },

  // New User Assignment Management APIs (Simplified Structure)
  async getAvailableAssignments() {
    const res = await apiClient.get('/api/v1/rbac-admin/available-assignments/')
    return res.data
  },

  async assignUserToRole(userId: number, action: 'assign_to_admin' | 'assign_to_agency' | 'change_role', params: {
    target_admin_id?: number;
    target_agency_id?: number;
    new_role?: 'admin' | 'agency' | 'user';
  }) {
    const res = await apiClient.post('/api/v1/rbac-admin/user-assignments/', {
      action,
      user_id: userId,
      ...params
    })
    return res.data
  },

  async getUserHierarchy() {
    const res = await apiClient.get('/api/v1/rbac-admin/user-hierarchy/')
    return res.data
  },
}

