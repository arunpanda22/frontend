"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/button";
import { describe } from "node:test";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Define tools for dropdown with categories for better organization
  const toolCategories = [
    {
      name: "Content Generation",
      tools: [
        {
          name: "Listing Generator",
          href: "/lister",
          description: "Generate optimized product listings",
        },
      ],
    },
    {
      name: "Catalog",
      tools: [
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
          name: "ASIN performance",
          href: "/newdashboard/asinperformance",
          description: "Analyze ASIN ",
        },
        {
          name: "Campain performance",
          href: "/newdashboard/campain/campainperformance",
          describe: "Analysis ASIN",
        },
        {
          name: "Inventory",
          href: "/newdashboard/inventory",
          describe: "Analysis ASIN",
        },
      ],
    },
    {
      name: "Bulk File",
      tools: [
        {
          name: "Bulk File Optimizer",
          href: "/sp",
          description: "Optimize your Sponsored Products campaigns",
        },
      ],
    },
    {
      name: "Advertising",
      tools: [
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
    // Future categories can be added here
  ];

  // Flatten tools for active check
  const allTools = toolCategories.flatMap((category) => category.tools);
  const isToolActive = allTools.some((tool) => pathname?.startsWith(tool.href));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsToolsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gradient-to-r from-[#1a2332] to-[#2d3748] border-b border-gray-600/30 shadow-lg backdrop-blur-sm">
      <div className="max-w-9xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link
              href={user ? "/" : "/login"}
              className="flex items-center h-16 group"
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

            {/* Main Navigation - Only shown when logged in */}
            {user && (
              <div className="hidden md:block ml-10">
                <div className="flex items-center space-x-6">
                  <Link
                    href="/dashboard"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      pathname === "/dashboard"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-200 hover:bg-white/10 hover:text-white hover:shadow-md"
                    }`}
                  >
                    Dashboard
                  </Link>

                  {/* Tools Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsToolsOpen(!isToolsOpen)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center transition-all duration-200 ${
                        isToolActive
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                          : "text-gray-200 hover:bg-white/10 hover:text-white hover:shadow-md"
                      }`}
                    >
                      Tools
                      <ChevronDownIcon
                        className={`ml-2 h-4 w-4 transition-transform duration-200 ${isToolsOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Enhanced Dropdown Menu with Categories */}
                    {isToolsOpen && (
                      <div className="absolute dropdown-menu mt-3 w-80 bg-gradient-to-br from-[#1a2332] to-[#2d3748] rounded-xl shadow-2xl py-2 ring-1 ring-white/10 backdrop-blur-xl border border-white/20 focus:outline-none max-h-[calc(100vh-120px)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {toolCategories.map((category, idx) => (
                          <div
                            key={category.name}
                            className={idx > 0 ? "mt-3" : ""}
                          >
                            <div className="px-4 py-2.5 text-xs font-bold text-blue-300 uppercase tracking-wider border-b border-gray-600/30">
                              {category.name}
                            </div>
                            <div>
                              {category.tools.map((tool) => (
                                <Link
                                  key={tool.href}
                                  href={tool.href}
                                  className={`block px-4 py-3.5 hover:bg-white/5 transition-all duration-200 group ${
                                    pathname === tool.href
                                      ? "bg-gradient-to-r from-blue-600/20 to-blue-700/20 border-l-4 border-yellow-400 shadow-inner"
                                      : ""
                                  }`}
                                  onClick={() => setIsToolsOpen(false)}
                                >
                                  <div className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                                    {tool.name}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">
                                    {tool.description}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 gap-x-6">
              {user ? (
                <Button
                  variant="ghost"
                  className="ml-2 text-gray-200 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              ) : (
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 shadow-lg shadow-yellow-500/25 transition-all duration-200 font-semibold">
                    Sign In
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="ml-2 text-gray-200 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
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
              </div>
            </div>
          </div>

          {/* Mobile menu button - Only shown when logged in */}
          {user && (
            <div className="md:hidden flex items-center">
              <button
                type="button"
                className="bg-white/10 inline-flex items-center justify-center p-2.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/20 focus:outline-none transition-all duration-200 shadow-md"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={() => setIsToolsOpen(!isToolsOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon for menu - 3 horizontal lines */}
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Icon for X - close menu */}
                <svg
                  className="hidden h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu - Only shown when logged in */}
      {user && isToolsOpen && (
        <div className="md:hidden z-50 relative bg-gradient-to-b from-[#1a2332] to-[#2d3748] border-t border-gray-600/30 shadow-xl" id="mobile-menu">
          <div className="px-4 pt-3 pb-4 space-y-2">
            <Link
              href="/dashboard"
              className={`block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                pathname === "/dashboard"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              Dashboard
            </Link>

            {/* Mobile Categories */}
            {toolCategories.map((category) => (
              <div key={category.name}>
                <div className="px-4 py-2.5 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  {category.name}
                </div>

                {/* Tool Links */}
                {category.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                      pathname === tool.href
                        ? "bg-gradient-to-r from-blue-600/20 to-blue-700/20 text-white border-l-4 border-yellow-400"
                        : "text-gray-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {tool.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile user menu */}
          <div className="pt-4 pb-4 border-t border-gray-600/30">
            <div className="px-4 space-y-2">
              <button
                className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-all duration-200"
                onClick={() => signOut()}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

