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
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { isImpersonating } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const publicRoutes = [
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/',
  ]

  const isPublicRoute = publicRoutes.includes(pathname || '')
  const routesWithoutSidebar = pathname?.startsWith('/admin')
  const impersonationActive = mounted && isImpersonating()
  
  const topOffset = 'top-16'
  const heightCalc = 'h-[calc(100vh-4rem)]'

  // PUBLIC PAGES
  if (isPublicRoute) {
    return <div className="w-full">{children}</div>
  }

  // PROTECTED PAGES WITHOUT SIDEBAR
  if (routesWithoutSidebar) {
    return (
      <RouteGuard>
        <div className="w-full bg-gradient-to-b from-[#ADC8F3] to-[#D7E3F9] min-h-screen">
          {children}
        </div>
      </RouteGuard>
    )
  }

  // PROTECTED PAGES WITH SIDEBAR
  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex min-h-screen">
        <div
          className={`flex-shrink-0 transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className={`sticky ${topOffset} ${heightCalc} transition-all duration-300 ${!mounted ? 'opacity-0' : 'opacity-100'}`}>
            <Sidebar />
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-gradient-to-b from-[#ADC8F3] to-[#D7E3F9] min-h-screen">
          <RouteGuard>{children}</RouteGuard>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}