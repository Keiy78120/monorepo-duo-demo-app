"use client";

import { create } from "zustand";

export interface StrainInfo {
  name: string;
  type: string | null;
  effects: string[] | null;
  flavors: string[] | null;
  description: string | null;
  rating: number | null;
}

interface CacheEntry {
  data: StrainInfo | null;
  expiresAt: number;
  loading: boolean;
  error: string | null;
}

interface StrainCacheState {
  cache: Map<string, CacheEntry>;
  getStrain: (name: string) => CacheEntry | undefined;
  setStrain: (name: string, data: StrainInfo | null, error?: string | null) => void;
  setLoading: (name: string, loading: boolean) => void;
  isExpired: (name: string) => boolean;
  fetchStrain: (name: string) => Promise<StrainInfo | null>;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function normalizeStrainName(name: string): string {
  return name.toLowerCase().trim();
}

export const useStrainCacheStore = create<StrainCacheState>((set, get) => ({
  cache: new Map(),

  getStrain: (name: string) => {
    const key = normalizeStrainName(name);
    return get().cache.get(key);
  },

  setStrain: (name: string, data: StrainInfo | null, error: string | null = null) => {
    const key = normalizeStrainName(name);
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.set(key, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
        loading: false,
        error,
      });
      return { cache: newCache };
    });
  },

  setLoading: (name: string, loading: boolean) => {
    const key = normalizeStrainName(name);
    set((state) => {
      const newCache = new Map(state.cache);
      const existing = newCache.get(key);
      newCache.set(key, {
        data: existing?.data ?? null,
        expiresAt: existing?.expiresAt ?? Date.now() + CACHE_TTL_MS,
        loading,
        error: existing?.error ?? null,
      });
      return { cache: newCache };
    });
  },

  isExpired: (name: string) => {
    const key = normalizeStrainName(name);
    const entry = get().cache.get(key);
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  },

  fetchStrain: async (name: string): Promise<StrainInfo | null> => {
    const { getStrain, isExpired, setLoading, setStrain } = get();
    const key = normalizeStrainName(name);

    // Check cache first
    const cached = getStrain(name);
    if (cached && !isExpired(name) && !cached.loading) {
      return cached.data;
    }

    // Already loading
    if (cached?.loading) {
      // Wait for existing request
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const entry = getStrain(name);
          if (entry && !entry.loading) {
            clearInterval(checkInterval);
            resolve(entry.data);
          }
        }, 100);
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 10000);
      });
    }

    // Start loading
    setLoading(name, true);

    try {
      const response = await fetch(`/api/strains/${encodeURIComponent(name)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch strain: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.name) {
        const strainInfo: StrainInfo = {
          name: data.name,
          type: data.type ?? null,
          effects: data.effects ?? null,
          flavors: data.flavors ?? null,
          description: data.description ?? null,
          rating: data.rating ?? null,
        };
        setStrain(name, strainInfo);
        return strainInfo;
      }

      // No data found
      setStrain(name, null);
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setStrain(name, null, errorMessage);
      return null;
    }
  },
}));

// Hook for easy usage in components
export function useStrainInfo(strainName: string | null | undefined) {
  const fetchStrain = useStrainCacheStore((state) => state.fetchStrain);
  const getStrain = useStrainCacheStore((state) => state.getStrain);
  const isExpired = useStrainCacheStore((state) => state.isExpired);

  const [strainInfo, setStrainInfo] = React.useState<StrainInfo | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!strainName) {
      setStrainInfo(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = getStrain(strainName);
    if (cached && !isExpired(strainName)) {
      setStrainInfo(cached.data);
      setLoading(cached.loading);
      setError(cached.error);

      if (!cached.loading && cached.data) {
        return;
      }
    }

    // Fetch if not cached or expired
    setLoading(true);
    fetchStrain(strainName)
      .then((data) => {
        setStrainInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [strainName, fetchStrain, getStrain, isExpired]);

  return { strainInfo, loading, error };
}

// Need to import React for the hook
import * as React from "react";
