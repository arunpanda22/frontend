// hooks/useRealtimeOrders.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { getJWTAccessToken, isImpersonating } from '../api/config';


// Types
export interface Order {
  AmazonOrderId: string;
  seller_id: string;
  seller_sku: string;
  EventTime: string | null;
  PurchaseDate: string | null;
  OrderStatus: string | null;
  FulfillmentType: string | null;
  OrderType: string | null;
  ChangeReason: string | null;
  MarketplaceId: string | null;
  Canceled: number;
  Shipped: number;
  Pending: number;
  Unshipped: number;
  product_name: string;
  product_image: string | null;
  product_price: number;
  product_asin: string;
  quantity: number;
}

export interface DailyMetrics {
  revenue: number;
  orders: number;
  units: number;
  asp: number;
  cancelled: number;
  date: string;
  last_updated: string;
}

export interface TopProduct {
  seller_sku: string;
  revenue: number;
  units: number;
  orders: number;
  asp: number;
  product_name: string;
  asin: string;
  image_url: string | null;
  price: number;
  fulfillment_channel: string | null;
}

export interface HourlyDataPoint {
  hour: number;
  count: number;
  timestamp: string;
  label: string;
}

export interface HourlyOrders {
  today: HourlyDataPoint[];
  yesterday: HourlyDataPoint[];
  day_before_yesterday: HourlyDataPoint[];
  metadata: {
    today_date: string;
    yesterday_date: string;
    day_before_date: string;
    total_today: number;
    total_yesterday: number;
    total_day_before: number;
    last_updated: string;
  };
}

