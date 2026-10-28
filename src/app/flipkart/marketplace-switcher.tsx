'use client'

/**
 * MarketplaceSwitcher: Amazon | Flipkart toggle.
 *
 * A standalone, importable component. Render it in the Navbar next to the account selector:
 *     import { MarketplaceSwitcher } from '@/components/layout/marketplace-switcher'
 *     <MarketplaceSwitcher />
 *
 * Behavior:
 *   - Renders nothing unless the user has a connected Flipkart account
 *     (useConnectedMarketplaces), so Amazon-only users see no change at all.
 *   - The active side comes from the URL (useMarketplace), never from local state.
 *   - Choosing a side navigates to that marketplace's home page:
 *       Amazon  -> the first "Core Analytics" route from routes.config.ts (falls back to "/")
 *       Flipkart -> FLIPKART_HOME_HREF
 */

import Link from 'next/link'
import { DASHBOARD_CATEGORIES } from '@/config/routes.config'
import { FLIPKART_HOME_HREF } from '@/config/flipkart-nav.config'
import { useMarketplace, useConnectedMarketplaces } from '@/lib/hooks/useMarketplace'

const AMAZON_HOME_HREF =
  DASHBOARD_CATEGORIES.find((c) => c.name === 'Core Analytics')?.routes[0]?.href ?? '/'

export function MarketplaceSwitcher() {
  const { marketplace } = useMarketplace()
  const { flipkart } = useConnectedMarketplaces()

  if (!flipkart) return null

  const options = [
    { key: 'amazon', label: 'Amazon', href: AMAZON_HOME_HREF },
    { key: 'flipkart', label: 'Flipkart', href: FLIPKART_HOME_HREF },
  ] as const

  return (
    <div
      className="flex items-center rounded-md bg-gray-800 p-0.5 text-xs font-medium"
      role="group"
      aria-label="Marketplace"
    >
      {options.map((option) => (
        <Link
          key={option.key}
          href={option.href}
          aria-current={marketplace === option.key ? 'page' : undefined}
          className={`rounded px-3 py-1.5 transition-colors ${
            marketplace === option.key
              ? 'bg-yellow-400 text-gray-900'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}