"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CurrencyContextType, CurrencyData, CurrencyInfo } from '../api/types';
import { currencyService } from '../api/services/currency.service';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
  defaultMarketplace?: string; // Optional default marketplace ID
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ 
  children, 
  defaultMarketplace 
}) => {
  const [currencies, setCurrencies] = useState<CurrencyData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get primary currency (first marketplace or specified default)
  const primaryCurrency: CurrencyInfo | null = React.useMemo(() => {
    if (Object.keys(currencies).length === 0) return null;
    
    const targetMarketplace = defaultMarketplace || Object.keys(currencies)[0];
    return currencies[targetMarketplace]?.currency_info || null;
  }, [currencies, defaultMarketplace]);

  // Fetch currencies from API
  const fetchCurrencies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await currencyService.getUserMarketplaceCurrencies();
      setCurrencies(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch currencies';
      setError(errorMessage);
      console.error('Currency fetch error:', err);
      
      // Fallback to default currency if API fails
      setCurrencies({
        'default': {
          currency_code: 'USD',
          currency_info: {
            symbol: '$',
            name: 'US Dollar',
            position: 'before'
          }
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize currencies on mount
  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  // Format currency with proper symbol and position
  const formatCurrency = useCallback((value: number, marketplaceId?: string): string => {
    if (isNaN(value) || value === null || value === undefined) return '0';
    
    const targetMarketplace = marketplaceId || defaultMarketplace || Object.keys(currencies)[0];
    const currencyInfo = currencies[targetMarketplace]?.currency_info || primaryCurrency;
    
    if (!currencyInfo) {
      // Fallback formatting
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }

    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));

    const sign = value < 0 ? '-' : '';
    const { symbol, position } = currencyInfo;

    if (position === 'after') {
      return `${sign}${formattedNumber}${symbol}`;
    } else {
      return `${sign}${symbol}${formattedNumber}`;
    }
  }, [currencies, primaryCurrency, defaultMarketplace]);

  // Other formatting utilities (unchanged but centralized)
  const formatNumber = useCallback((value: number): string => {
    if (isNaN(value) || value === null || value === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  }, []);

  const formatPercentage = useCallback((value: number): string => {
    if (isNaN(value) || value === null || value === undefined) return '0%';
    return `${value.toFixed(1)}%`;
  }, []);

  const formatChange = useCallback((change: number, suffix: string = "%"): string => {
    if (isNaN(change) || change === null || change === undefined) return '0%';
    const absChange = Math.abs(change);
    const sign = change >= 0 ? "+" : "-";
    return `${sign}${absChange.toFixed(1)}${suffix}`;
  }, []);

  const contextValue: CurrencyContextType = {
    currencies,
    isLoading,
    error,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatChange,
    primaryCurrency,
    refetchCurrencies: fetchCurrencies,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};