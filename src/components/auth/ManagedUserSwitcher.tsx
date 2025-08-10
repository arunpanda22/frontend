'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { apiClient } from '@/lib/api/config'

interface ManagedUserSwitcherProps {
  onSwitchComplete?: () => void
}

interface AvailableUser {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: string
}

/**
 * Component for agency admins to switch between users under their agency
 * Note: This is a base implementation - UI will be implemented later
 */
export function ManagedUserSwitcher({ onSwitchComplete }: ManagedUserSwitcherProps) {
  const { 
    isAgencyAdmin,
    currentManagedUser, 
    switchToManagedUser,
    resetToAdminUser,
    isActingAsManagedUser
  } = usePermissions()
  
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch users available for switching
  useEffect(() => {
    if (!isAgencyAdmin()) return;
    
    const fetchAvailableUsers = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/v1/auth/switch-to-user/');
        setAvailableUsers(response.data || []);
      } catch (error) {
        console.error('Error fetching available users:', error);
        setError('Failed to load available users');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailableUsers();
  }, [isAgencyAdmin]);
  
  // Don't render the switcher if the user is not an agency admin or has no available users
  if (!isAgencyAdmin() || (availableUsers.length === 0 && !isLoading)) {
    return null;
  }
  
  const handleSwitchToUser = async (userId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      await switchToManagedUser(userId.toString())
      onSwitchComplete?.()
    } catch (error) {
      console.error('Failed to impersonate user:', error)
      setError('Failed to impersonate user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleEndImpersonation = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await resetToAdminUser()
      onSwitchComplete?.()
    } catch (error) {
      console.error('Failed to end impersonation:', error)
      setError('Failed to end impersonation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Get original user info from localStorage if impersonating
  const getOriginalUserInfo = () => {
    if (!isActingAsManagedUser()) return null;
    try {
      const originalUserJson = localStorage.getItem('originalUser');
      return originalUserJson ? JSON.parse(originalUserJson) : null;
    } catch (e) {
      return null;
    }
  };
  
  const originalUserInfo = getOriginalUserInfo();
  
  return (
    <div className="user-switcher">
      {/* 
        This is a placeholder implementation based on the documentation
        The actual UI will be implemented later as per requirements
      */}
      
      {isActingAsManagedUser() && (
        <div className="impersonation-banner">
          <p>
            You are currently viewing as another user. 
            {originalUserInfo && (
              <span> Return to your {originalUserInfo.role} account at {originalUserInfo.agency}?</span>
            )}
          </p>
          <button
            onClick={handleEndImpersonation}
            disabled={isLoading}
            className="end-impersonation-button"
          >
            End Impersonation
          </button>
        </div>
      )}
      
      {!isActingAsManagedUser() && (
        <div className="user-list">
          <h3>Switch to User</h3>
          {isLoading && <div className="loading">Loading available users...</div>}
          <ul>
            {availableUsers.map((user) => (
              <li key={user.id}>
                {user.first_name} {user.last_name} ({user.email}) - {user.role}
                <button 
                  onClick={() => handleSwitchToUser(user.id)}
                  disabled={isLoading}
                >
                  Switch
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default ManagedUserSwitcher