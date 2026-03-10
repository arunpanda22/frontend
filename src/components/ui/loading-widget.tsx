"use client"

import { useEffect, useState } from "react"
import { BarChart3, TrendingUp, Settings, RefreshCw, Database, Target, CheckCircle2 } from "lucide-react"

const icons = [
  { Icon: BarChart3, label: "Analyzing" },
  { Icon: TrendingUp, label: "Optimizing" },
  { Icon: Target, label: "Targeting" },
  { Icon: Settings, label: "Configuring" },
  { Icon: Database, label: "Processing" },
  { Icon: RefreshCw, label: "Updating" },
]

const encouragingMessages = [
  "Analyzing your Amazon ad performance...",
  "Optimizing bid strategies for maximum ROI...",
  "Refining audience targeting...",
  "Processing campaign data...",
  "Calculating performance metrics...",
  "Fine-tuning recommendations...",
  "Building optimization report...",
  "Preparing insights for you...",
  "Maximizing your ad spend efficiency...",
  "Enhancing campaign performance...",
  "Smart optimization in progress...",
  "Working toward better results...",
]

const tips = [
  "Tip: Amazon ads typically see a 15-25% improvement in ROAS after optimization.",
  "Tip: Keyword optimization can reduce your cost per click by up to 30%.",
  "Tip: A/B testing ad copy can increase CTR by 20-40%.",
  "Tip: Negative keywords reduce wasted ad spend by up to 25%.",
  "Tip: Optimized bids can improve your ad rank significantly.",
  "Tip: Regular campaign audits help identify performance opportunities.",
]

interface LoadingWidgetProps {
  totalSteps?: number;
  onComplete?: () => void;
  // New props for inline mode
  inline?: boolean;       // renders compactly inside a card
  apiDone?: boolean;      // when true + minTime passed, shows "done" state
}

export function LoadingWidget({ totalSteps = 12, onComplete, inline = false, apiDone = false }: LoadingWidgetProps) {
  const [iconIndex, setIconIndex] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [minTimeDone, setMinTimeDone] = useState(false)
  const [showDone, setShowDone] = useState(false)

  // Minimum 5 seconds of animation before allowing completion
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeDone(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  // When both API is done and min time has passed, show done state briefly then complete
  useEffect(() => {
    if (apiDone && minTimeDone && !showDone) {
      setShowDone(true)
      setTimeout(() => onComplete?.(), 800) // brief "done" flash before navigation
    }
  }, [apiDone, minTimeDone, showDone, onComplete])

  // Elapsed timer (for display only in inline mode — no hard cutoff)
  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      setElapsedSeconds((Date.now() - start) / 1000)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Legacy full-page mode: keep old timer-based completion
  useEffect(() => {
    if (inline) return // skip for inline mode
    if (elapsedSeconds >= 35) onComplete?.()
  }, [elapsedSeconds, inline, onComplete])

  useEffect(() => {
    const interval = setInterval(() => setIconIndex((prev) => (prev + 1) % icons.length), 3500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setMessageIndex((prev) => (prev + 1) % encouragingMessages.length), 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setTipIndex((prev) => (prev + 1) % tips.length), 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const message = encouragingMessages[messageIndex]
    if (displayedText.length < message.length) {
      const timeout = setTimeout(() => setDisplayedText(message.slice(0, displayedText.length + 1)), 30)
      return () => clearTimeout(timeout)
    }
  }, [displayedText, messageIndex])

  useEffect(() => setDisplayedText(""), [messageIndex])

  const CurrentIcon = icons[iconIndex].Icon

  // Inline mode — fits inside the white card
  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        {/* Icon */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {showDone ? (
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-pulse" />
          ) : (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-pulse" />
              <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500"
                style={{ animation: "spin 2s linear infinite" }} />
              <div className="relative z-10 w-14 h-14 flex items-center justify-center bg-blue-50 rounded-full">
                <CurrentIcon className="w-7 h-7 text-blue-600 transition-all duration-500" />
              </div>
            </>
          )}
        </div>

        {/* Status text */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-800">
            {showDone ? "✓ Optimization Complete!" : displayedText || "Starting..."}
          </p>
          <p className="text-xs text-gray-400">{elapsedSeconds.toFixed(1)}s elapsed</p>
        </div>

        {/* Progress dots */}
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => {
            const filled = showDone ? true : i <= Math.floor((elapsedSeconds / 60) * 12)
            return (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${filled ? "bg-blue-500" : "bg-gray-200"}`} />
            )
          })}
        </div>

        {/* Tip */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 w-full">
          <p className="text-xs text-gray-500 leading-relaxed text-center">{tips[tipIndex]}</p>
        </div>
      </div>
    )
  }

  // Legacy full-page mode (unchanged behaviour)
  const progress = Math.min((elapsedSeconds / 35) * 100, 100)
  const currentStep = Math.min(Math.floor((elapsedSeconds / 35) * totalSteps), totalSteps - 1)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <style>{`
        @keyframes fadeOut { 0% { opacity:1; transform:scale(1);} 100%{opacity:0;transform:scale(0);}}
      `}</style>
      <div className="w-full max-w-md mx-auto px-6 py-8">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 space-y-6">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
              <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary border-r-primary"
                style={{ animation: "spin 3s linear infinite" }} />
              <div className="relative z-10 w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full animate-pulse">
                <CurrentIcon className="w-10 h-10 text-primary transition-all duration-500" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Step {currentStep + 1} of {totalSteps}</span>
              <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="text-center space-y-1 min-h-12 flex flex-col justify-center">
            <p className="text-sm font-medium text-primary h-5">{displayedText}</p>
            <p className="text-xs text-muted-foreground">{elapsedSeconds.toFixed(1)}s elapsed</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed text-balance">{tips[tipIndex]}</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index <= currentStep ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
          <div className="text-center pt-2">
            <p className="text-xs font-semibold text-foreground">
              {currentStep === totalSteps - 1 ? "✓ Complete!" : "Optimizing your performance..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}