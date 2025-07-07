"use client"
import React from "react";
import { FaUserFriends, FaFeather, FaShoppingCart, FaHeart, FaDollarSign, FaCoins, FaRedo, FaChartLine, FaEllipsisH, FaStar, FaBullhorn, FaTag, FaTv } from "react-icons/fa";
import { HiOutlineChevronRight } from "react-icons/hi";
import StatCardGrid from './statecardgrid'
import CampainAdsSummery from './campain_summery'
import CampaignSummaryCard from "./CampaignSummaryCard";

// --- Mock Data ---
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const barChartData = [
  { Visitor: 120, AddCart: 30, CheckOut: 20, Favorite: 10 },
  { Visitor: 180, AddCart: 40, CheckOut: 25, Favorite: 15 },
  { Visitor: 60, AddCart: 20, CheckOut: 10, Favorite: 8 },
  { Visitor: 100, AddCart: 30, CheckOut: 15, Favorite: 12 },
  { Visitor: 80, AddCart: 25, CheckOut: 12, Favorite: 10 },
  { Visitor: 70, AddCart: 18, CheckOut: 10, Favorite: 9 },
  { Visitor: 75, AddCart: 22, CheckOut: 13, Favorite: 10 },
  { Visitor: 90, AddCart: 28, CheckOut: 15, Favorite: 12 },
  { Visitor: 110, AddCart: 32, CheckOut: 18, Favorite: 14 },
  { Visitor: 130, AddCart: 38, CheckOut: 20, Favorite: 16 },
  { Visitor: 150, AddCart: 45, CheckOut: 22, Favorite: 18 },
  { Visitor: 170, AddCart: 50, CheckOut: 25, Favorite: 20 },
];
const statCards = [
  { icon: <FaUserFriends />, label: "Customers Visits", value: "345121", trend: "17.9%", trendPositive: true },
  { icon: <FaFeather />, label: "Impressions", value: "516871", trend: "17.9%", trendPositive: true },
  { icon: <FaShoppingCart />, label: "Total Orders", value: "14596", trend: "17.9%", trendPositive: false },
  { icon: <FaHeart />, label: "Wishlists", value: "102450", trend: "17.9%", trendPositive: true },
  { icon: <FaDollarSign />, label: "Total Earning", value: "$316M", trend: "17.9%", trendPositive: true },
  { icon: <FaCoins />, label: "Total Profit", value: "$278M", trend: "17.9%", trendPositive: true },
  { icon: <FaRedo />, label: "Repeat Orders", value: "53629", trend: "17.9%", trendPositive: true },
  { icon: <FaChartLine />, label: "Conversion Rate", value: "70%", trend: "17.9%", trendPositive: false },
];
const deals = [
  { date: "20 Jul, 2024", title: "Financial Work History", person: "Donna Berlin", amount: "$87,000", status: "Contract sent" },
  { date: "18 Jul, 2024", title: "Digital Marketing", person: "Domiex Admin Role", amount: "$49,599", status: "Contract sent" },
];
const leads = [
  { name: "Dorothy Daley", rating: 4.3, date: "12 Jan, 2024", contact: "dorothy@example.com", source: "Online Source", status: "New", statusColor: "blue", balance: "$15,000" },
  { name: "John Smith", rating: 4.7, date: "5 Feb, 2024", contact: "john@example.com", source: "Referral", status: "Contacted", statusColor: "green", balance: "$12,500" },
  { name: "Jane Doe", rating: 3.9, date: "20 Mar, 2024", contact: "jane@example.com", source: "Online Source", status: "Interested", statusColor: "yellow", balance: "$8,000" },
  { name: "Michael Johnson", rating: 4.5, date: "18 Apr, 2024", contact: "michael@example.com", source: "Trade Show", status: "Negotiation", statusColor: "purple", balance: "$20,000" },
  { name: "Emily Brown", rating: 4.2, date: "10 May, 2024", contact: "emily@example.com", source: "Website", status: "Closed", statusColor: "red", balance: "$25,000" },
  { name: "David Wilson", rating: 3.5, date: "30 May, 2024", contact: "wilson@example.com", source: "Email Campaign", status: "Closed", statusColor: "red", balance: "$5,000" },
  { name: "Jessica Davis", rating: 4.0, date: "15 Jun, 2024", contact: "davis@example.com", source: "Cold Call", status: "New", statusColor: "blue", balance: "$10,000" },
  { name: "Thomas Martinez", rating: 3.8, date: "25 Jun, 2024", contact: "thomas@example.com", source: "Referral", status: "Contacted", statusColor: "green", balance: "$7,500" },
];

function TrendBadge({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
      {positive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      )}
      {value}
    </span>
  );
}



function BarChart() {
  // Simple SVG bar chart for demo
  const max = Math.max(...barChartData.map(d => d.Visitor + d.AddCart + d.CheckOut + d.Favorite));
  return (
    <svg width="100%" height="260" viewBox="0 0 900 260" className="w-full h-[180px] sm:h-[220px] md:h-[260px]">
      {barChartData.map((d, i) => {
        const x = 40 + i * 70;
        let y = 220;
        const barW = 28;
        const scale = 180 / max;
        const colors = ["#2563EB", "#F43F5E", "#38BDF8", "#334155"];
        const vals = [d.Visitor, d.AddCart, d.CheckOut, d.Favorite];
        return (
          <g key={i}>
            {vals.map((v, j) => {
              const h = v * scale;
              y -= h;
              return <rect key={j} x={x} y={y} width={barW} height={h} rx={4} fill={colors[j]} />;
            })}
            <text x={x + barW / 2} y={240} textAnchor="middle" fontSize="12" fill="#64748b">{months[i]}</text>
          </g>
        );
      })}
      {/* Y axis */}
      {[0, 50, 100, 150, 200, 250].map(v => (
        <text key={v} x={10} y={220 - v * (180 / max)} fontSize="10" fill="#cbd5e1">{v}</text>
      ))}
    </svg>
  );
}

export default function CRMPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-4 px-1 sm:px-2 md:px-4 w-full">
      <div className="flex flex-col gap-4 sm:gap-6 w-full">
         {/* Stat Cards Grid */}
         <StatCardGrid />
        
    
       
        {/* Deal Revenue Forecast & Deals Open */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 w-full">
          {/* Deal Revenue Forecast */}
        
          {/* Deals Open */}
          <CampaignSummaryCard /> 
          <CampaignSummaryCard />
          <CampaignSummaryCard />
        </div>
        {/* Leads Table */}
        {/* Campaign Summary Table */}
       


        <CampainAdsSummery />
       
        </div>
        
      </div>
    
  );
}
