'use client'

/**
 * useMarketplace: which marketplace dashboard the user is currently in.
 *
 * DESIGN (read this first, humans and AI agents alike)
 * ----------------------------------------------------
 * The marketplace is derived from the URL and is never stored in separate state:
 *   - any path under /flipkart/dashboard (exactly that, or "/flipkart/dashboard/...") -> 'flipkart'
 *   - every other path                                                                -> 'amazon'
 * The Flipkart OAuth pages (/flipkart, /flipkart/success, /flipkart/error) are deliberately NOT
 * under /flipkart/dashboard, so they are not treated as the Flipkart dashboard.
 * Because the URL is the single source of truth, a refresh, a shared link and the browser
 * back button always land in the right marketplace, and there is no context to keep in sync.
 *
 * Amazon pages stay exactly where they are. Flipkart dashboard pages live under
 * src/app/flipkart/dashboard/**.
 * Do NOT add `if (marketplace === 'flipkart')` branches inside Amazon pages; build Flipkart
 * pages, hooks and API calls separately and share only presentational components.
 *
 * Also exports useConnectedMarketplaces(), which says whether the Flipkart switcher
 * should be offered to the current user.
 */

import { usePathname } from 'next/navigation'
import { useHasFlipkartAccount } from '@/lib/hooks/queries/use-user-profile'

export type Marketplace = 'amazon' | 'flipkart'

/** URL prefix that identifies every Flipkart DASHBOARD page (not the OAuth pages). */
export const FLIPKART_BASE_PATH = '/flipkart/dashboard'

/** Pure helper (usable outside React): maps a pathname to its marketplace. */
export function getMarketplaceFromPath(pathname: string | null | undefined): Marketplace {
  if (!pathname) return 'amazon'
  if (pathname === FLIPKART_BASE_PATH || pathname.startsWith(`${FLIPKART_BASE_PATH}/`)) {
    return 'flipkart'
  }
  return 'amazon'
}

/** The marketplace of the page currently shown. */
export function useMarketplace(): { marketplace: Marketplace } {
  const pathname = usePathname()
  return { marketplace: getMarketplaceFromPath(pathname) }
}

/**
 * Which marketplaces the current user can switch between.
 *
 * Flipkart is offered only when the user profile lists at least one ACTIVE Flipkart ad account
 * (profile.connected_flipkart_ad_accounts, see use-user-profile.ts). The profile is the same
 * data source as the Amazon connected_* lists, so Amazon-only users never see Flipkart, and
 * the field being absent (backend not updated yet) also counts as "no Flipkart".
 *
 * `isLoading` lets callers avoid flashing the wrong UI while the profile is still loading.
 */
export function useConnectedMarketplaces(): {
  amazon: boolean
  flipkart: boolean
  isLoading: boolean
} {
  const { hasFlipkartAccount, isLoading } = useHasFlipkartAccount()
  return { amazon: true, flipkart: hasFlipkartAccount, isLoading }
}