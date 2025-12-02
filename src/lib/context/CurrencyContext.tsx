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

  const error = queryError?.message || null;

  const primaryCurrency: CurrencyInfo | null = useMemo(() => {
    if (Object.keys(currencies).length === 0) return null;
    const targetMarketplace = defaultMarketplace || Object.keys(currencies)[0];
    return currencies[targetMarketplace]?.currency_info || null;
  }, [currencies, defaultMarketplace]);

  const refetchCurrencies = useCallback(async (): Promise<void> => {
    try {
      await refetch();
    } catch (err) {
      console.error('Currency refetch error:', err);
    }
  }, [refetch]);

  const invalidateAndRefetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['marketplace-currencies'] });
  }, [queryClient]);

  /** 💲 Formatter with decimals - returns plain number */
  const formatCurrency = useCallback((value: number, marketplaceId?: string): string => {
    if (isNaN(value) || value === null || value === undefined) return '0.00';
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value);
  }, []);

  const getCurrencySymbol = useCallback((marketplaceId?: string): string => {
    const targetMarketplace =
      marketplaceId || defaultMarketplace || Object.keys(currencies)[0];

    const currencyInfo =
      currencies[targetMarketplace]?.currency_info || primaryCurrency;

    return currencyInfo?.symbol ?? '$';
  }, [currencies, primaryCurrency, defaultMarketplace]);

  /** 💲 Currency without decimals - returns plain number */
  const formatCurrencyNoDecimal = useCallback((value: number, marketplaceId?: string): string => {
    if (isNaN(value) || value === null || value === undefined) return '0';
    
    return new Intl.NumberFormat('en-US', {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  /** 123,456 — plain number */
  const formatNumber = useCallback((value: number): string => {
    if (isNaN(value) || value === null || value === undefined) return '0';
    return new Intl.NumberFormat('en-US', {
      useGrouping: true,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  /** 123,456.78 — plain number with 2 decimals */
  const formatNumberWithDecimals = useCallback((value: number): string => {
    if (isNaN(value) || value === null || value === undefined) return '0.00';
    return new Intl.NumberFormat('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  /** 45.67 - returns number without % symbol */
  const formatPercentage = useCallback((value: number): string => {
    if (isNaN(value) || value === null || value === undefined) return '0';
    return value.toFixed(2);
  }, []);

  const formatPercentageNoDecimal = useCallback((value: number): number => {
    if (isNaN(value) || value === null || value === undefined) return 0;
    return Math.round(value);
  }, []);

  /** +5.3 / -2.1 - returns signed number without % symbol */
  const formatChange = useCallback((change: number, suffix: string = ""): string => {
    if (isNaN(change) || change === null || change === undefined) return '0';
    const absChange = Math.abs(change);
    const sign = change >= 0 ? "+" : "-";
    return `${sign}${absChange.toFixed(1)}${suffix}`;
  }, []);

  const contextValue: CurrencyContextType = {
    currencies,
    isLoading,
    error,
    formatCurrency,
    getCurrencySymbol,
    formatCurrencyNoDecimal,
    formatNumber,
    formatNumberWithDecimals,
    formatPercentage,
    formatPercentageNoDecimal,
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