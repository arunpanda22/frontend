'use client'

import { createContext, useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { RouteGuard } from '../gaurds/route-guard'

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
  const pathname = usePathname()

  // Routes without sidebar (like login/signup/public pages)
  const routesWithoutSidebar = [
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/',
  ]

  // Hide sidebar for these routes
  const shouldHideSidebar =
    pathname?.startsWith('/admin') ||
    routesWithoutSidebar.includes(pathname || '')

  if (shouldHideSidebar) {
    // Public pages: no sidebar, but still guarded if needed
    return (
      <RouteGuard>
        <div className="w-full">{children}</div>
      </RouteGuard>
    )
  }

  // Protected area: sidebar + route guard
  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex min-h-screen">
        <div
          className={`flex-shrink-0 transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <Sidebar />
        </div>
        <div className="flex-1 overflow-hidden">
          <RouteGuard>{children}</RouteGuard>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
