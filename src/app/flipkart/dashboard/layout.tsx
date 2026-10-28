'use client'

/**
 * Layout for every page under /flipkart/dashboard/**.
 *
 * Lives at src/app/flipkart/dashboard/layout.tsx. It must NOT be placed at src/app/flipkart/,
 * because that folder also holds the Flipkart OAuth pages (connect, success, error), which users
 * without a Flipkart account must still be able to open.
 *
 * WHY THIS EXISTS
 * RouteGuard (src/components/gaurds/route-guard.tsx) only checks routes that are registered in
 * routes.config.ts (getRouteByHref). /flipkart/dashboard/** pages are NOT registered there, so RouteGuard
 * lets any logged-in user through. This layout adds the missing check: a user without at least
 * one active Flipkart ad account is sent to /unauthorized, the same destination RouteGuard uses.
 *
 * It sits inside the existing LayoutWrapper (sidebar + RouteGuard), so by the time it renders
 * the user is already authenticated and their profile has loaded.
 *
 * This is a UX gate only. Security is enforced by the backend: every Flipkart API must resolve
 * the requested ad account (`ads_tenant`) through the requesting user and reject anything else.
 *
 * TO ADD ROLE/PERMISSION RULES like the Amazon pages have, register the Flipkart routes in
 * routes.config.ts; RouteGuard will then enforce them in addition to this check.
 */

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useHasFlipkartAccount } from '@/lib/hooks/queries/use-user-profile'
import { LoadingScreen } from '@/components/gaurds/loading-screen'

export default function FlipkartLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasFlipkartAccount, isLoading } = useHasFlipkartAccount()

  useEffect(() => {
    if (!isLoading && !hasFlipkartAccount) {
      router.replace(`/unauthorized?route=${pathname}`)
    }
  }, [isLoading, hasFlipkartAccount, pathname, router])

  if (isLoading || !hasFlipkartAccount) {
    return <LoadingScreen />
  }

  return <>{children}</>
}