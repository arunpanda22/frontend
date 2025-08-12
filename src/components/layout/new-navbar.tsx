"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  ChevronDownIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon 
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/layout-wrapper";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Define tools for sidebar with categories
  const toolCategories = [
    {
      name: "Tools",
      tools: [
        {
          name: "Listing Generator",
          href: "/lister",
          description: "Generate optimized product listings",
        },
        {
          name: "SQP Analysis",
          href: "/sqp",
          description: "Analyze search query performance data",
        },
        {
          name: "Cerebro Analysis",
          href: "/cerebro",
          description: "Advanced keyword research and analysis",
        },
        {
          name: "Bulk File Optimizer",
          href: "/sp",
          description: "Optimize your Sponsored Products campaigns",
        },
        {
          name: "N-gram Analysis",
          href: "/ngram",
          description: "Analyze keyword performance using n-gram techniques",
        },
        {
          name: "Topical Analysis",
          href: "/topical",
          description: "Advanced topic and trend analysis",
        },
      ],
    },
    {
      name: "Seller Dashboard",
      tools: [
        {
          name: "ASIN Performance",
          href: "/newdashboard/asinperformance",
          description: "Analyze ASIN performance metrics",
        },
        {
          name: "Campaign Performance",
          href: "/newdashboard/campain/campainperformance",
          description: "Track and analyze campaign data",
        },
        {
          name: "Inventory",
          href: "/newdashboard/inventory",
          description: "Monitor inventory levels and trends",
        },
      ],
    },
  ];

  // Flatten tools for active check
  const allTools = toolCategories.flatMap((category) => category.tools);
  const isToolActive = allTools.some((tool) => pathname?.startsWith(tool.href));

  // Toggle category dropdown
  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Handle sign out with redirect
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/'); // Redirect to home page
    } catch (error) {
      console.error('Sign out error:', error);
      // Still redirect even if there's an error
      router.push('/');
    }
  };

  // Get category icons
  const getCategoryIcon = (categoryName: string) => {
    const iconClass = "w-4 h-4";
    switch (categoryName) {
      case "Tools":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      case "Seller Dashboard":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
        );
      default:
        return <div className="w-2 h-2 bg-current rounded-full"></div>;
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 768
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Initialize open categories based on active tool
  useEffect(() => {
    if (isToolActive) {
      const activeCategory = toolCategories.find(category =>
        category.tools.some(tool => pathname?.startsWith(tool.href))
      );
      if (activeCategory) {
        setOpenCategories(prev => ({
          ...prev,
          [activeCategory.name]: true
        }));
      }
    }
  }, [pathname, isToolActive]);

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 0;
          margin: 8px 0;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
          border-radius: 0;
          border: none;
          transition: background-color 0.2s ease;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.5);
        }
        
        .scrollbar-hover-tooltip::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-hover-tooltip::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-hover-tooltip::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.4);
          border-radius: 2px;
        }
        
        .scrollbar-hover-tooltip::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.6);
        }
      `}</style>

      {/* Top Navbar */}
      <nav className="bg-gradient-to-r from-[#1a2332] to-[#2d3748] border-b border-gray-600/30 shadow-lg backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden bg-white/10 inline-flex items-center justify-center p-2.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/20 focus:outline-none transition-all duration-200 shadow-md mr-3"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {/* Logo */}
              <Link
                href={user ? "/" : "/login"}
                className="flex items-center group"
              >
                <div className="relative h-10 w-40 rounded-lg p-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                  <Image
                    src="/Logo.png"
                    alt="PacePivot Logo"
                    fill
                    sizes="(max-width: 768px) 120px, 160px"
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>

              {/* Dashboard Link - Desktop */}
              {user && (
                <div className="hidden md:block ml-10">
                  <Link
                    href="/newdashboard"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      pathname === "/newdashboard"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-200 hover:bg-white/10 hover:text-white hover:shadow-md"
                    }`}
                  >
                    Dashboard
                  </Link>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-x-4">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    className="text-gray-200 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                  >
                    Example name
                  </Button>
                  <div className="relative group">
                    <Image
                      src="/profile.svg"
                      alt="Avatar"
                      width={36}
                      height={36}
                      className="rounded-full ring-2 ring-white/20 group-hover:ring-blue-400/50 transition-all duration-200 cursor-pointer"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/20 group-hover:to-purple-400/20 transition-all duration-200"></div>
                  </div>
                </>
              ) : (
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 shadow-lg shadow-yellow-500/25 transition-all duration-200 font-semibold">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      {user && (
        <>
          {/* Desktop Sidebar */}
          <div
            className={`hidden md:block fixed top-16 left-0 bottom-0 bg-gradient-to-b from-[#1a2332] to-[#2d3748] border-r border-gray-600/30 shadow-xl transition-all duration-300 ease-in-out z-40 overflow-hidden ${
              isSidebarOpen ? 'w-80' : 'w-16'
            }`}
            onClick={() => !isSidebarOpen && setIsSidebarOpen(true)}
          >
            {/* Sidebar content */}
            <div className="h-full flex flex-col relative">
              {/* Toggle button */}
              <div className={`absolute top-1/2 transform -translate-y-1/2 z-10 transition-all duration-300 ${
                isSidebarOpen ? '-right-4' : '-right-3'
              }`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSidebarOpen(!isSidebarOpen);
                  }}
                  className="bg-gradient-to-r from-[#1a2332] to-[#2d3748] border border-gray-600/30 rounded-full p-2 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  {isSidebarOpen ? (
                    <ChevronLeftIcon className="h-3 w-3" />
                  ) : (
                    <ChevronRightIcon className="h-3 w-3" />
                  )}
                </button>
              </div>

              {/* Sidebar Navigation */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 scrollbar-custom">
                <div className={`space-y-1 ${isSidebarOpen ? 'px-4' : 'px-2'}`}>
                  {/* Dashboard Link */}
                  <Link
                    href="/newdashboard"
                    className={`flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      isSidebarOpen ? 'px-4 py-3' : 'px-3 py-3 justify-center'
                    } ${
                      pathname === "/newdashboard"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                    title={!isSidebarOpen ? "Dashboard" : ""}
                    onClick={() => !isSidebarOpen && setIsSidebarOpen(true)}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                    {isSidebarOpen && <span className="ml-3 whitespace-nowrap">Dashboard</span>}
                  </Link>

                  {/* Tool Categories */}
                  {toolCategories.map((category, index) => (
                    <div key={category.name} className="space-y-1">
                      {/* Category Header */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSidebarOpen) {
                            setIsSidebarOpen(true);
                          } else {
                            toggleCategory(category.name);
                          }
                        }}
                        className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                          isSidebarOpen ? 'px-4 py-3 justify-between' : 'px-3 py-3 justify-center'
                        } ${
                          category.tools.some(tool => pathname?.startsWith(tool.href))
                            ? "text-blue-300 bg-blue-500/10"
                            : "text-gray-300 hover:text-white hover:bg-white/5"
                        }`}
                        title={!isSidebarOpen ? category.name : ""}
                      >
                        <div className="flex items-center min-w-0">
                          <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                            {getCategoryIcon(category.name)}
                          </div>
                          {isSidebarOpen && (
                            <span className="ml-3 whitespace-nowrap truncate">
                              {category.name}
                            </span>
                          )}
                        </div>
                        {isSidebarOpen && (
                          <ChevronDownIcon
                            className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                              openCategories[category.name] ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>

                      {/* Category Tools - Expanded State */}
                      {openCategories[category.name] && isSidebarOpen && (
                        <div className="ml-8 space-y-1 border-l border-gray-600/30 pl-4">
                          {category.tools.map((tool) => (
                            <Link
                              key={tool.href}
                              href={tool.href}
                              className={`block px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                                pathname === tool.href
                                  ? "bg-gradient-to-r from-blue-600/30 to-blue-700/30 text-white border-l-2 border-yellow-400 shadow-inner"
                                  : "text-gray-400 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <div className="font-medium truncate">{tool.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5 truncate group-hover:text-gray-400">
                                {tool.description}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Collapsed state - show tools on hover */}
                      {!isSidebarOpen && (
                        <div className="group/hover relative">
                          <div className="absolute left-full top-0 ml-4 w-72 bg-gradient-to-br from-[#1a2332] to-[#2d3748] rounded-xl shadow-2xl py-3 ring-1 ring-white/10 backdrop-blur-xl border border-white/20 opacity-0 invisible group-hover/hover:opacity-100 group-hover/hover:visible transition-all duration-300 z-50">
                            <div className="px-4 py-2 text-xs font-bold text-blue-300 uppercase tracking-wider border-b border-gray-600/30 mb-2">
                              {category.name}
                            </div>
                            <div className="max-h-80 overflow-y-auto scrollbar-hover-tooltip">
                              {category.tools.map((tool) => (
                                <Link
                                  key={tool.href}
                                  href={tool.href}
                                  className={`block px-4 py-3 hover:bg-white/5 transition-all duration-200 group rounded-lg mx-2 ${
                                    pathname === tool.href
                                      ? "bg-gradient-to-r from-blue-600/20 to-blue-700/20 border-l-4 border-yellow-400"
                                      : ""
                                  }`}
                                  onClick={() => setIsSidebarOpen(true)}
                                >
                                  <div className="font-semibold text-white group-hover:text-blue-200 truncate">
                                    {tool.name}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 truncate">
                                    {tool.description}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign Out Button at Bottom */}
              <div className={`border-t border-gray-600/30 ${isSidebarOpen ? 'px-4 py-4' : 'px-2 py-4'}`}>
                <Button
                  variant="ghost"
                  className={`w-full text-gray-300 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 font-medium ${
                    isSidebarOpen ? 'px-4 py-3 justify-start' : 'px-3 py-3 justify-center'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSidebarOpen) {
                      setIsSidebarOpen(true);
                    } else {
                      handleSignOut();
                    }
                  }}
                  title={!isSidebarOpen ? "Sign Out" : ""}
                >
                  <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {isSidebarOpen && <span className="ml-3 whitespace-nowrap">Sign Out</span>}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Sidebar */}
          <div
            ref={sidebarRef}
            className={`md:hidden fixed top-16 left-0 bottom-0 w-80 bg-gradient-to-b from-[#1a2332] to-[#2d3748] border-r border-gray-600/30 shadow-xl transform transition-transform duration-300 ease-in-out z-40 overflow-hidden ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="h-full overflow-y-auto overflow-x-hidden py-6 scrollbar-custom">
              <div className="px-4 space-y-1">
                {/* Dashboard Link */}
                <Link
                  href="/newdashboard"
                  className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    pathname === "/newdashboard"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  Dashboard
                </Link>

                {/* Mobile Categories */}
                {toolCategories.map((category) => (
                  <div key={category.name}>
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-blue-300 hover:bg-white/5 rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0">
                          {getCategoryIcon(category.name)}
                        </div>
                        <span className="uppercase tracking-wider">{category.name}</span>
                      </div>
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-200 ${
                          openCategories[category.name] ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openCategories[category.name] && (
                      <div className="ml-8 space-y-1 mt-2 border-l border-gray-600/30 pl-4">
                        {category.tools.map((tool) => (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                              pathname === tool.href
                                ? "bg-gradient-to-r from-blue-600/20 to-blue-700/20 text-white border-l-2 border-yellow-400"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="truncate">{tool.name}</div>
                            <div className="text-sm text-gray-400 mt-1 truncate">
                              {tool.description}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile user menu */}
              <div className="mt-6 pt-4 border-t border-gray-600/30">
                <div className="px-4">
                  <button
                    className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
}