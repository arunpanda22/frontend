'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { RiArrowRightDoubleLine, RiArrowLeftDoubleLine } from "react-icons/ri"
import { useAuth } from '@/lib/context/AuthContext'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useSidebar } from '@/components/layout/layout-wrapper'
import { ROUTES, TOOL_CATEGORIES, RouteConfig } from '@/config/routes.config'

export function Sidebar() {
  const pathname = usePathname()
  const { user, userProfile, isImpersonating } = useAuth()
  const { canAccess, isLoadingPermissions } = usePermissions()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [isDashboardOpen, setIsDashboardOpen] = useState(true)
  const [isToolsOpen, setIsToolsOpen] = useState(true)

  // Force refresh sidebar when impersonation state changes
  const impersonationActive = isImpersonating()
  
  useEffect(() => {
    // This effect will trigger a re-render when impersonation changes
    // The useMemo hooks below will recalculate accessible routes
  }, [impersonationActive, userProfile?.id])

  /**
   * Filter routes based on user permissions
   */
  const filterAccessibleRoutes = (routes: RouteConfig[]): RouteConfig[] => {
    return routes.filter(route => {
      // Check basic permission access
      const hasAccess = canAccess({
        permission: route.permission,
        anyPermissions: route.anyPermissions,
        allPermissions: route.allPermissions,
        role: route.role,
        minRole: route.minRole,
      })

      if (!hasAccess) return false

      // Additional check: Dashboard routes require seller account
      if (route.requiresSellerAccount) {
        const hasSellerAccount = 
          userProfile?.connected_seller_accounts &&
          userProfile.connected_seller_accounts.length > 0

        return hasSellerAccount
      }

      return true
    })
  }

  /**
   * Get accessible dashboard routes
   */
  const accessibleDashboard = useMemo(() => {
    const dashboardCategory = ROUTES.find(r => r.category === 'dashboard')
    if (!dashboardCategory) return []
    return filterAccessibleRoutes(dashboardCategory.children)
  }, [userProfile, isLoadingPermissions, impersonationActive])

  /**
   * Get accessible tools organized by category
   */
  const accessibleToolCategories = useMemo(() => {
    return TOOL_CATEGORIES.map(category => ({
      name: category.name,
      tools: filterAccessibleRoutes(category.tools),
    })).filter(category => category.tools.length > 0) // Only show categories with accessible tools
  }, [userProfile, isLoadingPermissions, impersonationActive])

  /**
   * Check if user has access to admin section
   */
  const hasAdminAccess = useMemo(() => {
    const adminCategory = ROUTES.find(r => r.category === 'admin')
    if (!adminCategory) return false
    const accessibleAdminRoutes = filterAccessibleRoutes(adminCategory.children)
    return accessibleAdminRoutes.length > 0
  }, [userProfile, isLoadingPermissions, impersonationActive])

  /**
   * Get first accessible admin route (for the main admin link)
   */
  const firstAdminRoute = useMemo(() => {
    const adminCategory = ROUTES.find(r => r.category === 'admin')
    if (!adminCategory) return null
    const accessibleAdminRoutes = filterAccessibleRoutes(adminCategory.children)
    return accessibleAdminRoutes[0]?.href || '/admin/users'
  }, [userProfile, isLoadingPermissions, impersonationActive])

  // Don't render sidebar if no user
  if (!user) return null

  // Show loading state while permissions are loading
  if (isLoadingPermissions()) {
    return (
      <div className="bg-gray-900 border-r border-gray-700 flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 0;
          margin: 8px 0;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
          border-radius: 0;
          border: none;
          transition: background-color 0.2s ease;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.5);
        }
      `}</style>

      <div className="bg-gray-900 border-r border-gray-700 flex flex-col h-full">
        
        {/* Toggle Button */}
        <div className={`flex items-center p-3 border-b border-gray-700 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-gray-300">Navigation</h2>
              {impersonationActive && (
                <span className="text-xs text-yellow-400 mt-0.5">
                  Impersonating
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <RiArrowRightDoubleLine className="h-5 w-5" />
            ) : (
              <RiArrowLeftDoubleLine className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Collapsed State */}
        {isCollapsed ? (
          <div className="flex-1 flex items-center justify-center">
            {impersonationActive && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Impersonating" />
            )}
          </div>
        ) : (
          /* Expanded State - Full Navigation */
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            <nav className="p-2 space-y-1">
              
              {/* Dashboard Section - Only show if user has accessible dashboard routes */}
              {accessibleDashboard.length > 0 && (
                <div>
                  <button
                    onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                  >
                    <span>OptivizeX</span>
                    {isDashboardOpen ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                  
                  {isDashboardOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {accessibleDashboard.map((route) => (
                        <Link
                          key={route.href}
                          href={route.href}
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                            pathname === route.href
                              ? 'bg-gray-800 text-white border-l-2 border-yellow-400'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <div className="font-medium">{route.name}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tools Section - Only show if user has accessible tools */}
              {accessibleToolCategories.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                  >
                    <span>Tools</span>
                    {isToolsOpen ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>

                  {isToolsOpen && (
                    <div className="ml-4 mt-1 space-y-2">
                      {accessibleToolCategories.map((category) => (
                        <div key={category.name}>
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {category.name}
                          </div>
                          <div className="space-y-1">
                            {category.tools.map((tool) => (
                              <Link
                                key={tool.href}
                                href={tool.href}
                                className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                                  pathname === tool.href
                                    ? 'bg-gray-800 text-white border-l-2 border-yellow-400'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                              >
                                <div className="font-medium">{tool.name}</div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Admin Section - Only show if user has admin access */}
              {hasAdminAccess && firstAdminRoute && (
                <div className="pt-2">
                  <Link
                    href={firstAdminRoute}
                    className={`block w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname?.startsWith('/admin')
                        ? 'bg-gray-800 text-white border-l-2 border-yellow-400'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    Admin
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </>
  )
}