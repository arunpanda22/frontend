"use client";
import {
  BoltIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { PricingCard } from "@/components/pricing/PricingCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const features = [
  {
    name: "Easy Integration",
    description:
      "Connect and deploy your AI models with just a few clicks. No complex setup required.",
    icon: BoltIcon,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Powerful Analytics",
    description:
      "Get detailed insights and performance metrics to optimize your AI solutions.",
    icon: ChartBarIcon,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Secure & Scalable",
    description:
      "Enterprise-grade security with scalable infrastructure to grow with your needs.",
    icon: ShieldCheckIcon,
    gradient: "from-green-500 to-emerald-500",
  },
];

const stats = [
  { number: "10K+", label: "Active Users" },
  { number: "99.9%", label: "Uptime" },
  { number: "24/7", label: "Support" },
  { number: "50+", label: "Integrations" },
];

export default function Home() {
  return (
    <main className="min-h-screen w-full flex-1">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden min-h-screen w-full bg-gradient-to-br from-[#f8fsfc] via-[#e0e7ef] to-[#e3e8f7] flex flex-col lg:flex-row items-center justify-center animated-gradient-bg px-4 sm:px-8 py-8 gap-8 lg:gap-20">
        {/* Animated SVG wave background */}
        <svg className="pointer-events-none absolute top-0 left-0 w-full h-48 -z-10 animate-wave-move" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#e0e7ef" fillOpacity="0.7" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z" />
        </svg>
        {/* Cool animated blobs and glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] bg-blue-300 opacity-30 rounded-full filter blur-3xl animate-blob-slow z-0" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-purple-300 opacity-30 rounded-full filter blur-3xl animate-blob-slow2 z-0" />
        <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-radial from-yellow-200 via-transparent to-transparent opacity-40 blur-2xl z-0" />
        {/* Left side content */}
        <div className="w-full max-w-2xl lg:max-w-xl flex-shrink-0 lg:pt-8 flex flex-col justify-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 mb-6 animate-fade-in">
            <SparklesIcon className="w-4 h-4 mr-2" />
            AI-Powered Ecommerce Solutions
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 animate-fade-in-up">
            Transform Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ecommerce Business
            </span>{" "}
            with AI
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-[#0282D5] font-semibold animate-fade-in-up animation-delay-200">
            Empower. Automate. Accelerate.
          </p>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 text-gray-600 animate-fade-in-up animation-delay-400">
            Transform your ecommerce workflow with cutting-edge AI technology. Streamline processes, gain insights, and unlock new possibilities for your business.
          </p>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-in-up animation-delay-600">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.number}</div>
                <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up animation-delay-800">
            <Link
              href="/signup"
              className="group relative rounded-lg bg-gradient-to-r from-[#0282D5] to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full sm:w-auto text-center"
            >
              <span className="flex items-center justify-center">
                Get started
                <ArrowRightIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/login"
              className="group text-base font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors w-full sm:w-auto text-center"
            >
              Learn more{" "}
              <ArrowRightIcon className="inline w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        {/* Right side with Product Illustration or Card */}
        <div className="w-full flex items-center justify-center mt-8 lg:mt-0 lg:w-[600px] xl:w-[700px]">
          <div className="w-full h-[220px] sm:h-[280px] md:h-[320px] lg:h-[360px] xl:h-[400px] max-w-2xl bg-[#181F3C] rounded-2xl flex items-center justify-center shadow-xl p-8">
            <span className="text-2xl sm:text-4xl md:text-5xl font-bold text-yellow-400 text-center">WE'RE FULL</span>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="bg-gradient-to-br from-[#f8fafc] via-[#e0f2fe] to-[#f1f5f9] py-24 sm:py-32 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230282D5' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="mx-auto max-w-2xl lg:text-center">
            <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 mb-6">
              <RocketLaunchIcon className="w-4 h-4 mr-2" />
              Scale faster
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to scale your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ecommerce business
              </span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Get started with our intuitive platform and powerful features
              designed to help you succeed.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, idx) => (
                <div
                  key={feature.name}
                  className="group feature-card feature-card-animated-border flex flex-col items-center bg-white rounded-2xl shadow-md p-8 transition-transform duration-300 border border-transparent relative overflow-hidden"
                  style={{ zIndex: 1 }}
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 mb-2 z-10">
                    <span className={`icon-anim flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-500 bg-gradient-to-tr ${feature.gradient} group-hover:scale-110 group-hover:shadow-lg group-hover:from-pink-400 group-hover:to-blue-400 group-hover:animate-icon-bounce`}>
                      <feature.icon
                        className="h-8 w-8 flex-none text-white transition-all duration-500 group-hover:drop-shadow-lg group-hover:animate-icon-rotate"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-lg font-bold transition-colors duration-300 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-yellow-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:underline underline-offset-4 animate-underline">
                      {feature.name}
                    </span>
                  </dt>
                  <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-600 text-center z-10">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gradient-to-br from-[#181F3C] via-[#1a1f3c] to-[#1e1f3c] py-24 sm:py-32 relative overflow-hidden">
        {/* Background stars effect */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full bg-yellow-100/10 px-4 py-2 text-sm font-medium text-[#FEC20A] mb-6 border border-yellow-200/20">
              <StarIcon className="w-4 h-4 mr-2" />
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Choose the right plan for your{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                business
              </span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Start with our free trial and scale as you grow. No hidden fees,
              no commitments.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 sm:gap-x-6 lg:max-w-4xl lg:grid-cols-2">
            <PricingCard
              title="Free Trial"
              price="$0"
              period="/7 days"
              features={[
                <span key="f1" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Full access to all features</span>,
                <span key="f2" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />AI-powered insights</span>,
                <span key="f3" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Basic analytics</span>,
                <span key="f4" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Standard support</span>,
                <span key="f5" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Up to 100 queries/day</span>,
              ]}
              ctaText="Start Free Trial"
              ctaLink="/signup"
            />
            <div className="relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-[#FEC20A] to-orange-400 text-[#181F3C] px-6 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
                  Most Popular
                </span>
              </div>
              <PricingCard
                title="Pro Plan"
                price="$50"
                period="/month"
                highlighted={true}
                features={[
                  <span key="p1" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Everything in Free Trial</span>,
                  <span key="p2" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Advanced AI analytics</span>,
                  <span key="p3" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Unlimited queries</span>,
                  <span key="p4" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Priority support</span>,
                  <span key="p5" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />Custom integrations</span>,
                  <span key="p6" className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" />API access</span>,
                ]}
                ctaText="Get Started"
                ctaLink="/signup"
              />
            </div>
          </div>
          
          {/* Enterprise Contact */}
          <div className="mt-20 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Need a custom solution?
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <svg
                  className="w-5 h-5 text-[#FEC20A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:support@pacepivot.com"
                  className="hover:text-yellow-400 transition-colors"
                >
                  support@pacepivot.com
                </a>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <svg
                  className="w-5 h-5 text-[#FEC20A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href="tel:+919167612665"
                  className="hover:text-yellow-400 transition-colors"
                >
                  +91 91676 12665
                </a>
              </div>
            </div>
            <Link
              href="https://pacepivot.com/contact-us/"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-black bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              Contact Us
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Let's discuss how we can help your enterprise grow
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex flex-col justify-end bg-gradient-to-br from-[#FDCD3B] to-yellow-400 border-t border-black relative overflow-hidden">
        {/* Background pattern */}
       
        
        <footer className="w-full relative">
          <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Stay Tuned With Us */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Stay Tuned With Us
              </h2>
              <p className="text-base text-white/80 mb-2">
                Collaborate as a strategic extension of your team, empowering
                your brand to dominate the competitive landscape.
              </p>
              <form className="mt-8">
                <div className="flex rounded-full overflow-hidden bg-white max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    className="flex-1 rounded-none border-0 bg-white text-gray-900 focus:ring-0 focus:outline-none px-6 py-3"
                  />
                  <Button
                    type="submit"
                    className="rounded-none rounded-r-full bg-[#181F3C] hover:bg-[#181F3C]/90 text-white px-6 flex items-center justify-center transition duration-200"
                    tabIndex={-1}
                  >
                    <span className="sr-only">Submit</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </Button>
                </div>
                <div className="text-white text-sm mt-2">
                  *We never spam your email
                </div>
              </form>
            </div>
            
            {/* Quick Links */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Quick Links
              </h2>
              <ul className="space-y-2 text-white/80">
                <li>
                  <a href="#" className="hover:underline hover:text-white transition-colors">
                    Homepage
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-white transition-colors">
                    Our Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Office Info */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Head Office
              </h2>
              <div className="text-white/80 mb-6">
                446, 4th floor, Plot 21,
                <br />
                Panchratna, Opera House,
                <br />
                Girgaon, Mumbai - 400 004.
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Branch Office
              </h3>
              <div className="text-white/80 mb-6">
                eCradle Coworking Spaces, 1st Floor, Laxmi Towers, 5th Main,
                <br />
                Sector 7, HSR Layout, Bengaluru, Karnataka 560102
              </div>
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
                <a href="#" className="hover:underline hover:text-white transition-colors">
                  info@pacepivot.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13 1.05.37 2.06.72 3a2 2 0 0 1-.45 2.11L8.09 11.09a16 16 0 0 0 6.91 6.91l1.26-1.26a2 2 0 0 1 2.11-.45c.94.35 1.95.59 3 .72A2 2 0 0 1 22 16.92z" />
                </svg>
                <a href="#" className="hover:underline hover:text-white transition-colors">
                  +91 9167612665
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/30 mt-8">
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-4">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="bg-white/30 rounded-full p-2 hover:bg-white/50 transition-all duration-300 transform hover:scale-110"
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="YouTube"
                  className="bg-white/30 rounded-full p-2 hover:bg-white/50 transition-all duration-300 transform hover:scale-110"
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <polygon points="10 15 15 12 10 9 10 15" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="bg-white/30 rounded-full p-2 hover:bg-white/50 transition-all duration-300 transform hover:scale-110"
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <line x1="8" y1="11" x2="8" y2="16" />
                    <line x1="8" y1="8" x2="8" y2="8" />
                    <line x1="12" y1="16" x2="12" y2="11" />
                    <path d="M16 16v-3a2 2 0 0 0-4 0" />
                  </svg>
                </a>
              </div>
              <div className="text-white/80 text-sm text-center md:text-right">
                © {new Date().getFullYear()} Pace Pivot Private Limited. All
                rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

