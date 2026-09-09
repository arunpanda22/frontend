// Path: src/app/layout.tsx
// Purpose: Root layout that wraps all pages
// TODO: Add production metadata
// Path: src/app/layout.tsx
// Purpose: Root layout that wraps all pages
// TODO: Add production metadata
import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Providers } from '@/lib/providers/providers'
import { LayoutWrapper } from '@/components/layout/layout-wrapper'
import { inter, montserrat } from './fonts'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pacepivot AI',
  description: 'Scale your Amazon ads profitably with Janus—an intelligent PPC engine designed to boost revenue, control ACoS, and automate campaign decisions at scale.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const topOffset = 'top-16'
  const heightCalc = 'h-[calc(100vh-4rem)]'

  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body className={inter.className}>
        <Providers>
          <div className={`min-h-screen  flex flex-col`}>
            <Navbar />
            <main className={`flex-grow`}>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}