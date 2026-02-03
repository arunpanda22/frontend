"use client"

import { useEffect, useState } from "react"
import { BarChart3, TrendingUp, Settings, RefreshCw, Database, Target } from "lucide-react"

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

export function LoadingWidget({ totalSteps = 12, onComplete }: { totalSteps?: number; onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [iconIndex, setIconIndex] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [displayedText, setDisplayedText] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setElapsedSeconds(Math.min(elapsed, 35))
      const progress = Math.floor((elapsed / 35) * totalSteps)
      setCurrentStep(Math.min(progress, totalSteps - 1))

      if (elapsed >= 35) {
        clearInterval(interval)
        onComplete?.()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [totalSteps, onComplete])

  useEffect(() => {
    const interval = setInterval(
      () => {
        setIconIndex((prev) => (prev + 1) % icons.length)
      },
      3500 + Math.random() * 2000,
    )
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % encouragingMessages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const newParticle = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
      }
      setParticles((prev) => [...prev, newParticle].slice(-15))
    }, 600)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const message = encouragingMessages[messageIndex]
    if (displayedText.length < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(message.slice(0, displayedText.length + 1))
      }, 30)
      return () => clearTimeout(timeout)
    }
  }, [displayedText, messageIndex])

  useEffect(() => {
    setDisplayedText("")
  }, [messageIndex])

  const CurrentIcon = icons[iconIndex].Icon
  const progress = (currentStep / (totalSteps - 1)) * 100

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-1 h-1 bg-primary/20 rounded-full pointer-events-none animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: "fadeOut 3s ease-out forwards",
          }}
        />
      ))}

      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3); }
          50% { box-shadow: 0 0 40px rgba(var(--primary-rgb), 0.6); }
        }
      `}</style>

      <div className="w-full max-w-md mx-auto px-6 py-8">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 space-y-6">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
              {/* Middle animated ring */}
              <div
                className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary border-r-primary"
                style={{
                  animation: "spin 3s linear infinite",
                }}
              />
              {/* Inner icon container */}
              <div className="relative z-10 w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full animate-pulse">
                <CurrentIcon className="w-10 h-10 text-primary transition-all duration-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
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
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index <= currentStep ? "bg-primary" : "bg-border"
                }`}
              />
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
