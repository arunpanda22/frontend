"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { RiArrowRightDoubleLine, RiArrowLeftDoubleLine } from "react-icons/ri";
import { useAuth } from "@/lib/context/AuthContext";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useSidebar } from "@/components/layout/layout-wrapper";
import {
  ROUTES,
  TOOL_CATEGORIES,
  DASHBOARD_CATEGORIES,
  RouteConfig,
} from "@/config/routes.config";

export function Sidebar() {
  const pathname = usePathname();
  const { user, userProfile, isImpersonating } = useAuth();
  const { canAccess, isLoadingPermissions } = usePermissions();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const [isDashboardOpen,        setIsDashboardOpen]        = useState(true);
  const [isAdOptimusOpen,        setIsAdOptimusOpen]        = useState(true);
  const [isCampaignCreationOpen, setIsCampaignCreationOpen] = useState(true);
  const [isToolsOpen,            setIsToolsOpen]            = useState(false);

  const impersonationActive = isImpersonating();

  useEffect(() => {
    // Re-renders when impersonation changes — useMemo hooks below recalculate
  }, [impersonationActive, userProfile?.id]);

  const filterAccessibleRoutes = (routes: RouteConfig[]): RouteConfig[] => {
    return routes.filter((route) => {
      const hasAccess = canAccess({
        permission:      route.permission,
        anyPermissions:  route.anyPermissions,
        allPermissions:  route.allPermissions,
        role:            route.role,
        minRole:         route.minRole,
      });
      if (!hasAccess) return false;
      if (route.requiresSellerAccount) {
        return (
          (userProfile?.connected_seller_accounts?.length ?? 0) > 0 ||
          (userProfile?.connected_vendor_accounts?.length ?? 0) > 0 ||
          (userProfile?.connected_advertising_profiles?.length ?? 0) > 0
        );
      }
      return true;
    });
  };

  const accessibleDashboard = useMemo(() => {
    const cat = DASHBOARD_CATEGORIES.find((c) => c.name === "Core Analytics");
    return cat ? filterAccessibleRoutes(cat.routes) : [];
  }, [userProfile, isLoadingPermissions, impersonationActive]);

  const accessibleAdOptimus = useMemo(() => {
    const cat = DASHBOARD_CATEGORIES.find((c) => c.name === "AdOptimus");
    return cat ? filterAccessibleRoutes(cat.routes) : [];
  }, [userProfile, isLoadingPermissions, impersonationActive]);

  const accessibleCampaignCreation = useMemo(() => {
    const cat = DASHBOARD_CATEGORIES.find((c) => c.name === "Campaign Creation");
    return cat ? filterAccessibleRoutes(cat.routes) : [];
  }, [userProfile, isLoadingPermissions, impersonationActive]);

  const accessibleToolCategories = useMemo(() => {
    return TOOL_CATEGORIES.map((category) => ({
      name:  category.name,
      tools: filterAccessibleRoutes(category.tools),
    })).filter((category) => category.tools.length > 0);
  }, [userProfile, isLoadingPermissions, impersonationActive]);

  const hasAdminAccess = useMemo(() => {
    const cat = ROUTES.find((r) => r.category === "admin");
    return cat ? filterAccessibleRoutes(cat.children).length > 0 : false;
  }, [userProfile, isLoadingPermissions, impersonationActive]);

  const firstAdminRoute = useMemo(() => {
    const cat = ROUTES.find((r) => r.category === "admin");
    if (!cat) return null;
    return filterAccessibleRoutes(cat.children)[0]?.href ?? "/admin/users";
  }, [userProfile, isLoadingPermissions, impersonationActive]);

  if (!user) return null;

  if (isLoadingPermissions()) {
    return (
      <div className="bg-gray-900 border-r border-gray-700 flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
        </div>
      </div>
    );
  }

  // ── Reusable nav section ────────────────────────────────────────────────────

  function NavSection({
    label,
    isOpen,
    onToggle,
    routes,
  }: {
    label:    string
    isOpen:   boolean
    onToggle: () => void
    routes:   RouteConfig[]
  }) {
    if (routes.length === 0) return null
    return (
      <div className="pt-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
        >
          <span>{label}</span>
          {isOpen
            ? <ChevronDownIcon  className="h-4 w-4" />
            : <ChevronRightIcon className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                  pathname === route.href
                    ? "bg-gray-800 text-white border-l-2 border-yellow-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <div className="font-medium">{route.name}</div>
                {/* {route.description && (
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {route.description}
                  </div>
                )} */}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
        }
        .scrollbar-custom::-webkit-scrollbar { width: 6px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: transparent; margin: 8px 0; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(75, 85, 99, 0.3); border-radius: 0; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(75, 85, 99, 0.5); }
      `}</style>

      <div className="bg-gray-900 border-r border-gray-700 flex flex-col h-full font-montserrat">

        {/* Toggle Button */}
        <div className={`flex items-center p-3 border-b border-gray-700 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-gray-300">Navigation</h2>
              {impersonationActive && (
                <span className="text-xs text-yellow-400 mt-0.5">Impersonating</span>
              )}
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed
              ? <RiArrowRightDoubleLine className="h-5 w-5" />
              : <RiArrowLeftDoubleLine  className="h-5 w-5" />}
          </button>
        </div>

        {/* Collapsed State */}
        {isCollapsed ? (
          <div className="flex-1 flex items-center justify-center">
            {impersonationActive && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Impersonating" />
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            <nav className="p-2 space-y-1">

              {/* OptivizeX — Core Analytics */}
              <NavSection
                label="OptivizeX"
                isOpen={isDashboardOpen}
                onToggle={() => setIsDashboardOpen((v) => !v)}
                routes={accessibleDashboard}
              />

              {/* AdOptimus */}
              <NavSection
                label="AdOptimus"
                isOpen={isAdOptimusOpen}
                onToggle={() => setIsAdOptimusOpen((v) => !v)}
                routes={accessibleAdOptimus}
              />

              {/* Campaign Creation — SP / SB / SD */}
              <NavSection
                label="Campaign Creation"
                isOpen={isCampaignCreationOpen}
                onToggle={() => setIsCampaignCreationOpen((v) => !v)}
                routes={accessibleCampaignCreation}
              />

              {/* Tools */}
              {accessibleToolCategories.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsToolsOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                  >
                    <span>Tools</span>
                    {isToolsOpen
                      ? <ChevronDownIcon  className="h-4 w-4" />
                      : <ChevronRightIcon className="h-4 w-4" />}
                  </button>
                  {isToolsOpen && (
                    <div className="ml-4 mt-1 space-y-2">
                      {accessibleToolCategories.map((category) => (
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
                                    ? "bg-gray-800 text-white border-l-2 border-yellow-400"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
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
              )}

              {/* Admin */}
              {hasAdminAccess && firstAdminRoute && (
                <div className="pt-2">
                  <Link
                    href={firstAdminRoute}
                    className={`block w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname?.startsWith("/admin")
                        ? "bg-gray-800 text-white border-l-2 border-yellow-400"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    Admin
                  </Link>
                </div>
              )}

              {/* User Config */}
              <div className="pt-2">
                <Link
                  href="/user-config"
                  className={`block w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === "/user-config"
                      ? "bg-gray-800 text-white border-l-2 border-yellow-400"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  User Config
                </Link>
              </div>

            </nav>
          </div>
        )}
      </div>
    </>
  );
}