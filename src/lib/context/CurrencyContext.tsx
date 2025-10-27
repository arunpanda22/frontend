"use client";
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CurrencyContextType, CurrencyData, CurrencyInfo } from '../api/types';
import { useMarketplaceCurrencies } from '../hooks/queries/use-currencies';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
  defaultMarketplace?: string; // Optional default marketplace ID
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ 
  children, 
  defaultMarketplace 
}) => {
  const queryClient = useQueryClient();
  
  // Use React Query hook for currency data
  const { 
    data: currencies = {}, 
    isLoading, 
    error: queryError,
    refetch
  } = useMarketplaceCurrencies({ defaultMarketplace });

  // Convert React Query error to string
  const error = queryError?.message || null;

  // Get primary currency (first marketplace or specified default)
  const primaryCurrency: CurrencyInfo | null = useMemo(() => {
    if (Object.keys(currencies).length === 0) return null;
    
    const targetMarketplace = defaultMarketplace || Object.keys(currencies)[0];
    return currencies[targetMarketplace]?.currency_info || null;
  }, [currencies, defaultMarketplace]);

  // Refetch function that works with React Query
  const refetchCurrencies = useCallback(async (): Promise<void> => {
    try {
      await refetch();
    } catch (err) {
      console.error('Currency refetch error:', err);
      // Error is already handled by React Query
    }
  }, [refetch]);

  // Invalidate and refetch currencies (useful for manual refresh)
  const invalidateAndRefetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['marketplace-currencies'] });
  }, [queryClient]);

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
    return `${value.toFixed(2)}%`;
  }, []);

  const formatChange = useCallback((change: number, suffix: string = "%"): string => {
    if (isNaN(change) || change === null || change === undefined) return '0%';
    const absChange = Math.abs(change);
    const sign = change >= 0 ? "+" : "-";
    return `${sign}${absChange.toFixed(1)}${suffix}`;
  }, []);

  const contextValue: CurrencyContextType = {
    currencies: currencies,
    isLoading,
    error,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatChange,
    primaryCurrency,
    refetchCurrencies,
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