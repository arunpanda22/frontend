// hooks/useRealtimeOrders.ts - Fixed for React StrictMode

import { useState, useEffect, useCallback, useRef } from 'react';

// [All your existing type definitions stay the same]
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
  refreshMetrics: () => void;
  reconnect: () => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const getWebSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (isDevelopment) {
    return "ws://localhost:8000";
  }
  return "wss://api.pacepivot.com";
};

export const WS_BASE_URL = getWebSocketUrl();

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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalCloseRef = useRef(false);
  const isMountedRef = useRef(true); // NEW: Track if component is mounted

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
          reconnectAttemptsRef.current = 0;
          console.log(`Received initial state: ${message.count} orders`);
          break;

        case 'batch_update':
          setOrders(prev => mergeOrders(prev, message.order_items));
          if (message.metrics) {
            setMetrics(message.metrics);
          }
          console.log(`Received batch update: ${message.count} order items`);
          break;

        case 'metrics_refresh':
          setMetrics(message.metrics);
          console.log('Metrics refreshed');
          break;

        case 'ping':
          sendMessage({ type: 'pong' });
          break;

        case 'pong':
          console.debug('Received pong from server');
          break;

        case 'error':
          setError(message.message);
          console.error('WebSocket error message:', message.message);
          break;

        default:
          console.warn('Unknown message type:', message);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
      setError('Failed to parse server message');
    }
  }, [mergeOrders, maxOrders, sendMessage]);

  const connect = useCallback(() => {
    // CRITICAL: Don't connect if already connected or component unmounted
    if (!enabled || !sellerId || !isMountedRef.current) {
      return;
    }

    // CRITICAL: Don't create a new connection if one exists and is open
    if (wsRef.current && 
        (wsRef.current.readyState === WebSocket.OPEN || 
         wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting, skipping...');
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      isIntentionalCloseRef.current = true;
      wsRef.current.close();
    }

    try {
      const url = `${wsUrl}/ws/orders/${sellerId}/`;
      console.log('Connecting to WebSocket:', url);
      
      const ws = new WebSocket(url);
      wsRef.current = ws;
      isIntentionalCloseRef.current = false;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        setIsLoading(false);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);

        // Don't reconnect if component is unmounted or it was intentional
        if (!isMountedRef.current || isIntentionalCloseRef.current) {
          console.log('Not reconnecting - component unmounted or intentional close');
          return;
        }

        // Handle specific close codes
        if (event.code === 4002) {
          console.error('Connection closed: Invalid seller ID');
          setError('Invalid seller ID');
          return;
        }

        // Attempt to reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < 10) {
          const delay = Math.min(
            reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current),
            30000
          );
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          setError(`Connection lost. Reconnecting in ${Math.round(delay/1000)}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= 10) {
          setError('Failed to connect after multiple attempts. Please refresh the page.');
          setIsLoading(false);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to establish connection');
      setIsLoading(false);
    }
  }, [enabled, sellerId, wsUrl, reconnectInterval, handleMessage]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setError(null);
    setIsLoading(true);
    connect();
  }, [connect]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden - connection maintained by server pings');
      } else {
        console.log('Page visible');
        if (!isConnected && enabled && sellerId && isMountedRef.current) {
          console.log('Reconnecting after page became visible');
          reconnect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, enabled, sellerId, reconnect]);

  // CRITICAL: Single connection effect
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && sellerId) {
      // Small delay to prevent double mounting in StrictMode
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [enabled, sellerId]); // CRITICAL: Only depend on these, not 'connect'

  // CRITICAL: Cleanup effect
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
  }, []); // Empty deps - only run on mount/unmount

  return {
    orders,
    metrics,
    isConnected,
    isLoading,
    error,
    refreshMetrics,
    reconnect,
  };
}