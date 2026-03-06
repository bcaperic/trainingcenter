import { useState, useEffect, useCallback } from "react";
import api from "../lib/api-client";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(url: string | null, deps: any[] = []): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<T>(url);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export async function apiPost<T = any>(url: string, body?: any): Promise<T> {
  const res = await api.post<T>(url, body);
  return res.data;
}

export async function apiPut<T = any>(url: string, body?: any): Promise<T> {
  const res = await api.put<T>(url, body);
  return res.data;
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await api.delete<T>(url);
  return res.data;
}
