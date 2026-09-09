import { apiClient } from '@/lib/api/config'

export interface CurrentRole {
  id: number
  role_id: number
  role_name: string // Display name like "Super Admin"
  role_code: string // Code like "super_admin"
  assigned_at: string
  transition_reason: string
  is_active: boolean
  agency_id?: number
  agency_name?: string
  parent_seller_id?: number
  parent_seller_email?: string
  assigned_by_id?: number
  assigned_by_email?: string
}

export interface Role {
  id: string // Backend serializes as string
  name: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
  display_name: string
  description: string
  hierarchy_level: number
  user_count: number
  permission_count: number
  permissions: Array<{
    id: string
    codename: string
    name: string
    category: string
  }>
  created_at: string
  updated_at?: string
  is_system_role: boolean // Always true in new system
  can_be_deleted?: boolean // Always false - roles are fixed
}

export interface ManagedAgencyAssignment {
  id: number
  agency_id: number
  agency_name: string
  agency_slug: string
  assigned_at: string
  assigned_by_email?: string
}

export interface AdminUser {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  display_name: string
  firebase_uid?: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at?: string
  current_role: CurrentRole | null
  managed_agencies?: ManagedAgencyAssignment[]  
  managed_agencies_count?: number  
}

export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
  username?: string
  is_active?: boolean
}

export interface UpdateUserResponse {
  success: boolean
  message: string
  user: {
    id: number
    email: string
    username: string
    first_name: string
    last_name: string
    display_name: string
    is_active: boolean
    updated_at: string
  }
}

export interface RoleHistoryItem extends CurrentRole {
  deactivated_at: string | null
}

export interface UserRolesResponse {
  user_id: number
  username: string
  email: string
  current_role: CurrentRole | null
  role_history: RoleHistoryItem[]
  is_superuser: boolean
  reports_enabled: boolean
}

export interface AgencySellerItem {
  id: number
  email: string
  display_name: string
  service_tier?: string
  assigned_at?: string
}

export interface AgencySellersResponse {
  assigned_sellers: AgencySellerItem[]
  available_sellers: AgencySellerItem[]
}

export interface Permission {
  id: string
  codename: string
  name: string
  description: string
  category: string
  created_at: string
  updated_at?: string
}

export interface PermissionListResponse {
  permissions: Permission[]
  categories: string[]
}

export interface PermissionDetailResponse {
  id: string
  codename: string
  name: string
  description: string
  category: string
  default_roles: Array<{
    role__id: number
    role__name: string
    created_at: string
  }>
  custom_grants: Array<{
    user_role__user__id: number
    user_role__user__email: string
    user_role__role__name: string
    granted_at: string
    reason: string
  }>
  custom_revokes: Array<{
    user_role__user__id: number
    user_role__user__email: string
    user_role__role__name: string
    granted_at: string
    reason: string
  }>
  created_at: string
  updated_at: string
}

export interface RoleListResponse {
  roles: Role[]
  total_count: number
}

export interface RoleDetailResponse {
  id: string
  name: string
  display_name: string
  description: string
  hierarchy_level: number
  user_count: number
  sample_users: Array<{
    id: number
    email: string
    name: string
  }>
  permissions_by_category: Record<string, Array<{
    id: string
    codename: string
    name: string
    description: string
  }>>
  total_permissions: number
  created_at: string
  updated_at: string
  is_system_role: boolean
  can_be_deleted: boolean
}

export interface RolePermissionsResponse {
  role: {
    name: string
    display_name: string
    description: string
    hierarchy_level: number
  }
  assigned_permissions: Array<{
    id: string
    codename: string
    name: string
    description: string
    category: string
    assigned_at: string
  }>
  available_permissions: Array<{
    id: string
    codename: string
    name: string
    description: string
    category: string
  }>
  assigned_count: number
  available_count: number
}

export interface RoleHierarchyResponse {
  hierarchy: Array<{
    name: string
    display_name: string
    hierarchy_level: number
    user_count: number
    can_manage_roles: string[]
    description: string
  }>
  hierarchy_explanation: Record<string, string>
}

