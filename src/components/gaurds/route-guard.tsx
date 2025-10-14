'use client'

import { ReactNode, useEffect, useState } from "react"
import { getRouteByHref } from "@/config/routes.config"
import { useAuth } from "@/lib/context/AuthContext"
import usePermissions from "@/lib/hooks/usePermissions"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "./loading-screen"

interface RouteGuardProps {
  children: ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const { canAccess, isLoadingPermissions } = usePermissions()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Don't check anything while auth is initializing
    if (authLoading) {
      return
    }

    // Reset checking state when pathname changes
    setIsChecking(true)

    // 1. No user → redirect to login
    if (!user) {
      router.push('/login')
      return
    }

    // 2. No user profile yet (still loading from backend) → wait
    if (!userProfile) {
      return
    }

    // 3. Still loading permissions from backend → wait
    if (isLoadingPermissions()) {
      return
    }

    // 4. Check route permissions
    const currentRoute = getRouteByHref(pathname)

    if (currentRoute) {
      const hasAccess = canAccess({
        permission: currentRoute.permission,
        anyPermissions: currentRoute.anyPermissions,
        allPermissions: currentRoute.allPermissions,
        role: currentRoute.role,
        minRole: currentRoute.minRole,
      })

      if (!hasAccess) {
        router.push(`/unauthorized?route=${pathname}`)
        return
      }
    }

    // All checks passed
    setIsChecking(false)
  }, [pathname, user, userProfile, authLoading, isLoadingPermissions, canAccess, router])

  // Show loading screen while anything is loading
  if (authLoading || !user || !userProfile || isLoadingPermissions() || isChecking) {
    return <LoadingScreen />
  }

  return <>{children}</>
}