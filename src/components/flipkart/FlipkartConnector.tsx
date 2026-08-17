'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Script from 'next/script'
import { AlertTriangle, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useConnectFlipkartAdvertising,
  useFlipkartAdvertisingStatus,
  useFlipkartAuthConfig,
} from '@/lib/hooks/queries/use-flipkart-advertising'

declare global {
  interface Window {
    FKOAuthClient?: new (config: {
      clientId: string
      redirectUri: string
      element: string
      onSuccess: (data: { code?: string; [key: string]: any }) => void
      onError: (error: any) => void
    }) => { init: () => void }
  }
}

const WRAPPER_ID = 'fkAdsLoginWrapper'

function safeOrigin(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

interface FlipkartConnectorProps {
  onRefresh?: () => Promise<void> | void
}

export function FlipkartConnector({ onRefresh }: FlipkartConnectorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const lastSeenTsRef = useRef(0)

  const { data: config, isLoading: configLoading, error: configError } = useFlipkartAuthConfig()
  const { data: status, refetch: refetchStatus } = useFlipkartAdvertisingStatus()
  const { mutate: connectFlipkart, isPending: isConnecting } = useConnectFlipkartAdvertising()

  const backendOrigin = useMemo(() => safeOrigin(config?.redirect_uri), [config?.redirect_uri])

  const handleCode = useCallback((code: string) => {
    setConnectError(null)
    connectFlipkart(
      { code },
      {
        onSuccess: async () => {
          await refetchStatus()
          await onRefresh?.()
        },
        onError: (error) => {
          console.error('Error connecting Flipkart Advertising:', error)
          setConnectError(`Failed to connect to Flipkart Advertising: ${error.message}`)
        },
      }
    )
  }, [connectFlipkart, refetchStatus, onRefresh])

  const handleOAuthResult = useCallback((payload: any) => {
    if (!payload || payload.source !== 'flipkart-oauth') return
    if (payload.ok && payload.code) {
      handleCode(payload.code)
    } else {
      setConnectError(payload.errorDescription || payload.error || 'Authorization failed')
    }
  }, [handleCode])

  // Primary channel: the callback page (served from the backend origin) posts here.
  useEffect(() => {
    if (!backendOrigin) return
    function onMessage(event: MessageEvent) {
      if (event.origin !== backendOrigin) return
      handleOAuthResult(event.data)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [backendOrigin, handleOAuthResult])

  // Fallback channel: some popup/browser configurations block postMessage to the opener.
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem('flipkart_oauth_result')
        if (!raw) return
        const payload = JSON.parse(raw)
        if (payload.ts && payload.ts > lastSeenTsRef.current) {
          lastSeenTsRef.current = payload.ts
          handleOAuthResult(payload)
        }
      } catch (e) {
        // ignore malformed entries
      }
    }, 800)
    return () => clearInterval(interval)
  }, [handleOAuthResult])

  // Render the SDK login button once both the script and backend config are ready
  useEffect(() => {
    if (!sdkReady || !config?.client_id || !config?.redirect_uri) return
    if (!wrapperRef.current || !window.FKOAuthClient) return
    wrapperRef.current.innerHTML = ''

    new window.FKOAuthClient({
      clientId: config.client_id,
      redirectUri: config.redirect_uri,
      element: WRAPPER_ID,
      onSuccess: (data) => {
        if (data?.code) handleCode(data.code)
      },
      onError: (error) => {
        console.error('Flipkart SDK error:', error)
        setConnectError('Flipkart authorization failed')
      },
    }).init()
  }, [sdkReady, config?.client_id, config?.redirect_uri, handleCode])

  const configUnavailable = !configLoading && (!!configError || !config?.client_id || !config?.redirect_uri)

  return (
    <div className="p-6 rounded-xl bg-white shadow-sm border border-gray-100">
      <Script
        src="https://static-assets-web.flixcart.com/fk-p-pegasus/oauth-client-sdk.0.0.4.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Flipkart Advertising</h3>
          <p className="text-gray-600 mb-4">
            Connect your Flipkart Advertising account to manage campaigns and track performance metrics.
          </p>

          {configUnavailable && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-md text-amber-900 text-sm">
              Flipkart connect isn&apos;t configured on the backend right now — please try again later.
            </div>
          )}

          {status?.connected ? (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Connected
            </div>
          ) : (
            <div id={WRAPPER_ID} ref={wrapperRef} className="min-h-[44px]">
              {(!sdkReady || configLoading) && !configUnavailable && (
                <Button disabled>Loading…</Button>
              )}
            </div>
          )}

          {isConnecting && <p className="text-sm text-gray-500 mt-2">Finishing connection…</p>}

          {connectError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-800 text-sm flex gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{connectError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}