export interface Agency {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
  user_count?: number
  agency_staff_count?: number
  client_count?: number
  staff_count?: number
  created_at: string
  updated_at?: string
}

// UPDATED: Removed agency_id from PermissionOverride
export interface PermissionOverride {
  id: number
  permission_id: string
  permission_codename: string
  permission_name: string
  permission_category: string
  is_granted: boolean
  reason?: string
  context_data?: Record<string, any>
  granted_by?: string
  granted_at: string
  expires_at?: string | null
}

// UPDATED: User permission overrides response
export interface UserPermissionOverridesResponse {
  user_id: number
  user_email: string
  current_role: {
    id: number
    role_name: string
    role_code: string
  }
  default_permissions_count: number
  permission_overrides: PermissionOverride[]
  overrides_count: {
    grants: number
    revokes: number
  }
}

// UPDATED: Effective permissions response
export interface UserEffectivePermissionsResponse {
  user_id: number
  user_email: string
  role: {
    id: number
    name: string
    code: string
    hierarchy_level: number
  }
  effective_permissions: Record<string, Array<{
    id: string
    codename: string
    name: string
    description: string
  }>>
  permission_counts: {
    total_effective: number
    from_role_default: number
    custom_grants: number
    custom_revokes: number
  }
  overrides: {
    grants: Array<{
      permission_codename: string
      permission_name: string
      reason: string
      granted_at: string
    }>
    revokes: Array<{
      permission_codename: string
      permission_name: string
      reason: string
      granted_at: string
    }>
  }
}

export interface AvailableAssignmentsResponse {
  available_roles: string[]
  available_agencies: Array<{
    id: number
    name: string
    slug: string
  }>
  available_admins: Array<{
    id: number
    email: string
    name: string
    agency_id?: number
    agency_name?: string
  }>
  available_sellers: Array<{
    id: number
    email: string
    name: string
  }>
  available_users: any[]
}

export interface SellerStaffUser {
  user_id: number
  email: string
  name: string
}

export interface ClientSeller {
  seller_id: number
  seller_email: string
  seller_name: string
  service_tier: string
  staff_users: SellerStaffUser[]
}

export interface AgencyUser {
  user_id: number
  email: string
  name: string
}

export interface ManagedAgency {
  agency_id: number
  agency_name: string
  agency_users: AgencyUser[]
  client_sellers: ClientSeller[]
}

export interface AdminHierarchy {
  user_id: number
  email: string
  name: string
  role: string
  managed_agencies: ManagedAgency[]
}

export interface UserHierarchyResponse {
  hierarchy: AdminHierarchy[]
  total_branches: number
}

export interface ChangeRoleRequest {
  action: 'change_role'
  user_id: number
  new_role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
  agency_id?: number // Required for agency role only
  parent_seller_id?: number // Required for user role
}

export interface AssignSellerToAgencyRequest {
  action: 'assign_seller_to_agency'
  user_id: number
  agency_id: number
  service_tier?: string
  monthly_fee?: number
}

export interface AssignUserToSellerRequest {
  action: 'assign_user_to_seller'
  user_id: number
  parent_seller_id: number
  access_level?: 'full' | 'read_only' | 'limited'
}

export interface AssignAdminToAgenciesRequest {
  action: 'assign_admin_to_agencies'
  user_id: number
  agency_ids: number[]
}

export type UserAssignmentRequest = 
  | ChangeRoleRequest 
  | AssignSellerToAgencyRequest 
  | AssignUserToSellerRequest 
  | AssignAdminToAgenciesRequest

export interface ChangeRoleResponse {
  success: boolean
  message: string
  user_id: number
  user_email: string
  new_role: {
    id: number
    role_name: string
    role_code: string
    agency?: {
      id: number
      name: string
    }
    parent_seller?: {
      id: number
      email: string
    }
  }
}

export interface AssignSellerToAgencyResponse {
  success: boolean
  message: string
  assignment: {
    id: number
    seller_email: string
    agency_name: string
    service_tier: string
    is_active: boolean
  }
}

export interface AssignUserToSellerResponse {
  success: boolean
  message: string
  assignment: {
    user_email: string
    parent_seller_email: string
  }
}

