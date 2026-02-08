import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ApiEnvironment = 'production' | 'alt-production' | 'staging' | 'railway' | 'production-write';

interface ApiEnvironmentContextType {
  environment: ApiEnvironment;
  setEnvironment: (env: ApiEnvironment) => void;
  environmentLabel: string;
}

const ENVIRONMENT_LABELS: Record<ApiEnvironment, string> = {
  production: 'Production',
  'alt-production': 'Alt Production (Test)',
  staging: 'Staging (Official)',
  railway: 'Railway (Dev)',
  'production-write': 'Production (Write)',
};

const ApiEnvironmentContext = createContext<ApiEnvironmentContextType | undefined>(undefined);

const STORAGE_KEY = 'hb-api-environment';

export function ApiEnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironmentState] = useState<ApiEnvironment>(() => {
    // Load from localStorage on init (default to production)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['production', 'alt-production', 'staging', 'railway', 'production-write'].includes(stored)) {
        return stored as ApiEnvironment;
      }
    }
    return 'production';
  });

  const setEnvironment = (env: ApiEnvironment) => {
    setEnvironmentState(env);
    localStorage.setItem(STORAGE_KEY, env);
  };

  useEffect(() => {
    // Ensure localStorage is synced
    localStorage.setItem(STORAGE_KEY, environment);
  }, [environment]);

  const value: ApiEnvironmentContextType = {
    environment,
    setEnvironment,
    environmentLabel: ENVIRONMENT_LABELS[environment],
  };

  return (
    <ApiEnvironmentContext.Provider value={value}>
      {children}
    </ApiEnvironmentContext.Provider>
  );
}

export function useApiEnvironment() {
  const context = useContext(ApiEnvironmentContext);
  if (context === undefined) {
    throw new Error('useApiEnvironment must be used within an ApiEnvironmentProvider');
  }
  return context;
}
