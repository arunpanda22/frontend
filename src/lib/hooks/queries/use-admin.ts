'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import type { ReportFilters, AdminUser, Role, Permission, Agency, StaffEmail, UserWithStaffEmails, StaffEmailStats } from '@/lib/api/services/admin-dashboard.service'

// Query keys for consistent caching
export const adminQueryKeys = {
  reports: ['admin', 'reports'] as const,
  reportDetails: (id: string, source: 'ads' | 'fba') => ['admin', 'reports', source, id] as const,
  users: ['admin', 'users'] as const,
  userDetails: (id: string) => ['admin', 'users', id] as const,
  userRoles: (id: string) => ['admin', 'users', id, 'roles'] as const,
  userPermissions: (id: string) => ['admin', 'users', id, 'permissions'] as const,
  userEffectivePermissions: (id: string) => ['admin', 'users', id, 'effective-permissions'] as const,
  roles: ['admin', 'roles'] as const,
  roleDetails: (roleName: string) => ['admin', 'roles', roleName] as const,
  permissions: ['admin', 'permissions'] as const,
  permissionsByModule: (module: string) => ['admin', 'permissions', 'module', module] as const,
  agencies: ['admin', 'agencies'] as const,
  agencyDetails: (id: number) => ['admin', 'agencies', id] as const,
  dashboardStats: ['admin', 'dashboard-stats'] as const,
  reportStatusSummary: ['admin', 'report-status-summary'] as const,
  staffEmails: ['admin', 'staff-emails'] as const,
  staffEmailsByUser: (userEmail: string) => ['admin', 'staff-emails', 'by-user', userEmail] as const,
  usersWithStaffEmails: ['admin', 'users-with-staff-emails'] as const,
  staffEmailStats: ['admin', 'staff-email-stats'] as const,
}