export interface AssignAdminToAgenciesResponse {
  success: boolean
  message: string
  admin_email: string
  managed_agencies: Array<{
    agency_id: number
    agency_name: string
  }>
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

export interface StaffEmail {
  id: number
  user: number
  user_email: string
  email: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: number
  created_by_email: string
}

export interface UserWithStaffEmails {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  is_active: boolean
  staff_emails: StaffEmail[]
  active_staff_emails: StaffEmail[]
  staff_email_count: number
}

export interface StaffEmailStats {
  total_users: number
  users_with_staff_emails: number
  total_staff_emails: number
  active_staff_emails: number
  inactive_staff_emails: number
  users_without_staff_emails: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface UserListParams {
  page?: number
  page_size?: number
  search?: string
  role_name?: string
  agency_id?: number
  is_active?: boolean
}

export interface ReportFilters {
  page?: number
  page_size?: number
  report_type?: string
  source?: 'ads' | 'fba'
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'GENERATED' | 'IN_QUEUE' | 'CANCELLED'
  start_date?: string
  end_date?: string
  tenant_id?: string
}

export const adminDashboardService = {
  // ========================================================================
  // USER MANAGEMENT
  // ========================================================================

  async listUsers(params?: UserListParams) {
    const res = await apiClient.get<PaginatedResponse<AdminUser>>(
      '/api/v1/rbac-admin/users/',
      { params }
    )
    return res.data
  },

  async getUser(userId: number) {
    const res = await apiClient.get<AdminUser>(
      `/api/v1/rbac-admin/users/${userId}/`
    )
    return res.data
  },

  async updateUser(userId: number, data: UpdateUserRequest) {
    const res = await apiClient.patch<UpdateUserResponse>(
      `/api/v1/rbac-admin/users/${userId}/`,
      data
    )
    return res.data
  },

  async getUserRoles(userId: number) {
    const res = await apiClient.get<UserRolesResponse>(
      `/api/v1/rbac-admin/users/${userId}/roles/`
    )
    return res.data
  },

  async toggleReportsForUser(userId: number, reportsEnabled: boolean) {
    const res = await apiClient.patch<{ 
      success: boolean
      message: string 
    }>(
      `/api/v1/rbac-admin/users/${userId}/reports-toggle/`,
      { reports_enabled: reportsEnabled }
    )
    return res.data
  },

  // ========================================================================
  // USER ASSIGNMENT OPERATIONS
  // ========================================================================

  async changeUserRole(
    userId: number,
    newRole: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user',
    options?: {
      agencyId?: number
      parentSellerId?: number
    }
  ) {
    const payload: ChangeRoleRequest = {
      action: 'change_role',
      user_id: userId,
      new_role: newRole,
      agency_id: options?.agencyId,
      parent_seller_id: options?.parentSellerId,
    }

    const res = await apiClient.post<ChangeRoleResponse>(
      '/api/v1/rbac-admin/user-assignments/',
      payload
    )
    return res.data
  },

  async assignSellerToAgency(
    sellerId: number,
    agencyId: number,
    options?: {
      serviceTier?: string
      monthlyFee?: number
    }
  ) {
    const payload: AssignSellerToAgencyRequest = {
      action: 'assign_seller_to_agency',
      user_id: sellerId,
      agency_id: agencyId,
      service_tier: options?.serviceTier,
      monthly_fee: options?.monthlyFee,
    }

    const res = await apiClient.post<AssignSellerToAgencyResponse>(
      '/api/v1/rbac-admin/user-assignments/',
      payload
    )
    return res.data
  },

  async assignUserToSeller(
    userId: number, 
    parentSellerId: number,
    options?: { access_level?: 'full' | 'read_only' | 'limited' }
  ) {
    const payload: AssignUserToSellerRequest = {
      action: 'assign_user_to_seller',
      user_id: userId,
      parent_seller_id: parentSellerId,
      access_level: options?.access_level
    }

    const res = await apiClient.post<AssignUserToSellerResponse>(
      '/api/v1/rbac-admin/user-assignments/',
      payload
    )
    return res.data
  },

  async assignAdminToAgencies(adminId: number, agencyIds: number[]) {
    const payload: AssignAdminToAgenciesRequest = {
      action: 'assign_admin_to_agencies',
      user_id: adminId,
      agency_ids: agencyIds,
    }

    const res = await apiClient.post<AssignAdminToAgenciesResponse>(
      '/api/v1/rbac-admin/user-assignments/',
      payload
    )
    return res.data
  },

  async performUserAssignment(payload: UserAssignmentRequest) {
    const res = await apiClient.post(
      '/api/v1/rbac-admin/user-assignments/',
      payload
    )
    return res.data
  },

  /**
   * Remove admin from a specific agency
   */
  async removeAdminFromAgency(adminId: number, agencyId: number) {
    const res = await apiClient.delete(
      '/api/v1/rbac-admin/user-assignments/',
      { 
        data: {
          action: 'remove_admin_from_agency',
          user_id: adminId,
          agency_id: agencyId
        }
      }
    )
    return res.data
  },

  // ========================================================================
  // HIERARCHY & AVAILABLE RESOURCES
  // ========================================================================

  async getAvailableAssignments() {
    const res = await apiClient.get<AvailableAssignmentsResponse>(
      '/api/v1/rbac-admin/available-assignments/'
    )
    return res.data
  },

  async getUserHierarchy() {
    const res = await apiClient.get<UserHierarchyResponse>(
      '/api/v1/rbac-admin/user-hierarchy/'
    )
    return res.data
  },

  // ========================================================================
  // AGENCY MANAGEMENT
  // ========================================================================

  async listAgencies(params?: { search?: string; is_active?: boolean }) {
    const res = await apiClient.get<Agency[]>(
      '/api/v1/rbac-admin/agencies/',
      { params }
    )
    return res.data
  },

  async getAgency(agencyId: number) {
    const res = await apiClient.get<Agency>(
      `/api/v1/rbac-admin/agencies/${agencyId}/`
    )
    return res.data
  },

  async createAgency(data: { name: string; slug: string; description?: string }) {
    const res = await apiClient.post<Agency>(
      '/api/v1/rbac-admin/agencies/',
      data
    )
    return res.data
  },

  async updateAgency(agencyId: number, data: Partial<Agency>) {
    const res = await apiClient.put<Agency>(
      `/api/v1/rbac-admin/agencies/${agencyId}/`,
      data
    )
    return res.data
  },

  async deleteAgency(agencyId: number) {
    await apiClient.delete(`/api/v1/rbac-admin/agencies/${agencyId}/`)
  },

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  async getUsersByRole(
    roleName: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user', 
    params?: Omit<UserListParams, 'role_name'>
  ) {
    return this.listUsers({ ...params, role_name: roleName })
  },

  async getAdmins(params?: Omit<UserListParams, 'role_name'>) {
    return this.getUsersByRole('admin', params)
  },

  async getSellers(params?: Omit<UserListParams, 'role_name'>) {
    return this.getUsersByRole('seller', params)
  },

  async getAgencyUsers(params?: Omit<UserListParams, 'role_name'>) {
    return this.getUsersByRole('agency', params)
  },

  async getUsersByAgency(agencyId: number, params?: Omit<UserListParams, 'agency_id'>) {
    return this.listUsers({ ...params, agency_id: agencyId })
  },

  // ========================================================================
  // PERMISSION MANAGEMENT
  // ========================================================================

  async listPermissions(params?: { category?: string; search?: string }) {
    const res = await apiClient.get<PermissionListResponse>(
      '/api/v1/rbac-admin/permissions/',
      { params }
    )
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Permissions response:', res.data);
    }
    
    return res.data
  },