export interface Metrics {
  daily: DailyMetrics;
  top_products: TopProduct[];
  hourly_orders: HourlyOrders;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseRealtimeOrdersOptions {
  sellerId: string;
  wsUrl?: string;
  reconnectInterval?: number;
  maxOrders?: number;
  enabled?: boolean;
}

interface UseRealtimeOrdersReturn {
  orders: Order[];
  metrics: Metrics | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isAuthError: boolean;
  refreshMetrics: () => void;
  reconnect: () => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const getWebSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  return isDevelopment ? "ws://localhost:8000" : "wss://api.pacepivot.com";
};

export const WS_BASE_URL = getWebSocketUrl();

// Get authentication token (Firebase or JWT)
async function getAuthToken(): Promise<string | null> {
  try {
    // Check if impersonating (use JWT)
    if (isImpersonating()) {
      const jwtToken = getJWTAccessToken();
      if (jwtToken) {
        if (isDevelopment) console.log('🔑 Using JWT token for WebSocket');
        return jwtToken;
      }
    }
    
    // Use Firebase token
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (isDevelopment) console.log('🔑 Using Firebase token for WebSocket');
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export function useRealtimeOrders({
  sellerId,
  wsUrl = WS_BASE_URL,
  reconnectInterval = 5000,
  maxOrders = 100,
  enabled = true,
}: UseRealtimeOrdersOptions): UseRealtimeOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalCloseRef = useRef(false);
  const isMountedRef = useRef(true);
  const currentTokenRef = useRef<string | null>(null);

  const sendMessage = useCallback((message: { type: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (err) {
        console.error('Error sending message:', err);
        return false;
      }
    }
    return false;
  }, []);

  const refreshMetrics = useCallback(() => {
    sendMessage({ type: 'refresh_metrics' });
  }, [sendMessage]);

  const mergeOrders = useCallback((existingOrders: Order[], newOrders: Order[]): Order[] => {
    const orderMap = new Map<string, Order>();
    
    existingOrders.forEach(order => {
      const key = `${order.AmazonOrderId}:${order.seller_sku}`;
      orderMap.set(key, order);
    });
    
    newOrders.forEach(order => {
      const key = `${order.AmazonOrderId}:${order.seller_sku}`;
      orderMap.set(key, order);
    });
    
    return Array.from(orderMap.values())
      .sort((a, b) => {
        const dateA = a.EventTime ? new Date(a.EventTime).getTime() : 0;
        const dateB = b.EventTime ? new Date(b.EventTime).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, maxOrders);
  }, [maxOrders]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'initial_state':
          setOrders(message.data.slice(0, maxOrders));
          setMetrics(message.metrics);
          setIsLoading(false);
          setError(null);
          setIsAuthError(false);
          reconnectAttemptsRef.current = 0;
          if (isDevelopment) console.log(`✅ Received initial state: ${message.count} orders`);
          break;

        case 'batch_update':
          setOrders(prev => mergeOrders(prev, message.order_items));
          if (message.metrics) {
            setMetrics(message.metrics);
          }
          if (isDevelopment) console.log(`📦 Batch update: ${message.count} items`);
          break;

        case 'metrics_refresh':
          setMetrics(message.metrics);
          if (isDevelopment) console.log('📊 Metrics refreshed');
          break;

        case 'ping':
          sendMessage({ type: 'pong' });
          break;

        case 'pong':
          break;

        case 'error':
          setError(message.message);
          console.error('❌ WebSocket error:', message.message);
          break;

        default:
          console.warn('⚠️ Unknown message type:', message);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, [mergeOrders, maxOrders, sendMessage]);

  const connect = useCallback(async () => {
    // Don't connect if not enabled, no seller, or unmounted
    if (!enabled || !sellerId || !isMountedRef.current) {
      return;
    }

    // Don't create duplicate connections
    if (wsRef.current && 
        (wsRef.current.readyState === WebSocket.OPEN || 
         wsRef.current.readyState === WebSocket.CONNECTING)) {
      if (isDevelopment) console.log('⏭️ WebSocket already connected/connecting');
      return;
    }

    try {
      // Get authentication token
      const token = await getAuthToken();
      
      if (!token) {
        console.error('❌ No authentication token available');
        setError('Authentication required');
        setIsAuthError(true);
        setIsLoading(false);
        return;
      }

      // Store current token
      currentTokenRef.current = token;

      // Clean up existing connection
      if (wsRef.current) {
        isIntentionalCloseRef.current = true;
        wsRef.current.close();
      }

      // Build WebSocket URL with token
      const url = `${wsUrl}/ws/orders/${sellerId}/?token=${token}`;
      if (isDevelopment) console.log('🔌 Connecting to:', url.replace(token, 'TOKEN'));
      
      const ws = new WebSocket(url);
      wsRef.current = ws;
      isIntentionalCloseRef.current = false;

      ws.onopen = () => {
        if (isDevelopment) console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        setIsAuthError(false);
        setIsLoading(false);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
      };

      ws.onclose = async (event) => {
        if (isDevelopment) console.log(`🔌 WebSocket closed: ${event.code}`);
        setIsConnected(false);

        // Don't reconnect if unmounted or intentional
        if (!isMountedRef.current || isIntentionalCloseRef.current) {
          return;
        }

        // Handle auth errors
        if (event.code === 4001) {
          console.warn('⚠️ WebSocket closed: Unauthorized (token invalid/expired)');
          setError('Authentication failed. Refreshing...');
          setIsAuthError(true);
          
          // Try to refresh token and reconnect
          if (reconnectAttemptsRef.current < 3) {
            reconnectAttemptsRef.current += 1;
            if (isDevelopment) console.log('🔄 Attempting to refresh token and reconnect...');
            setTimeout(() => connect(), 2000);
          } else {
            setError('Authentication failed. Please refresh the page.');
          }
          return;
        }

        // Handle other close codes
        if (event.code === 4002) {
          setError('Invalid seller ID');
          return;
        }

        if (event.code === 4003) {
          setError('Access denied to this seller');
          setIsAuthError(true);
          return;
        }

        // Normal reconnection logic
        if (enabled && reconnectAttemptsRef.current < 10) {
          const delay = Math.min(
            reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current),
            30000
          );
          
          setError(`Connection lost. Reconnecting in ${Math.round(delay/1000)}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else {
          setError('Failed to connect. Please refresh the page.');
          setIsLoading(false);
        }
      };
    } catch (err) {
      console.error('❌ Error creating WebSocket:', err);
      setError('Failed to establish connection');
      setIsAuthError(true);
      setIsLoading(false);
    }
  }, [enabled, sellerId, wsUrl, reconnectInterval, handleMessage]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setError(null);
    setIsAuthError(false);
    setIsLoading(true);
    connect();
  }, [connect]);

  // Handle page visibility (don't reconnect on hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isConnected && enabled && sellerId && isMountedRef.current) {
        if (isDevelopment) console.log('👁️ Page visible, reconnecting...');
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, enabled, sellerId, reconnect]);

  // Initial connection
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && sellerId) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [enabled, sellerId]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isIntentionalCloseRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, []);

  return {
    orders,
    metrics,
    isConnected,
    isLoading,
    error,
    isAuthError,
    refreshMetrics,
    reconnect,
  };
}