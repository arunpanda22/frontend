import { apiClient } from '@/lib/api/config'

export interface ImpersonationUser {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  display_name: string
  is_current: boolean
  role: string
  agency_id: number | null
  agency_name: string | null
}

export interface ImpersonationListResponse {
  users: ImpersonationUser[]
  impersonation_active: boolean
  total_count: number
  original_user?: {
    id: number
    email: string
  }
  current_user?: {
    id: number
    email: string
  }
}

export interface ImpersonationResponse {
  refresh: string
  access: string
  user: {
    id: number
    email: string
    username: string
    first_name: string
    last_name: string
  }
  role: string
  agency: string | null
  message: string
}

export const impersonationService = {
  /**
   * Get available users for impersonation based on current user's role
   */
  async getAvailableUsers(): Promise<ImpersonationUser[]> {
    const response = await apiClient.get<ImpersonationListResponse>('/api/v1/auth/switch-seller/')
    console.log('🔍 API Response:', response.data)
    
    // Return the users array from the response
    return response.data.users || []
  },

  /**
   * Switch to a specific seller (can be used for initial impersonation or switching between sellers)
   */
  async switchToSeller(userId: number): Promise<ImpersonationResponse> {
    const response = await apiClient.post<ImpersonationResponse>('/api/v1/auth/switch-seller/', {
      user_id: userId
    })
    return response.data
  },

  /**
   * End current impersonation session and return to original user
   */
  async endImpersonation(): Promise<ImpersonationResponse> {
    const response = await apiClient.post<ImpersonationResponse>('/api/v1/auth/end-impersonation/')
    return response.data
  }
}