  async getPermissionsByCategory(category: string) {
    const res = await apiClient.get<Permission[]>(
      `/api/v1/rbac-admin/permissions/category/${category}/`
    )
    return res.data
  },

  async getPermission(permissionId: string | number) {
    const res = await apiClient.get<PermissionDetailResponse>(
      `/api/v1/rbac-admin/permissions/${permissionId}/`
    )
    return res.data
  },

  async createPermission(data: {
    codename: string
    name: string
    description?: string
    category?: string
  }) {
    const res = await apiClient.post<Permission>(
      '/api/v1/rbac-admin/permissions/',
      data
    )
    return res.data
  },

  async updatePermission(permissionId: string | number, data: {
    codename?: string
    name?: string
    description?: string
    category?: string
  }) {
    const res = await apiClient.put<Permission>(
      `/api/v1/rbac-admin/permissions/${permissionId}/`,
      data
    )
    return res.data
  },

  async deletePermission(permissionId: string | number) {
    await apiClient.delete(`/api/v1/rbac-admin/permissions/${permissionId}/`)
  },

  // ========================================================================
  // USER PERMISSION OVERRIDES (UPDATED)
  // ========================================================================

  /**
   * Get permission overrides for a user's current role
   * UPDATED: Removed agencyId parameter - works on current role only
   */
  async getUserPermissionOverrides(userId: number) {
    const res = await apiClient.get<UserPermissionOverridesResponse>(
      `/api/v1/rbac-admin/users/${userId}/permissions/`
    )
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Raw user permissions API response:', res.data);
    }
    
