'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { useAvailableUsersForImpersonation } from '@/lib/hooks/queries/use-impersonation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ErrorMessage } from '@/components/ui/error-message'
import { 
  UserIcon, 
  UsersIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function UserSwitchingPage() {
  const { 
    userProfile, 
    startImpersonation, 
    endImpersonation, 
    isImpersonating 
  } = useAuth()
  
  const [impersonating, setImpersonating] = useState(false)
  const [endingImpersonation, setEndingImpersonation] = useState(false)

  // Use React Query for available users
  const { 
    data: availableUsers = [], 
    isLoading: loading, 
    error: usersError 
  } = useAvailableUsersForImpersonation(true)
  
  const error = usersError ? (usersError as Error).message : null

  // Handle start impersonation
  const handleStartImpersonation = async (user: any) => {
    try {
      setImpersonating(true)
      await startImpersonation(user.id)
      // Refresh the page to update the UI
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to start impersonation:', err)
    } finally {
      setImpersonating(false)
    }
  }

  // Handle end impersonation
  const handleEndImpersonation = async () => {
    try {
      setEndingImpersonation(true)
      await endImpersonation()
      // Refresh the page to update the UI
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to end impersonation:', err)
    } finally {
      setEndingImpersonation(false)
    }
  }

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-orange-100 text-orange-800'
      case 'agency': return 'bg-yellow-100 text-yellow-800'
      case 'user': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin': return '👑'
      case 'admin': return '🛡️'
      case 'agency': return '🏢'
      case 'user': return '👤'
      default: return '❓'
    }
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
          <p className="text-red-700">
            User profile not available. Please refresh the page.
          </p>
        </div>
      </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Switching</h1>
          <p className="text-gray-600">
            Switch between user accounts for support and administrative tasks.
          </p>
        </div>

        {/* Current User Info */}
        <Card className="mb-8 shadow-sm border-gray-200">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <UserIcon className="h-5 w-5" />
              Current User
            </CardTitle>
            <CardDescription className="text-gray-600">
              You are currently logged in as this user
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                  <span className="text-lg font-semibold text-gray-700">
                    {(userProfile.first_name?.[0] || userProfile.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {userProfile.first_name} {userProfile.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{userProfile.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRoleColor(userProfile.rbac_context?.role_name || 'user')}>
                      {getRoleIcon(userProfile.rbac_context?.role_name || 'user')} {userProfile.rbac_context?.role_name || 'user'}
                    </Badge>
                    {userProfile.rbac_context?.agency_name && (
                      <Badge variant="outline" className="border-gray-300 text-gray-700">
                        {userProfile.rbac_context.agency_name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {isImpersonating() && (
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-orange-600 font-medium">
                    Impersonating
                  </span>
                  <Button
                    onClick={handleEndImpersonation}
                    disabled={endingImpersonation}
                    variant="outline"
                    size="sm"
                    className="ml-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {endingImpersonation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Ending...
                      </>
                    ) : (
                      <>
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        End Impersonation
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Available Users */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <UsersIcon className="h-5 w-5" />
              Available Users for Impersonation
            </CardTitle>
            <CardDescription className="text-gray-600">
              Select a user to impersonate. You can only impersonate users based on your role permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                <span className="ml-3 text-gray-600">Loading available users...</span>
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Available</h3>
                <p className="text-gray-600">
                  You don't have permission to impersonate any users, or there are no users available for impersonation.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">
                          {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleIcon(user.role)} {user.role}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300 text-gray-700">
                            {user.agency_name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartImpersonation(user)}
                      disabled={impersonating}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {impersonating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Switching...
                        </>
                      ) : (
                        <>
                          <ArrowRightIcon className="h-4 w-4 mr-2" />
                          Switch to User
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="mt-6 shadow-sm border-gray-200">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-900">
              <ShieldCheckIcon className="h-4 w-4" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                • Impersonation is logged for security and audit purposes
              </p>
              <p>
                • You can only impersonate users based on your role hierarchy
              </p>
              <p>
                • Always end impersonation sessions when you're done
              </p>
              <p>
                • Use impersonation responsibly and only when necessary
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

