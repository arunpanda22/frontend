import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAuth } from '@/lib/context/AuthContext'
import { apiClient } from '@/lib/api/config'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConnectedAdvertisingProfile {
  profile_id:           string
  account_name:         string
  account_type:         string
  target_acos:          string
  account_subtype:      string
  country_code:         string
  currency_code:        string
  timezone:             string
  marketplace_id:       string
  region:               string
  valid_payment_method: boolean
  is_active:            boolean
  created_at:           string
  last_synced_at:       string
}

export interface ConnectedSellerAccount {
  seller_id:        string
  marketplace_id:   string
  region:           string
  is_active:        boolean
  created_at:       string
  last_refreshed_at:string
}

export interface ConnectedVendorAccount {
  vendor_code:      string
  marketplace_id:   string
  region:           string
  is_active:        boolean
  created_at:       string
  last_refreshed_at:string
}

export interface RBACContext {
  role_id:          number
  role_name:        'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
  role_display:     string
  hierarchy_level:  number
  agency_id?:       number
  agency_name?:     string
  agency_slug?:     string
  managed_agencies?: Array<{ id: number; name: string; slug: string }>
  managed_agency_ids?: number[]
  parent_seller_id?:    number
  parent_seller_email?: string
}

export interface UserProfile {
  id:                   number
  email:                string
  firebase_uid:         string
  username:             string
  first_name:           string
  last_name:            string
  created_at:           string
  updated_at:           string
  current_role_name:    string | null
  current_role_display: string | null
  current_agency:       { id: number; name: string; slug: string } | null
  rbac_context:                   RBACContext
  connected_advertising_profiles: ConnectedAdvertisingProfile[]
  connected_seller_accounts:      ConnectedSellerAccount[]
  connected_vendor_accounts:      ConnectedVendorAccount[]
}

// ── useUserProfile ─────────────────────────────────────────────────────────────

export const useUserProfile = (
  options?: { enabled?: boolean },
): UseQueryResult<UserProfile, Error> => {
  const { user } = useAuth()

  return useQuery({
    queryKey:          ['user-profile'],
    queryFn:           async () => {
      if (!user) throw new Error('User not authenticated')
      const response = await apiClient.get('/api/v1/auth/profile/')
      return response.data
    },
    enabled:           (options?.enabled ?? true) && !!user,
    retry:             2,
    retryDelay:        (i) => Math.min(1000 * 2 ** i, 30000),
    staleTime:         30 * 60 * 1000,
    gcTime:            60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount:       false,
  })
}

// ── Active profile helper ──────────────────────────────────────────────────────

function getActiveProfile(
  userProfile?: UserProfile,
): ConnectedAdvertisingProfile | undefined {
  const profiles = userProfile?.connected_advertising_profiles ?? []
  return profiles.find((p) => p.is_active) ?? profiles[0]
}

// ── Min bid lookup ─────────────────────────────────────────────────────────────

/** Amazon SP minimum bids by currency code */
const MIN_BIDS: Record<string, number> = {
  BE:  0.10,
  GBP: 0.02,
  USD: 0.02,
  CAD: 0.02,
  EUR: 0.02,
  CNY: 0.10,
  JPY: 2.00,
  INR: 1.00,
  AED: 0.24,
  MXN: 0.10,
  AUD: 0.02,
  BRL: 0.07,
  SGD: 0.07,
  SEK: 0.18,
  PLN: 0.04,
  TRY: 0.05,
  EGP: 0.15,
  SAR: 0.10,
  ZAR: 1.00,
}

export function getMinBid(currencyCode: string): number {
  return MIN_BIDS[currencyCode.toUpperCase()] ?? 0.02
}

export const useMinBid = (): {
  minBid:       number
  currencyCode: string
  isLoading:    boolean
} => {
  const { data: userProfile, isLoading } = useUserProfile()
  const profile      = getActiveProfile(userProfile)
  const currencyCode = profile?.currency_code ?? 'GBP'
  return { minBid: getMinBid(currencyCode), currencyCode, isLoading }
}

// ── Min budget lookup ──────────────────────────────────────────────────────────