    return res.data
  },

  /**
   * Grant or revoke a permission for a user
   * UPDATED: Uses permission_id instead of permission_codename, removed agency_id
   */
  async grantUserPermission(userId: number, data: {
    permission_id: string | number
    is_granted: boolean
    reason?: string
    context_data?: Record<string, any>
    expires_at?: string
  }) {
    const res = await apiClient.post(
      `/api/v1/rbac-admin/users/${userId}/permissions/`,
      data
    )
    return res.data
  },

  /**
   * Update an existing permission override
   */
  async updatePermissionOverride(userId: number, overrideId: number, data: {
    is_granted?: boolean
    reason?: string
    context_data?: Record<string, any>
    expires_at?: string | null
  }) {
    const res = await apiClient.put(
      `/api/v1/rbac-admin/users/${userId}/permissions/${overrideId}/`,
      data
    )
    return res.data
  },

  /**
   * Remove a permission override
   */
  async removePermissionOverride(userId: number, overrideId: number) {
    await apiClient.delete(
      `/api/v1/rbac-admin/users/${userId}/permissions/${overrideId}/`
    )
  },

  /**
   * Get user's effective permissions (role defaults + overrides)
   * UPDATED: Removed agencyId parameter
   */
  async getUserEffectivePermissions(userId: number) {
    const res = await apiClient.get<UserEffectivePermissionsResponse>(
      `/api/v1/rbac-admin/users/${userId}/effective-permissions/`
    )
    return res.data
  },

  // ========================================================================
  // REPORT MANAGEMENT
  // ========================================================================

  async listReports(filters: ReportFilters) {
    const res = await apiClient.get<PaginatedResponse<ReportListItem>>(
      '/api/v1/rbac-admin/reports/',
      { params: filters }
    )
    return res.data
  },

  async rerunReport(reportId: string, reportSource: 'ads' | 'fba') {
    const res = await apiClient.post(
      `/api/v1/rbac-admin/reports/${reportId}/${reportSource}/rerun/`
    )
    return res.data
  },

  async getReportDetails(reportId: string, reportSource: 'ads' | 'fba') {
    const res = await apiClient.get(
      `/api/v1/rbac-admin/reports/${reportId}/${reportSource}/`
    )
    return res.data
  },

  async getReportStatusSummary(days = 7) {
    const res = await apiClient.get(
      '/api/v1/rbac-admin/reports/status-summary/',
      { params: { days } }
    )
    return res.data as Array<{ status: string; count: number; source: 'ads' | 'fba' }>
  },

  async getReportDashboard(days = 30) {
    const res = await apiClient.get(
      '/api/v1/rbac-admin/reports/dashboard/',
      { params: { days } }
    )
    return res.data
  },

  // ========================================================================
  // ROLE MANAGEMENT
  // ========================================================================

  async listRoles(params?: { search?: string }) {
    const res = await apiClient.get<RoleListResponse>(
      '/api/v1/rbac-admin/roles/',
      { params }
    )
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 Raw roles API response:', res.data);
    }
    
