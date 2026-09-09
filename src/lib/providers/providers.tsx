"use client"

import { QueryProvider } from './query-provider'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ErrorBoundary } from '@/components/error-boundary'
import { ToastProvider } from '@/components/ui/use-toast'
import { CurrencyProvider } from '@/lib/context/CurrencyContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <CurrencyProvider> 
            <ToastProvider>
              {children}
            </ToastProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
