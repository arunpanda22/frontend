/**
 * Flipkart sidebar navigation.
 *
 * Kept in its own file, separate from routes.config.ts (which holds the Amazon routes,
 * permissions and tool categories), so the two marketplaces never share a config.
 *
 * Every Flipkart page lives under FLIPKART_BASE_PATH (/flipkart); see
 * src/lib/hooks/useMarketplace.ts for how the marketplace is derived from the URL.
 *
 * HOW TO ADD A PAGE: create src/app/flipkart/<slug>/page.tsx, then add one entry to the
 * items array below. The sidebar renders sections and items from this config only.
 *
 * Items are intentionally a minimal { name, href } shape (not the Amazon RouteConfig type):
 * Flipkart access is gated by the user having a connected Flipkart account (see
 * useConnectedMarketplaces) rather than by per-route permissions. Revisit if per-page
 * permissions are needed later.
 */

import { FLIPKART_BASE_PATH } from '@/lib/hooks/useMarketplace'

export interface FlipkartNavItem {
  name: string
  href: string
}

export interface FlipkartNavSection {
  label: string
  items: FlipkartNavItem[]
}

/** Where the marketplace switcher sends the user when they choose Flipkart. */
export const FLIPKART_HOME_HREF = `${FLIPKART_BASE_PATH}/command-center`

export const FLIPKART_NAV_SECTIONS: FlipkartNavSection[] = [
  {
    label: 'Flipkart Ads',
    items: [
      { name: 'Command Center', href: FLIPKART_HOME_HREF },
      // Added as each page is built (one fact table per page):
      //   { name: 'Campaign Analytics', href: `${FLIPKART_BASE_PATH}/campaigns` },        // CampaignReport
      //   { name: 'Keyword Analytics',  href: `${FLIPKART_BASE_PATH}/keywords` },         // KeywordTargetingReport
      //   { name: 'Placement Analytics', href: `${FLIPKART_BASE_PATH}/placements` },      // PlacementsReport
      //   { name: 'Search Terms',       href: `${FLIPKART_BASE_PATH}/search-terms` },      // SearchTermsReport
    ],
  },
]