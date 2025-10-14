'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { RouteGuard } from '../gaurds/route-guard'
import { useAuth } from '@/lib/context/AuthContext'

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false) // Track client-side mount
  const pathname = usePathname()
  const { isImpersonating } = useAuth()

  // Wait for client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Public routes that don't need authentication or RouteGuard
  const publicRoutes = [
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/',
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname || '')

  // Routes that need auth but no sidebar (like admin pages)
  const routesWithoutSidebar = pathname?.startsWith('/admin')

  // Only check impersonation after mount to prevent hydration mismatch
  const impersonationActive = mounted && isImpersonating()
  
  const topOffset = 'top-16'
  const heightCalc = 'h-[calc(100vh-4rem)]'

  // PUBLIC PAGES - No auth needed, no sidebar, no guard
  if (isPublicRoute) {
    return <div className="w-full">{children}</div>
  }

  // PROTECTED PAGES WITHOUT SIDEBAR (like /admin)
  if (routesWithoutSidebar) {
    return (
      <RouteGuard>
        <div className="w-full">{children}</div>
      </RouteGuard>
    )
  }

  // PROTECTED PAGES WITH SIDEBAR (main app)
  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex min-h-screen">
        <div
          className={`flex-shrink-0 transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Sidebar with dynamic top position based on impersonation */}
          <div className={`sticky ${topOffset} ${heightCalc} transition-all duration-300 ${!mounted ? 'opacity-0' : 'opacity-100'}`}>
            <Sidebar />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <RouteGuard>{children}</RouteGuard>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}