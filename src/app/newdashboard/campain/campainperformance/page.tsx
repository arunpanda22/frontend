"use client"
import React from "react";
import StatCardGrid from './statecardgrid'
import CampainAdsSummery from './campain_summery'
import CampaignSummaryCard from "./CampaignSummaryCard";





export default function CRMPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-4 px-1 sm:px-2 md:px-4 w-full">
      <h1 className="text-4xl font-extrabold text-[#1a2b3c] mb-6 text-center tracking-tight">Campaign Performance Dashboard</h1>
      <div className="flex flex-col gap-4 sm:gap-6 w-full">
         {/* Stat Cards Grid */}
         <StatCardGrid />
        
    
       
        {/* Campaign Performance Overview */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 w-full">
          <CampaignSummaryCard />
        </div>
        {/* Leads Table */}
        {/* Campaign Summary Table */}
       


        <CampainAdsSummery />
       
        </div>
        
      </div>
    
  );
}
