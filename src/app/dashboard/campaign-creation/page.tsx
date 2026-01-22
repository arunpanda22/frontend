"use client";
import React from "react";

export default function CampaignCreationPage() {
  return (
    <div className="min-h-screen px-4 bg-[#f7fafc] sm:px-6 lg:px-12 py-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl md:text-4xl text-[#1a2b3c] tracking-tight font-montserrat font-semibold">
              Campaign Creation
            </h1>
          </div>
          <p className="text-gray-600 text-lg mt-2">
            Create and manage your advertising campaigns
          </p>
        </div>

        {/* Campaign Creation Component */}
        {/* <CampaignCreationComponent /> */}
      </div>
    </div>
  );
}

