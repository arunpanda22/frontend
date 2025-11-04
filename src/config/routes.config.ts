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
 * Dashboard Routes
 * Requires seller account connection for data display
 */
const DASHBOARD_ROUTES: RouteConfig[] = [
  {
    name: 'Main Dashboard',
    href: '/maindashboard',
    description: 'Overview dashboard',
    permission: 'view_dashboard',
    requiresSellerAccount: true,
  },
  {
    name: 'Orders Realtime',
    href: '/maindashboard/orders',
    description: 'Live orders dashboard',
    permission: 'view_dashboard',
    requiresSellerAccount: true,
  },
  {
    name: 'ASIN Performance',
    href: '/maindashboard/asinperformance',
    description: 'Analyze ASIN performance metrics',
    permission: 'view_asin_performance',
    requiresSellerAccount: true,
  },
  {
    name: 'Campaign Performance',
    href: '/maindashboard/campain/campainperformance',
    description: 'Track and analyze campaign data',
    permission: 'view_campaign_performance',
    requiresSellerAccount: true,
  },
  {
    name: 'Inventory',
    href: '/maindashboard/inventory',
    description: 'Monitor inventory levels and trends',
    permission: 'view_inventory',
    requiresSellerAccount: true,
  },
  {
    name: 'Search Query Performance',
    href: '/maindashboard/searchqueryperformance',
    description: 'Analyze search query performance data',
    permission: 'view_sqp_performance',
    requiresSellerAccount: true,
  },
]

/**
 * Tool Routes - Organized by category
 */

// Content Generation Tools
const CONTENT_GENERATION_TOOLS: RouteConfig[] = [
  {
    name: 'Listing Generator',
    href: '/lister',
    description: 'Generate optimized product listings',
    permission: 'use_listing_generator',
  },
]

// Catalog Tools
const CATALOG_TOOLS: RouteConfig[] = [
  {
    name: 'ASIN Analyzer',
    href: '/asin_analyzer',
    description: 'Analyze product text and images for an ASIN',
    permission: 'use_asin_analyzer',
  },
  {
    name: 'ASIN Image Analyzer',
    href: '/asin_image_analyzer',
    description: 'Analyze and group ASIN images and variants',
    permission: 'use_asin_image_analyzer',
  },
  {
    name: 'SQP Analysis',
    href: '/sqp',
    description: 'Analyze search query performance data',
    permission: 'use_sqp_analysis',
  },
  {
    name: 'Cerebro Analysis',
    href: '/cerebro',
    description: 'Advanced keyword research and analysis',
    permission: 'use_cerebro_analysis',
  },
]

// Bulk File Tools
const BULK_FILE_TOOLS: RouteConfig[] = [
  {
    name: 'Bulk File Optimizer',
    href: '/sp',
    description: 'Optimize your Sponsored Products campaigns',
    permission: 'use_bulk_file_optimizer',
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
    name: 'Content Generation',
    tools: CONTENT_GENERATION_TOOLS,
  },
  {
    name: 'Catalog',
    tools: CATALOG_TOOLS,
  },
  {
    name: 'Bulk File',
    tools: BULK_FILE_TOOLS,
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
      ...CONTENT_GENERATION_TOOLS,
      ...CATALOG_TOOLS,
      ...BULK_FILE_TOOLS,
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