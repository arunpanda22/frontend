"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Info,
  Zap,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useInvokeAdsOptimizer } from "@/lib/hooks/queries/use-ads-optimizer";
import { useAdsOptimizerStore } from "@/lib/hooks/use-ads-optimizer-store";
import { LoadingWidget } from "@/components/ui/loading-widget";
import type { AdsOptimizerRequest } from "./lib/types";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";
import OverrideConfig from "./OverrideConfig";

export default function AdsOptimizerPage() {
  const router = useRouter();
  const { mutate: invokeOptimizer, isPending, error } = useInvokeAdsOptimizer();
  const setOptimizationData = useAdsOptimizerStore((state) => state.setOptimizationData);
  const { data: userProfile } = useUserProfile();

  const [isLoading, setIsLoading] = useState(false);
  const [apiDone, setApiDone] = useState(false);
  const [minTimeDone, setMinTimeDone] = useState(false);

  const [isCombined, setIsCombined] = useState(true);
  const [targetAcos, setTargetAcos] = useState({ combined: 25, sp: 20, sb: 30, sd: 40 });
  const [mode, setMode] = useState<"Sales Optimisation" | "ACOS Optimisation" | "Balanced Optimisation">("Balanced Optimisation");
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [multipliers, setMultipliers] = useState({
    brand: 1, competitor: 1, product_target: 1, new_launch: 1, recent_start: 1,
  });
  const [dayParting, setDayParting] = useState(false);
  const [inventoryAwareBidding, setInventoryAwareBidding] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userProfile?.connected_advertising_profiles?.[0]?.target_acos) {
      const profileTargetAcos = parseFloat(userProfile.connected_advertising_profiles[0].target_acos);
      if (!isNaN(profileTargetAcos) && profileTargetAcos > 0) {
        setTargetAcos(prev => ({ ...prev, combined: profileTargetAcos }));
      }
    }
  }, [userProfile]);

  // Navigate when API responds AND minimum animation time has passed
  useEffect(() => {
    if (apiDone && minTimeDone) {
      router.push("/dashboard/ads-optimizer/results");
    }
  }, [apiDone, minTimeDone, router]);

  const resetToDefaults = () => {
    const defaultAcos = userProfile?.connected_advertising_profiles?.[0]?.target_acos
      ? parseFloat(userProfile.connected_advertising_profiles[0].target_acos) : 25;
    setIsCombined(true);
    setTargetAcos({ combined: !isNaN(defaultAcos) && defaultAcos > 0 ? defaultAcos : 25, sp: 20, sb: 30, sd: 40 });
    setMode("Balanced Optimisation");
    setMultipliers({ brand: 1, competitor: 1, product_target: 1, new_launch: 1, recent_start: 1 });
    setShowMultipliers(false);
    setDayParting(false);
    setInventoryAwareBidding(false);
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (isCombined) {
      if (targetAcos.combined <= 0) errors.combined = "Target ACOS must be above 0";
    } else {
      if (targetAcos.sp <= 0) errors.sp = "SP ACOS must be above 0";
      if (targetAcos.sb <= 0) errors.sb = "SB ACOS must be above 0";
      if (targetAcos.sd <= 0) errors.sd = "SD ACOS must be above 0";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const acosDecimal = isCombined ? targetAcos.combined / 100 : null;

    const payload: AdsOptimizerRequest = {
      target_acos_sp: isCombined ? acosDecimal! : targetAcos.sp / 100,
      target_acos_sb: isCombined ? acosDecimal! : targetAcos.sb / 100,
      target_acos_sd: isCombined ? acosDecimal! : targetAcos.sd / 100,
      mode,
      ...(showMultipliers && {
        brand: multipliers.brand,
        competitor: multipliers.competitor,
        product_target: multipliers.product_target,
        new_launch: multipliers.new_launch,
        recent_start: multipliers.recent_start,
      }),
    };

    setIsLoading(true);
    setApiDone(false);
    setMinTimeDone(false);

    // Minimum 5s so the animation doesn't flash
    setTimeout(() => setMinTimeDone(true), 5000);

    invokeOptimizer(payload, {
      onSuccess: (data) => {
        setOptimizationData(data);
        setApiDone(true);
      },
      onError: (error: any) => {
        setIsLoading(false);
        setApiDone(false);
        setMinTimeDone(false);
        if (error?.response?.data?.details) {
          setValidationErrors(error.response.data.details);
        }
      },
    });
  };

  const modes: Array<{ value: typeof mode; label: string; tooltip: string }> = [
    { value: "ACOS Optimisation", label: "ACOS Optimized", tooltip: "Focuses on achieving your target ACOS with aggressive bid adjustments" },
    { value: "Balanced Optimisation", label: "Balanced", tooltip: "Balances between ACOS targets and sales volume for sustainable growth" },
    { value: "Sales Optimisation", label: "Sales Maximized", tooltip: "Prioritizes sales volume while loosely maintaining ACOS thresholds" },
  ];

  return (
    <div className="w-full min-h-full bg-gradient-to-br from-blue-700 to-blue-950 shadow-2xl font-montserrat">
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-0">

        {/* Left Content Section */}
        <div className="lg:col-span-2 xl:col-span-3 p-12 text-white flex flex-col justify-top">
          <div className="max-w-3xl">
            <div className="text-blue-200 text-sm font-medium mb-3 tracking-wide uppercase">
              AI-Powered Amazon Optimization
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Automated Bid Management for Maximum ROI
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Stop wasting hours adjusting bids manually. Our AI{" "}
              <strong>automatically optimizes</strong> Sponsored Products, Brands, and Display
              campaigns to maximize revenue and minimize ACOS—in real time.
            </p>
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Real-Time Optimization</h3>
                  <p className="text-blue-100 text-sm">Advanced machine learning handles bid recalibration and budget shifts automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Hit Your Target ACOS</h3>
                  <p className="text-blue-100 text-sm">Set your goals and let AI handle campaign creation, negations, and placement tuning</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-purple-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Save 15+ Hours Weekly</h3>
                  <p className="text-blue-100 text-sm">Focus on strategy while automation handles the tedious bid adjustments</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-blue-400">
              <div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🏆</span>
                </div>
                <h4 className="font-semibold mb-1">Trusted by</h4>
                <p className="text-blue-100 text-sm">80+ Amazon Sellers & Agencies</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h4 className="font-semibold mb-1">AI-Driven</h4>
                <p className="text-blue-100 text-sm">Ad Optimization Engine</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">💰</span>
                </div>
                <h4 className="font-semibold mb-1">Over $50M+</h4>
                <p className="text-blue-100 text-sm">in Ad Spend Managed Automatically</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-2 xl:col-span-2 py-12 pr-12 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-l">
            <div className="bg-white rounded-2xl shadow-xl p-8">

              {/* Inline loading state */}
              {isLoading ? (
                <LoadingWidget inline apiDone={apiDone} onComplete={() => router.push("/dashboard/ads-optimizer/results")} />
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure Optimizer</h2>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        {(error as any)?.response?.data?.error || "Failed to start optimization. Please try again."}
                      </p>
                    </div>
                  )}

                  <div className="space-y-6">

                    {/* Target ACOS */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-gray-700">Target ACOS (%)</label>
                          <div className="group relative">
                            <Info size={14} className="text-gray-400 cursor-help" />
                            <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10 pointer-events-none">
                              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 w-48 whitespace-normal">
                                Set target ACOS for all or by individual ad type
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${!isCombined ? "text-gray-900 font-medium" : "text-gray-400"}`}>Individual</span>
                          <button
                            type="button"
                            onClick={() => setIsCombined(!isCombined)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${isCombined ? "bg-blue-600" : "bg-gray-300"}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isCombined ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                          <span className={`text-xs ${isCombined ? "text-gray-900 font-medium" : "text-gray-400"}`}>Combined</span>
                        </div>
                      </div>

                      {isCombined ? (
                        <div>
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <input
                              type="number" min="0" max="100" step="0.1"
                              value={targetAcos.combined}
                              onChange={(e) => setTargetAcos({ ...targetAcos, combined: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="%"
                            />
                          </div>
                          {validationErrors.combined && <p className="mt-1 text-xs text-red-600">{validationErrors.combined}</p>}
                        </div>
                      ) : (
                        <div>
                          <div className="bg-gray-100 p-3 rounded-lg space-y-2">
                            {(["sp", "sb", "sd"] as const).map((key) => (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-800 w-16 flex-shrink-0 uppercase">{key}:</span>
                                <input
                                  type="number" min="0" max="100" step="0.1"
                                  value={targetAcos[key]}
                                  onChange={(e) => setTargetAcos({ ...targetAcos, [key]: parseFloat(e.target.value) || 0 })}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            ))}
                          </div>
                          {(validationErrors.sp || validationErrors.sb || validationErrors.sd) && (
                            <p className="mt-1 text-xs text-red-600">
                              {validationErrors.sp || validationErrors.sb || validationErrors.sd}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Optimization Mode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Mode</label>
                      <div className="grid grid-cols-3 gap-2">
                        {modes.map((modeOption) => (
                          <div key={modeOption.value} className="relative group">
                            <button
                              type="button"
                              onClick={() => setMode(modeOption.value)}
                              className={`w-full px-2 py-2 text-xs rounded-lg font-medium transition-all ${
                                mode === modeOption.value ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {modeOption.label}
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 w-40 text-center whitespace-normal">
                                {modeOption.tooltip}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-col gap-4">
                      {[
                        { label: "Day Parting", value: dayParting, setter: setDayParting, tooltip: "Automatically adjust bids during peak conversion hours" },
                        { label: "Inventory Aware Bidding", value: inventoryAwareBidding, setter: setInventoryAwareBidding, tooltip: "Reduce bids when inventory is low to prevent stockouts" },
                      ].map(({ label, value, setter, tooltip }) => (
                        <div key={label} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-700 px-4">{label} :</label>
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={() => setter(!value)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-300"}`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
                              </button>
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-20">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 w-48 text-center shadow-lg">{tooltip}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Advanced Multipliers */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowMultipliers(!showMultipliers)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span>Advanced Multipliers (Optional)</span>
                          <div className="group relative">
                            <Info size={14} className="text-gray-400 cursor-help" />
                            <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10 pointer-events-none">
                              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 w-48 whitespace-normal">
                                Adjust bid multipliers for different campaign types. Defaults are used if not specified.
                              </div>
                            </div>
                          </div>
                        </div>
                        {showMultipliers ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {showMultipliers && (
                        <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              ["Brand", "brand"],
                              ["Competitor", "competitor"],
                              ["Product", "product_target"],
                              ["New Launch", "new_launch"],
                            ] as const).map(([label, key]) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className="text-xs font-medium text-gray-600 w-20">{label}</span>
                                <input
                                  type="number" min="0.1" max="5.0" step="0.1"
                                  value={multipliers[key]}
                                  onChange={(e) => setMultipliers({ ...multipliers, [key]: parseFloat(e.target.value) || 0.1 })}
                                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-gray-600 w-20">Recent Start</span>
                            <input
                              type="number" min="0.1" max="5.0" step="0.1"
                              value={multipliers.recent_start}
                              onChange={(e) => setMultipliers({ ...multipliers, recent_start: parseFloat(e.target.value) || 0.1 })}
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mt-8">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isPending}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /><span>Starting Optimization...</span></>
                      ) : "Start Optimization"}
                    </button>
                    <button
                      type="button"
                      onClick={resetToDefaults}
                      disabled={isPending}
                      className="w-full px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Override Configuration Section */}
      <div className="w-full border-t border-white/10">
        <OverrideConfig />
      </div>
    </div>
  );
}