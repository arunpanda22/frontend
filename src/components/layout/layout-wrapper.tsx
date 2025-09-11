'use client'

import { createContext, useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'

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
  
  // Define routes that should not show the sidebar
  const routesWithoutSidebar = [
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/', // landing page
  ]
  
  // Check if current path starts with /admin or is in the routes without sidebar
  const shouldHideSidebar = pathname?.startsWith('/admin') || 
                            routesWithoutSidebar.includes(pathname || '')
  
  // If sidebar should be hidden, render children without sidebar
  if (shouldHideSidebar) {
    return <div className="w-full">{children}</div>
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex min-h-screen">
        <div className={`flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}>
          <Sidebar />
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  )
}