'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/button'
import ProfileDropdown from '@/components/layout/profile-dropdown'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const { user, isSuperAdmin, isAdmin, hasRoleOrHigher } = useAuth()
  const [isDashboardOpen, setIsDashboardOpen] = useState(true)
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Define tools for mobile sidebar
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
    { name: 'Main Dashboard', href: '/maindashboard', description: 'Overview dashboard' },
    { name: 'Orders Realtime', href: '/maindashboard/orders_realtime', description: 'Realtime orders dashboard' },
    { name: 'ASIN Performance', href: '/maindashboard/asinperformance', description: 'Analyze ASIN performance metrics' },
    { name: 'Campaign Performance', href: '/maindashboard/campain/campainperformance', description: 'Track and analyze campaign data' },
    { name: 'Inventory', href: '/maindashboard/inventory', description: 'Monitor inventory levels and trends' },
    { name: 'Search Query Performance', href: '/maindashboard/searchqueryperformance', description: 'Analyze search query performance data' },
  ]

  // Admin visibility - Only show to admin role or higher (admin, super_admin)
  // In dev mode, also show to everyone for testing
  const showAdmin = !!user && (
    process.env.NODE_ENV === 'development' ||
    isSuperAdmin() ||
    isAdmin() ||
    hasRoleOrHigher('admin')
  )

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle navigation and close
  const handleNavigation = (href: string) => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
      <div 
        ref={sidebarRef}
        className="absolute right-0 top-0 h-full w-80 bg-gray-900 shadow-lg flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="relative h-8 w-32 bg-white/10 rounded-md p-1">
            <Image
              src="/logo.jpg"
              alt="PacePivot Logo"
              fill
              sizes="128px"
              className="object-contain"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!user ? (
            <div className="p-4">
              <Link href="/login" onClick={onClose}>
                <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-300">Sign In</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Profile Section */}
              <div className="p-3 border-b border-gray-700">
                <ProfileDropdown />
              </div>

              {/* Navigation */}
              <div className="p-2">
                <nav className="space-y-1">
                  {/* Dashboard Section */}
                  <div>
                    <button
                      onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
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
                            onClick={() => handleNavigation(tool.href)}
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === tool.href
                                ? 'bg-gray-800 text-white border-l-2 border-yellow-400'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tools Section */}
                  <div className="pt-2">
                    <button
                      onClick={() => setIsToolsOpen(!isToolsOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
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
                                  onClick={() => handleNavigation(tool.href)}
                                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                                    pathname === tool.href
                                      ? 'bg-gray-800 text-white border-l-2 border-yellow-400'
                                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                  }`}
                                >
                                  <div className="font-medium">{tool.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
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
                        onClick={() => handleNavigation('/admin/users')}
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}