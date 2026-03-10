/**
 * Centralized Routes Configuration
 * Single source of truth for all app routes with permission requirements
 */

export interface RouteConfig {
  name: string
  href: string
  description?: string
  icon?: string
  
  // Permission requirements (at least one must be specified)
  permission?: string           // Single required permission
  anyPermissions?: string[]     // User needs ANY of these permissions (OR)
  allPermissions?: string[]     // User needs ALL of these permissions (AND)
  
  // Role requirements (optional, combined with permission checks)
  role?: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
  minRole?: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
  
  // Additional flags
  requiresSellerAccount?: boolean  // Requires connected seller account
  requiresAgency?: boolean         // Requires agency assignment
}

export interface RouteCategory {
  name: string
  category: 'dashboard' | 'tools' | 'admin' | 'profile'
  children: RouteConfig[]
}

/**
 * Dashboard Routes - Core Analytics
 * Requires seller account connection for data display
 */
const DASHBOARD_CORE_ROUTES: RouteConfig[] = [
  {
    name: 'Command Center',
    href: '/dashboard/command-center',
    description: 'Overview dashboard',
    permission: 'view_dashboard',
    requiresSellerAccount: true,
  },
  {
    name: 'Orders & Revenue Tracker',
    href: '/dashboard/recent-orders',
    description: 'Live orders dashboard',
    permission: 'view_dashboard',
    requiresSellerAccount: true,
  },
  // {
  //   name: 'Recent Orders ',
  //   href: '/dashboard/recent-orders',
  //   description: 'Orders dashboard',
  //   permission: 'view_dashboard',
  //   requiresSellerAccount: true,
  // },
  {
    name: 'ASIN Intelligence',
    href: '/dashboard/asin-inteligence',
    description: 'Analyze ASIN performance metrics',
    permission: 'view_asin_performance',
    requiresSellerAccount: true,
  },
  {
    name: 'Campaign Analytics',
    href: '/dashboard/campaign-analytics',
    description: 'Track and analyze campaign data',
    permission: 'view_campaign_performance',
    requiresSellerAccount: true,
  },
  {
    name: 'InventoryPulse',
    href: '/dashboard/inventorypulse',
    description: 'Monitor inventory levels and trends',
    permission: 'view_inventory',
    requiresSellerAccount: true,
  },
  {
    name: 'Market Funnel Insights',
    href: '/dashboard/market-funnel-insights',
    description: 'Analyze search query performance data',
    permission: 'view_sqp_performance',
    requiresSellerAccount: true,
  },
]

/**
 * Dashboard Routes - AdOptimus Suite
 * Advanced advertising optimization tools
 */
const DASHBOARD_ADOPTIMUS_ROUTES: RouteConfig[] = [
  {
    name: 'Ads Optimizer',
    href: '/dashboard/ads-optimizer',
    description: 'Automated Bid Management for Maximum ROI',
    permission: 'access_ads_optimizer',
    requiresSellerAccount: true,
  },
  {
    name: 'Campaign Creation',
    href: '/dashboard/campaign-creation',
    description: 'Campaign creation page',
    permission: 'access_campaign_creation',
    requiresSellerAccount: true,
  },
  {
    name: 'Catalogue',
    href: '/dashboard/catalogue',
    description: 'Catalogue creation page',
    permission: 'access_catalogue_creation',
    requiresSellerAccount: true,
  },
  {
    name: 'Opportunity Optimizer',
    href: '/dashboard/opportunities',
    description: 'Find oppurtunities to increase profits',
    permission: 'access_oppurtunities',
    requiresSellerAccount: true,
  },
  {
    name: 'Campaign Xray',
    href: '/dashboard/campaign-xray',
    description: 'Track and analyze campaign data',
    permission: 'view_campaign_xray',
    requiresSellerAccount: true,
  },
]

/**
 * All Dashboard Routes Combined
 */
const DASHBOARD_ROUTES: RouteConfig[] = [
  ...DASHBOARD_CORE_ROUTES,
  ...DASHBOARD_ADOPTIMUS_ROUTES,
]

/**
 * Dashboard Categories for Sidebar Organization
 */
export const DASHBOARD_CATEGORIES = [
  {
    name: 'Core Analytics',
    routes: DASHBOARD_CORE_ROUTES,
  },
  {
    name: 'AdOptimus',
    routes: DASHBOARD_ADOPTIMUS_ROUTES,
  },
]

// Catalog Tools
const CATALOG_TOOLS: RouteConfig[] = [
  {
    name: 'ASIN Image Analyzer',
    href: '/asin_image_analyzer',
    description: 'Analyze and group ASIN images and variants',
    permission: 'use_asin_image_analyzer',
  },
  {
    name: 'Cerebro Analysis',
    href: '/cerebro',
    description: 'Advanced keyword research and analysis',
    permission: 'use_cerebro_analysis',
  },
]


// Advertising Tools
const ADVERTISING_TOOLS: RouteConfig[] = [
  {
    name: 'N-gram Analysis',
    href: '/ngram',
    description: 'Analyze keyword performance using n-gram techniques',
    permission: 'use_ngram_analysis',
  },
  {
    name: 'Topical Analysis',
    href: '/topical',
    description: 'Advanced topic and trend analysis',
    permission: 'use_topical_analysis',
  },
]

/**
 * Admin Routes
 * High-level administration pages
 */
const ADMIN_ROUTES: RouteConfig[] = [
  {
    name: 'User Management',
    href: '/admin/users',
    description: 'Manage users and roles',
    anyPermissions: [
      'manage_agencies',
      'manage_agency_clients',
      'assign_admin_roles',
      'assign_agency_roles',
    ],
    minRole: 'admin', // Must be at least admin role
  },
  {
    name: 'System Logs',
    href: '/admin/logs',
    description: 'View system audit logs',
    permission: 'view_system_logs',
    minRole: 'admin',
  },
]

/**
 * Profile Routes
 */
const PROFILE_ROUTES: RouteConfig[] = [
  {
    name: 'Profile',
    href: '/profile',
    description: 'View and edit your profile',
    permission: 'view_profile',
  },
  {
    name: 'Account Settings',
    href: '/settings',
    description: 'Manage account settings',
    permission: 'view_account_settings',
  },
]

/**
 * Tool Categories for Sidebar Organization
 */
export const TOOL_CATEGORIES = [
  {
    name: 'Catalog',
    tools: CATALOG_TOOLS,
  },
  {
    name: 'Advertising',
    tools: ADVERTISING_TOOLS,
  },
]

/**
 * Main Routes Export - All routes organized by category
 */
export const ROUTES: RouteCategory[] = [
  {
    name: 'Dashboard',
    category: 'dashboard',
    children: DASHBOARD_ROUTES,
  },
  {
    name: 'Tools',
    category: 'tools',
    children: [
      ...CATALOG_TOOLS,
      ...ADVERTISING_TOOLS,
    ],
  },
  {
    name: 'Admin',
    category: 'admin',
    children: ADMIN_ROUTES,
  },
  {
    name: 'Profile',
    category: 'profile',
    children: PROFILE_ROUTES,
  },
]

/**
 * Helper function to get all routes as flat array
 */
export const getAllRoutes = (): RouteConfig[] => {
  return ROUTES.flatMap(category => category.children)
}

/**
 * Helper function to find route by href
 */
export const getRouteByHref = (href: string): RouteConfig | undefined => {
  return getAllRoutes().find(route => route.href === href)
}