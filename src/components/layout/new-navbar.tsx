'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/button'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import ProfileDropdown from './profile-dropdown'

export function Navbar() {
  // const { user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { user, userProfile, hasAnyPermission } = useAuth()


  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="sticky top-0 z-[9999] bg-gray-900 border-b border-gray-700">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/" : "/login"} className="flex items-center h-16">
            <div className="relative h-10 w-40 rounded-md p-1">
              <Image
                src="/logo.png"
                alt="PacePivot Logo"
                fill
                sizes="(max-width: 768px) 120px, 160px"
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          {/* Desktop - Only show sign in if not logged in */}
          {/* <div className="hidden md:block">
            {!user && (
              <Link href="/login">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-300">Sign In</Button>
              </Link>
            )}
          </div> */}

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <ProfileDropdown />
              ) : (
                <Link href="/login">
                  <Button className="bg-yellow-400 text-black hover:bg-yellow-300">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu button - Always show for responsive menu */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      )}
    </nav>
  )
}