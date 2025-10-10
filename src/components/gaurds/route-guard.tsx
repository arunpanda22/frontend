'use client'

import { ReactNode } from "react"
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
  const { user } = useAuth()
  const { canAccess, isLoadingPermissions } = usePermissions()

  // 1. No user → redirect
  if (!user) {
    router.push('/login')
    return null
  }

  // 2. Loading permissions → show spinner
  if (isLoadingPermissions()) {
    return <LoadingScreen />
  }

  // 3. Route config
  const currentRoute = getRouteByHref(pathname)

  if (!currentRoute) return children

  const hasAccess = canAccess({
    permission: currentRoute.permission,
    anyPermissions: currentRoute.anyPermissions,
    allPermissions: currentRoute.allPermissions,
    role: currentRoute.role,
    minRole: currentRoute.minRole,
  })

  if (!hasAccess) {
    router.push(`/unauthorized?route=${pathname}`)
    return null
  }

  return children
}
