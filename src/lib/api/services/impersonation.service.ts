import { apiClient } from '@/lib/api/config'

export interface ImpersonationUser {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  display_name: string
  role: string
  agency_id: number
  agency_name: string
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
  agency: string
  message: string
}

export const impersonationService = {
  /**
   * Get available users for impersonation based on current user's role
   */
  async getAvailableUsers(): Promise<ImpersonationUser[]> {
    const response = await apiClient.get('/api/v1/auth/switch-to-user/')
    console.log('🔍 API Response:', response.data)
    // The API returns the array directly, not wrapped in a data property
    return response.data || []
  },

  /**
   * Start impersonation of a specific user
   */
  async startImpersonation(userId: number): Promise<ImpersonationResponse> {
    const response = await apiClient.post('/api/v1/auth/switch-seller/', {
      user_id: userId
    })
    return response.data
  },

  /**
   * End current impersonation session
   */
  async endImpersonation(): Promise<ImpersonationResponse> {
    const response = await apiClient.post('/api/v1/auth/end-impersonation/')
    return response.data
  }
}