    return res.data
  },

  async getRole(roleName: string) {
    const res = await apiClient.get<RoleDetailResponse>(
      `/api/v1/rbac-admin/roles/${roleName}/`
    )
    return res.data
  },

  async getRolePermissions(roleName: string) {
    const res = await apiClient.get<RolePermissionsResponse>(
      `/api/v1/rbac-admin/roles/${roleName}/permissions/`
    )
    return res.data
  },

  async addRolePermissions(
    roleName: string, 
    permissionIds: string[] | number[]
  ) {
    const res = await apiClient.post(
      `/api/v1/rbac-admin/roles/${roleName}/permissions/`,
      { permission_ids: permissionIds }
    )
    return res.data as {
      role: string
      added_permissions: Array<{
        codename: string
        name: string
      }>
      added_count: number
      already_assigned?: string[]
      not_found?: string[]
    }
  },

  async removeRolePermissions(
    roleName: string, 
    permissionIds: string[] | number[]
  ) {
    const res = await apiClient.delete(
      `/api/v1/rbac-admin/roles/${roleName}/permissions/`,
      { data: { permission_ids: permissionIds } }
    )
    return res.data as {
      role: string
      removed_permissions: Array<{
        codename: string
        name: string
      }>
      removed_count: number
      not_assigned?: string[]
    }
  },

  async getRoleHierarchy() {
    const res = await apiClient.get<RoleHierarchyResponse>(
      '/api/v1/rbac-admin/roles/hierarchy/'
    )
    return res.data
  },

  // ========================================================================
  // STAFF EMAIL MANAGEMENT
  // ========================================================================

  async listStaffEmails(params?: {
    user_email?: string;
    staff_email?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    const res = await apiClient.get<PaginatedResponse<StaffEmail>>(
      '/api/v1/rbac-admin/staff-emails/',
      { params }
    )
    return res.data
  },

  async createStaffEmail(data: {
    user: number;
    email: string;
    description?: string;
    is_active?: boolean;
  }) {
    const res = await apiClient.post<StaffEmail>(
      '/api/v1/rbac-admin/staff-emails/',
      data
    )
    return res.data
  },

  async createStaffEmailByEmail(data: {
    user_email: string;
    email: string;
    description?: string;
    is_active?: boolean;
  }) {
    const res = await apiClient.post<StaffEmail>(
      '/api/v1/rbac-admin/staff-emails/create_by_email/',
      data
    )
    return res.data
  },

  async bulkCreateStaffEmails(data: {
    user_email: string;
    staff_emails: Array<{
      email: string;
      description?: string;
    }>;
  }) {
    const res = await apiClient.post(
      '/api/v1/rbac-admin/staff-emails/bulk_create/',
      data
    )
    return res.data
  },

  async getStaffEmailsByUser(userEmail: string) {
    const res = await apiClient.get<PaginatedResponse<StaffEmail>>(
      `/api/v1/rbac-admin/staff-emails/by_user/`,
      { params: { user_email: userEmail } }
    )
    return res.data
  },

  async updateStaffEmail(id: number, data: Partial<{
    email: string;
    description: string;
    is_active: boolean;
  }>) {
    const res = await apiClient.patch<StaffEmail>(
      `/api/v1/rbac-admin/staff-emails/${id}/`,
      data
    )
    return res.data
  },

  async toggleStaffEmailActive(id: number) {
    const res = await apiClient.post(
      `/api/v1/rbac-admin/staff-emails/${id}/toggle_active/`
    )
    return res.data
  },

  async deleteStaffEmail(id: number) {
    await apiClient.delete(`/api/v1/rbac-admin/staff-emails/${id}/`)
  },

  async bulkDeleteStaffEmails(ids: number[]) {
    const res = await apiClient.delete(
      '/api/v1/rbac-admin/staff-emails/bulk_delete/',
      { data: { ids } }
    )
    return res.data
  },

  async getUsersWithStaffEmails(params?: {
    has_staff_emails?: boolean;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    const res = await apiClient.get<PaginatedResponse<UserWithStaffEmails>>(
      '/api/v1/rbac-admin/staff-emails/users/',
      { params }
    )
    return res.data
  },

  async getStaffEmailStats() {
    const res = await apiClient.get<StaffEmailStats>(
      '/api/v1/rbac-admin/staff-emails/stats/'
    )
    return res.data
  },

  async sendTestStaffAlert(data: {
    user_email: string;
    subject: string;
    message: string;
  }) {
    const res = await apiClient.post(
      '/api/v1/rbac-admin/staff-emails/send-test-alert/',
      data
    )
    return res.data
  },
  
  // ========================================================================
  // SELLER-AGENCY ASSIGNMENT MANAGEMENT
  // ========================================================================

  /**
   * Get all sellers with their agency assignment status
   */
  async getSellersWithAgencyStatus(params?: {
    agency_id?: number
    is_assigned?: boolean
    page?: number
    page_size?: number
  }) {
    const res = await apiClient.get<PaginatedResponse<AdminUser>>(
      '/api/v1/rbac-admin/users/',
      { params: { ...params, role_name: 'seller' } }
    )
    return res.data
  },

  /**
   * Get unassigned sellers (sellers without agency)
   */
  async getUnassignedSellers(params?: { page?: number; page_size?: number }) {
    // This will need backend support to filter unassigned sellers
    // For now, fetch all sellers and filter on frontend
    const res = await apiClient.get<PaginatedResponse<AdminUser>>(
      '/api/v1/rbac-admin/users/',
      { params: { ...params, role_name: 'seller' } }
    )
    return res.data
  },

  /**
   * Remove seller from agency (keeps seller role)
   */
  async removeSellerFromAgency(sellerId: number, agencyId: number) {
    const res = await apiClient.delete(
      '/api/v1/rbac-admin/user-assignments/',
      { 
        data: {
          action: 'remove_seller_from_agency',
          user_id: sellerId,
          agency_id: agencyId
        }
      }
    )
    return res.data
  },

  async removeAgencyRole(userId: number) {
    const res = await apiClient.delete(
      '/api/v1/rbac-admin/user-assignments/',
      { 
        data: {
          action: 'remove_agency_role',
          user_id: userId
        }
      }
    )
    return res.data
  },

  // ========================================================================
  // SELLER-STAFF ASSIGNMENT MANAGEMENT
  // ========================================================================

  /**
   * Get staff users under a seller
   */
  async getSellerStaff(sellerId: number) {
    // This retrieves users with parent_seller_id matching the seller
    const res = await apiClient.get<PaginatedResponse<AdminUser>>(
      '/api/v1/rbac-admin/users/',
      { params: { role_name: 'user', page_size: 1000 } }
    )
    
    // Filter on frontend for now - backend could add parent_seller_id filter
    const staffUsers = res.data.results.filter(
      user => user.current_role?.parent_seller_id === sellerId
    )
    
    return {
      ...res.data,
      results: staffUsers,
      count: staffUsers.length
    }
  },

  /**
   * Get unassigned users (users without parent seller)
   */
  async getUnassignedUsers(params?: { page?: number; page_size?: number }) {
    const res = await apiClient.get<PaginatedResponse<AdminUser>>(
      '/api/v1/rbac-admin/users/',
      { params: { ...params, role_name: 'user' } }
    )
    
    // Filter users without parent_seller
    const unassigned = res.data.results.filter(
      user => !user.current_role?.parent_seller_id
    )
    
    return {
      ...res.data,
      results: unassigned,
      count: unassigned.length
    }
  },

  /**
   * Remove user from seller staff
   */
  async removeUserFromSeller(userId: number) {
    const res = await apiClient.delete(
      '/api/v1/rbac-admin/user-assignments/',
      { 
        data: {
          action: 'remove_user_from_seller',
          user_id: userId
        }
      }
    )
    return res.data
  },

  async getAgencySellers(agencyId: number) {
    const res = await apiClient.get<AgencySellersResponse>(
      `/api/v1/rbac-admin/agencies/${agencyId}/sellers/`
    )
    return res.data
  },

  /**
   * Update staff user access level
   */
  async updateStaffAccessLevel(
    userId: number,
    parentSellerId: number,
    accessLevel: 'full' | 'read_only' | 'limited'
  ) {
    return this.assignUserToSeller(userId, parentSellerId, { access_level: accessLevel })
  },

}