// Reports
export function useAdminReports(filters?: ReportFilters) {
  return useQuery({
    queryKey: [...adminQueryKeys.reports, filters],
    queryFn: () => adminDashboardService.listReports(filters || { page: 1, page_size: 20 }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useAdminReportDetails(id: string, source: 'ads' | 'fba') {
  return useQuery({
    queryKey: adminQueryKeys.reportDetails(id, source),
    queryFn: () => adminDashboardService.getReportDetails(id, source),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAdminReportStatusSummary() {
  return useQuery({
    queryKey: adminQueryKeys.reportStatusSummary,
    queryFn: () => adminDashboardService.getReportStatusSummary(7),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Users
export function useAdminUsers(filters?: any) {
  return useQuery({
    queryKey: [...adminQueryKeys.users, filters],
    queryFn: () => adminDashboardService.listUsers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - reduce for more frequent updates
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't auto-refetch on window focus
    retry: 3, // Retry failed requests
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useAdminUserDetails(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.userDetails(id),
    queryFn: () => adminDashboardService.getUser(parseInt(id)),
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes - reduce for user details
    gcTime: 15 * 60 * 1000, // 15 minutes - keep user details longer
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useAdminUserRoles(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.userRoles(id),
    queryFn: () => adminDashboardService.getUserRoles(parseInt(id)),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - roles change more frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useAdminUserPermissions(id: string, agencyId?: number) {
  return useQuery({
    queryKey: adminQueryKeys.userPermissions(id),
    queryFn: () => adminDashboardService.getUserPermissionOverrides(parseInt(id)),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute - permissions change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useAdminUserEffectivePermissions(id: string, agencyId: number) {
  return useQuery({
    queryKey: adminQueryKeys.userEffectivePermissions(id),
    queryFn: () => adminDashboardService.getUserEffectivePermissions(parseInt(id)),
    enabled: !!id && !!agencyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// RBAC metadata
export function useAdminRoles(options?: { 
  filters?: { search?: string; is_system_role?: boolean };
  enabled?: boolean;
}) {
  const { filters, enabled = true } = options || {};
  return useQuery({
    queryKey: [...adminQueryKeys.roles, filters],
    queryFn: () => adminDashboardService.listRoles(filters),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - roles change rarely
  })
}

export function useAdminRoleDetails(roleName: string) {
  return useQuery({
    queryKey: adminQueryKeys.roleDetails(roleName),  // Update this too
    queryFn: () => adminDashboardService.getRole(roleName),
    enabled: !!roleName,
    staleTime: 10 * 60 * 1000,
  })
}

export function useAdminPermissions(options?: { 
  filters?: { module?: string; search?: string };
  enabled?: boolean;
}) {
  const { filters, enabled = true } = options || {};
  return useQuery({
    queryKey: [...adminQueryKeys.permissions, filters],
    queryFn: () => adminDashboardService.listPermissions(filters),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions change rarely
  })
}

// export function useAdminPermissionsByModule(module: string) {
//   return useQuery({
//     queryKey: adminQueryKeys.permissionsByModule(module),
//     queryFn: () => adminDashboardService.getPermissionsByModule(module),
//     enabled: !!module,
//     staleTime: 10 * 60 * 1000, // 10 minutes
//   })
// }

// Agency management
export function useAdminAgencies(options?: { 
  filters?: { search?: string; is_active?: boolean };
  enabled?: boolean;
}) {
  const { filters, enabled = true } = options || {};
  return useQuery({
    queryKey: [...adminQueryKeys.agencies, filters],
    queryFn: () => adminDashboardService.listAgencies(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAdminAgencyDetails(id: number) {
  return useQuery({
    queryKey: adminQueryKeys.agencyDetails(id),
    queryFn: () => adminDashboardService.getAgency(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Dashboard stats
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: adminQueryKeys.dashboardStats,
    queryFn: () => adminDashboardService.getReportDashboard(30),
    staleTime: 30 * 1000, // 30 seconds - stats are more dynamic
  })
}

// Staff Email Management
export function useStaffEmails(params?: {
  user_email?: string;
  staff_email?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: [...adminQueryKeys.staffEmails, params],
    queryFn: () => adminDashboardService.listStaffEmails(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useStaffEmailsByUser(userEmail: string) {
  return useQuery({
    queryKey: adminQueryKeys.staffEmailsByUser(userEmail),
    queryFn: () => adminDashboardService.getStaffEmailsByUser(userEmail),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useUsersWithStaffEmails(params?: {
  has_staff_emails?: boolean;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: [...adminQueryKeys.usersWithStaffEmails, params],
    queryFn: () => adminDashboardService.getUsersWithStaffEmails(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useStaffEmailStats() {
  return useQuery({
    queryKey: adminQueryKeys.staffEmailStats,
    queryFn: () => adminDashboardService.getStaffEmailStats(),
    staleTime: 30 * 1000, // 30 seconds
    retry: false, // Don't retry on failure to reduce console errors
    refetchOnWindowFocus: false, // Don't refetch on focus to reduce API calls
  })
}

// Utility hook for manual refresh
export function useAdminQueryRefresh() {
  const queryClient = useQueryClient()
  
  return {
    refreshReports: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.reports })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.reports })
    },
    refreshUsers: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.users })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.users })
    },
    refreshReportDetails: async (id: string, source: 'ads' | 'fba') => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportDetails(id, source) })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.reportDetails(id, source) })
    },
    refreshUserDetails: async (id: string) => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetails(id) })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.userDetails(id) })
    },
    refreshUserRoles: async (id: string) => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.userRoles(id) })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.userRoles(id) })
    },
    refreshUserPermissions: async (id: string) => {
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.userPermissions(id) })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.userPermissions(id) })
    },
    refreshRoles: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.roles })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.roles })
    },
    refreshPermissions: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.permissions })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.permissions })
    },
    refreshAgencies: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.agencies })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.agencies })
    },
    refreshStatusSummary: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportStatusSummary })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.reportStatusSummary })
    },
    refreshStaffEmails: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.staffEmails })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.staffEmails })
    },
    refreshUsersWithStaffEmails: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.usersWithStaffEmails })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.usersWithStaffEmails })
    },
    refreshStaffEmailStats: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.staffEmailStats })
      return queryClient.refetchQueries({ queryKey: adminQueryKeys.staffEmailStats })
    },
    refreshAll: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] })
      return queryClient.refetchQueries({ queryKey: ['admin'] })
    },
  }
}