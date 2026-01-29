import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DataType = 'strains' | 'clients' | 'orders' | 'sales' | 'clientsSummary' | 'salesSummary';
export type Environment = 'production' | 'staging' | 'railway';

export interface ComparisonResult {
  environment: Environment;
  environmentName: string;
  dataType: DataType;
  apiUrl: string;
  status: number;
  success: boolean;
  responseTime: number;
  itemCount: number;
  data: unknown[];
  summary?: {
    PENDING?: number;
    VERIFIED?: number;
    REJECTED?: number;
    ONGOING?: number;
    LEADS?: number;
    CLOSED?: number;
    totalCount?: number;
  };
  rawResponse: unknown;
  error?: string;
}

export interface EnvironmentState {
  data: ComparisonResult | null;
  loading: boolean;
  error: string | null;
}

export interface ComparisonState {
  production: EnvironmentState;
  staging: EnvironmentState;
  lastUpdated: Date | null;
}

export interface StrainItem {
  id: string;
  sku?: string;
  name: string;
  thcContent?: number;
  cbdContent?: number;
  retailPrice?: number;
  availability?: boolean;
}

export interface ClientItem {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isKYCVerified?: boolean;
  adminApproval?: string;
}

export interface OrderItem {
  id: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  createdAt?: string;
}

export interface SalesItem {
  id: string;
  stage: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StrainDiff {
  id: string;
  sku?: string;
  name: string;
  production?: StrainItem;
  staging?: StrainItem;
  hasDiff: boolean;
  diffs: string[];
}

const initialEnvState: EnvironmentState = {
  data: null,
  loading: false,
  error: null,
};

export function useApiComparison() {
  const [state, setState] = useState<ComparisonState>({
    production: initialEnvState,
    staging: initialEnvState,
    lastUpdated: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [stagingEnvironment, setStagingEnvironment] = useState<'staging' | 'railway'>('staging');

  const fetchFromEnvironment = useCallback(async (
    environment: Environment,
    dataType: DataType,
    countryCode = 'ZAF',
    stage?: 'LEADS' | 'ONGOING' | 'CLOSED'
  ): Promise<ComparisonResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('drgreen-comparison', {
        body: { environment, dataType, countryCode, stage },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as ComparisonResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        environment,
        environmentName: environment === 'production' ? 'Production' : environment === 'staging' ? 'Staging (Official)' : 'Railway (Dev)',
        dataType,
        apiUrl: '',
        status: 0,
        success: false,
        responseTime: 0,
        itemCount: 0,
        data: [],
        rawResponse: null,
        error: message,
      };
    }
  }, []);

  const fetchComparison = useCallback(async (
    dataType: DataType,
    countryCode = 'ZAF',
    stage?: 'LEADS' | 'ONGOING' | 'CLOSED'
  ) => {
    // Debounce: prevent refresh within 5 seconds
    const now = Date.now();
    if (now - lastRefreshTime < 5000) {
      return;
    }
    setLastRefreshTime(now);
    setIsRefreshing(true);

    // Set loading states
    setState(prev => ({
      ...prev,
      production: { ...prev.production, loading: true, error: null },
      staging: { ...prev.staging, loading: true, error: null },
    }));

    // Fetch from both environments in parallel
    const [prodResult, stagingResult] = await Promise.all([
      fetchFromEnvironment('production', dataType, countryCode, stage),
      fetchFromEnvironment(stagingEnvironment, dataType, countryCode, stage),
    ]);

    setState({
      production: {
        data: prodResult,
        loading: false,
        error: prodResult?.error || null,
      },
      staging: {
        data: stagingResult,
        loading: false,
        error: stagingResult?.error || null,
      },
      lastUpdated: new Date(),
    });

    setIsRefreshing(false);
  }, [fetchFromEnvironment, lastRefreshTime, stagingEnvironment]);

  const calculateStrainDiffs = useCallback((
    prodData: unknown[],
    stagingData: unknown[]
  ): StrainDiff[] => {
    const prodMap = new Map<string, StrainItem>();
    const stagingMap = new Map<string, StrainItem>();

    // Build maps using SKU or ID as key
    (prodData as StrainItem[]).forEach(item => {
      const key = item.sku || item.id;
      prodMap.set(key, item);
    });

    (stagingData as StrainItem[]).forEach(item => {
      const key = item.sku || item.id;
      stagingMap.set(key, item);
    });

    const allKeys = new Set([...prodMap.keys(), ...stagingMap.keys()]);
    const diffs: StrainDiff[] = [];

    allKeys.forEach(key => {
      const prod = prodMap.get(key);
      const staging = stagingMap.get(key);
      const diffList: string[] = [];

      if (!prod) {
        diffList.push('Missing in Production');
      } else if (!staging) {
        diffList.push('Missing in Staging');
      } else {
        // Compare fields
        if (prod.retailPrice !== staging.retailPrice) {
          const priceDiff = Math.abs((prod.retailPrice || 0) - (staging.retailPrice || 0));
          const percentDiff = prod.retailPrice ? (priceDiff / prod.retailPrice) * 100 : 0;
          if (percentDiff > 5) {
            diffList.push(`Price diff: ${percentDiff.toFixed(1)}%`);
          }
        }
        if (prod.thcContent !== staging.thcContent) {
          diffList.push('THC differs');
        }
        if (prod.cbdContent !== staging.cbdContent) {
          diffList.push('CBD differs');
        }
        if (prod.availability !== staging.availability) {
          diffList.push('Availability differs');
        }
      }

      diffs.push({
        id: key,
        sku: prod?.sku || staging?.sku,
        name: prod?.name || staging?.name || key,
        production: prod,
        staging: staging,
        hasDiff: diffList.length > 0,
        diffs: diffList,
      });
    });

    return diffs.sort((a, b) => {
      // Sort: items with diffs first
      if (a.hasDiff !== b.hasDiff) return a.hasDiff ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  const getDiffCount = useCallback(() => {
    const prodData = state.production.data?.data || [];
    const stagingData = state.staging.data?.data || [];
    const diffs = calculateStrainDiffs(prodData, stagingData);
    return diffs.filter(d => d.hasDiff).length;
  }, [state, calculateStrainDiffs]);

  return {
    state,
    isRefreshing,
    stagingEnvironment,
    setStagingEnvironment,
    fetchComparison,
    calculateStrainDiffs,
    getDiffCount,
  };
}
