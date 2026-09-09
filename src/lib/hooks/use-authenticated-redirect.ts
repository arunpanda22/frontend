import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'

/**
 * Hook to redirect authenticated users to their role-based dashboard
 * Use this on public pages like home, login, signup
 */
export function useAuthenticatedRedirect() {
  const router = useRouter()
  const { userProfile, loading, isImpersonating } = useAuth()

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return

    // Don't redirect if not logged in
    if (!userProfile) return

    const roleName = userProfile.rbac_context?.role_name

    // Determine redirect path based on role
    let redirectPath = '/profile' // default

    if (roleName === 'seller') {
      redirectPath = '/dashboard'
    } else if (roleName === 'super_admin' || roleName === 'admin') {
      redirectPath = '/admin/users'
    }

    // If impersonating, always go to main dashboard to see seller view
    if (isImpersonating()) {
      redirectPath = '/'
    }

    // Perform redirect
    router.push(redirectPath)
  }, [userProfile, loading, router, isImpersonating])

  return { loading, userProfile }
}