'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { RiArrowRightDoubleLine, RiArrowLeftDoubleLine } from "react-icons/ri"
import { useAuth } from '@/lib/context/AuthContext'
import { useSidebar } from '@/components/layout/layout-wrapper'

export function Sidebar() {
  const pathname = usePathname()
  const { user, isSuperAdmin, isAdmin, hasRoleOrHigher } = useAuth()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [isDashboardOpen, setIsDashboardOpen] = useState(true)
  const [isToolsOpen, setIsToolsOpen] = useState(true)

  // Define tools for sidebar with categories
  const toolCategories = [
    {
      name: "Content Generation",
      tools: [
        { name: 'Listing Generator', href: '/lister', description: 'Generate optimized product listings' },
      ]
    },
    {
      name: "Catalog",
      tools: [
        { name: 'ASIN Analyzer', href: '/asin_analyzer', description: 'Analyze product text and images for an ASIN' },
        { name: 'ASIN Image Analyzer', href: '/asin_image_analyzer', description: 'Analyze and group ASIN images and variants' },
        { name: 'SQP Analysis', href: '/sqp', description: 'Analyze search query performance data' },
        { name: 'Cerebro Analysis', href: '/cerebro', description: 'Advanced keyword research and analysis' },
      ]
    },
    {
      name: "Bulk File",
      tools: [
        { name: 'Bulk File Optimizer', href: '/sp', description: 'Optimize your Sponsored Products campaigns' },
      ]
    },
    {
      name: "Advertising",
      tools: [
        { name: 'N-gram Analysis', href: '/ngram', description: 'Analyze keyword performance using n-gram techniques' },
        { name: 'Topical Analysis', href: '/topical', description: 'Advanced topic and trend analysis' },
      ]
    },
  ]

  // Seller Dashboard links
  const dashboardTools = [
    { name: 'Main Dashboard', href: '/newdashboard', description: 'Overview dashboard' },
    { name: 'ASIN Performance', href: '/newdashboard/asinperformance', description: 'Analyze ASIN performance metrics' },
    { name: 'Campaign Performance', href: '/newdashboard/campain/campainperformance', description: 'Track and analyze campaign data' },
    { name: 'Inventory', href: '/newdashboard/inventory', description: 'Monitor inventory levels and trends' },
    { name: 'Search Query Performance', href: '/newdashboard/searchqueryperformance', description: 'Analyze search query performance data' },
  ]

  // Admin visibility - Only show to admin role or higher (admin, super_admin)
  // In dev mode, also show to everyone for testing
  const showAdmin = !!user && (
    process.env.NODE_ENV === 'development' ||
    isSuperAdmin() ||
    isAdmin() ||
    hasRoleOrHigher('admin')
  )

  if (!user) return null

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

      <div className="sticky top-16 bg-gray-900 border-r border-gray-700 flex flex-col h-[calc(100vh-4rem)]">
        
        {/* Toggle Button */}
        <div className={`flex items-center p-3 border-b border-gray-700 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-gray-300">Navigation</h2>
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
            {/* Empty space - just the toggle button above is visible */}
          </div>
        ) : (
          /* Expanded State - Full Navigation */
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            <nav className="p-2 space-y-1">
              {/* Dashboard Section */}
              <div>
                <button
                  onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                >
                  <span>Dashboard</span>
                  {isDashboardOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
                
                {isDashboardOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {dashboardTools.map((tool) => (
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
                )}
              </div>

              {/* Tools Section */}
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
                    {toolCategories.map((category) => (
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

              {/* Admin Section - Only visible to admin role or higher */}
              {showAdmin && (
                <div className="pt-2">
                  <Link
                    href="/admin/users"
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