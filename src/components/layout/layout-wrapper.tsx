// Path: src/components/layout/layout-wrapper.tsx
"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useState, useEffect, createContext, useContext } from "react";

// Create a context for sidebar state
const SidebarContext = createContext<{
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}>({
  isSidebarOpen: true,
  setIsSidebarOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      <div className="min-h-screen">
        {/* Main Content Area */}
        <div className="pt-16">
          {/* Content with dynamic sidebar spacing */}
          <div className={`transition-all duration-300 ease-in-out ${
            user && isSidebarOpen 
              ? 'md:ml-80' 
              : user 
                ? 'md:ml-16' 
                : ''
          }`}>
            {children}
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}