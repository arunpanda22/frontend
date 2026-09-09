"use client";
import React from "react";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";

export default function MainDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: userProfile, isLoading, error } = useUserProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7fafc] flex items-center justify-center p-0 pt-16">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500" />
          <span className="font-medium">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7fafc] flex items-center justify-center p-0 pt-16">
        <div className="w-full max-w-xl mx-auto bg-white shadow-xl rounded-2xl p-6 border border-red-100">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-red-50 text-red-600 grid place-items-center">!</div>
            <div>
              <h2 className="text-lg font-semibold text-red-700">We couldn't load your dashboard</h2>
              <p className="text-sm text-red-600 mt-1">{error.message || "An unexpected error occurred."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const noLinkedAccounts = !!userProfile &&
    (userProfile.connected_advertising_profiles?.length ?? 0) === 0 &&
    (userProfile.connected_seller_accounts?.length ?? 0) === 0 &&
    (userProfile.connected_vendor_accounts?.length ?? 0);

  if (noLinkedAccounts) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fafc] to-[#eef2ff] flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-2xl mx-auto bg-white/90 backdrop-blur rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.08)] border border-indigo-100">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm10.5-4.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0ZM9.75 10.5a.75.75 0 000 1.5h.75v4.5a.75.75 0 001.5 0v-4.5h.75a.75.75 0 000-1.5h-3Z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">No accounts linked yet</h2>
              <p className="text-sm text-gray-600 mt-1">Connect an Amazon Advertising or Seller account to view data here. Once connected, this dashboard and all its subpages will populate automatically.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 transition-colors">
                  Connect Accounts
                </a>
                <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-800 text-sm font-medium border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                  Go to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