/** Amazon SP minimum daily budgets by marketplace ID */
const MIN_BUDGETS: Record<string, number> = {
  ATVPDKIKX0DER: 1,      // US
  A2EUQ1WTGCTBG2: 1,     // CA
  A1F83G8C2ARO7P: 1,     // UK
  A1PA6795UKMFR9: 1,     // DE
  A13V1IB3VIYZZH: 1,     // FR
  APJ6JRA9NG5V4:  1,     // IT
  A1RKKUPIHCS9HS: 1,     // ES
  A21TJRUUN4KGV:  50,    // IN
  A1VC38T7YXB528: 100,   // JP
  AAHKV2X7AFYLW:  1,     // CN
  A39IBJ37TRP1C6: 1.4,   // AU
  A1AM78C64UM0Y8: 1,     // MX
  A2VIGQ35RCS4UG: 4,     // AE
  A17E79C6D8DWNP: 4,     // SA
  A2Q3Y263D00KWC: 1.32,  // BR
  A1805IZSGTT6HS: 1,     // NL
  A19VAU5U5O7RUS: 1.39,  // SE
  A33AVAJ2PDY3EV: 2,     // PL
  A1C3SOZRARQ6R3: 2,     // EG
  A2NODRKZP88ZB9: 9,     // TR
  ARBP9OOSHTCHU:  7,     // SG
  A1O1A8YJPPLP4G: 1,     // BE
  A2OYECZ3TBJW2L: 20,    // ZA
  A3OI0J5Q7G69HY: 1,     // NG
}

export function getMinBudget(marketplaceId: string): number {
  return MIN_BUDGETS[marketplaceId] ?? 1
}

/**
 * Returns the minimum daily budget for the user's active marketplace.
 * Also exposes a helper to compute the recommended budget from a set of bids:
 *   recommendedBudget = max(minBudget, max(bids) * 15)
 */
export const useMinBudget = (): {
  minBudget:              number
  marketplaceId:          string
  isLoading:              boolean
  recommendedBudget:      (bids: number[]) => number
} => {
  const { data: userProfile, isLoading } = useUserProfile()
  const profile       = getActiveProfile(userProfile)
  const marketplaceId = profile?.marketplace_id ?? ''
  const minBudget     = getMinBudget(marketplaceId)

  const recommendedBudget = (bids: number[]): number => {
    const validBids  = bids.filter((b) => b > 0)
    const maxBid     = validBids.length > 0 ? Math.max(...validBids) : 0
    return Math.max(minBudget, maxBid * 15)
  }

  return { minBudget, marketplaceId, isLoading, recommendedBudget }
}

// ── Currency symbol lookup ────────────────────────────────────────────────────

/**
 * Maps the same currency codes used in MIN_BIDS to their display symbols.
 * Matches Amazon's marketplace currency symbols.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  CAD: 'CA$',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  INR: '₹',
  AED: 'د.إ',
  MXN: 'MX$',
  AUD: 'A$',
  BRL: 'R$',
  SGD: 'S$',
  SEK: 'kr',
  PLN: 'zł',
  TRY: '₺',
  EGP: 'E£',
  SAR: '﷼',
  ZAR: 'R',
  BE:  '€',  // Belgium uses EUR
}

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] ?? currencyCode
}

export const useCurrencySymbol = (): {
  symbol:       string
  currencyCode: string
  isLoading:    boolean
} => {
  const { data: userProfile, isLoading } = useUserProfile()
  const profile      = getActiveProfile(userProfile)
  const currencyCode = profile?.currency_code ?? 'GBP'
  return { symbol: getCurrencySymbol(currencyCode), currencyCode, isLoading }
}

// ── Existing helpers (unchanged) ──────────────────────────────────────────────

export const useHasVendorAccount = () => {
  const { data: userProfile, isLoading } = useUserProfile()
  return {
    hasVendorAccount: (userProfile?.connected_vendor_accounts?.length ?? 0) > 0,
    isLoading,
    vendorAccounts:   userProfile?.connected_vendor_accounts ?? [],
  }
}

export const useHasSellerAccount = () => {
  const { data: userProfile, isLoading } = useUserProfile()
  return {
    hasSellerAccount: (userProfile?.connected_seller_accounts?.length ?? 0) > 0,
    isLoading,
    sellerAccounts:   userProfile?.connected_seller_accounts ?? [],
  }
}