// Obľúbené inštrumenty a cenové alerty (localStorage).
import { useCallback, useEffect, useState } from "react";

const FAV_KEY = "ta-favorites";
const ALERT_KEY = "ta-alerts";

export type PriceAlert = {
  id: string;
  instrumentId: string;
  label: string;
  yahoo: string;
  direction: "above" | "below";
  price: number;
  triggeredAt?: string;
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(read<string[]>(FAV_KEY, []));
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, toggle };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    setAlerts(read<PriceAlert[]>(ALERT_KEY, []));
  }, []);

  const persist = useCallback((next: PriceAlert[]) => {
    setAlerts(next);
    localStorage.setItem(ALERT_KEY, JSON.stringify(next));
    return next;
  }, []);

  const add = useCallback(
    (alert: Omit<PriceAlert, "id">) =>
      setAlerts((prev) => {
        const next = [...prev, { ...alert, id: crypto.randomUUID() }];
        localStorage.setItem(ALERT_KEY, JSON.stringify(next));
        return next;
      }),
    [],
  );

  const remove = useCallback(
    (id: string) =>
      setAlerts((prev) => {
        const next = prev.filter((a) => a.id !== id);
        localStorage.setItem(ALERT_KEY, JSON.stringify(next));
        return next;
      }),
    [],
  );

  const markTriggered = useCallback(
    (ids: string[]) =>
      setAlerts((prev) => {
        const stamp = new Date().toISOString();
        const next = prev.map((a) => (ids.includes(a.id) ? { ...a, triggeredAt: stamp } : a));
        localStorage.setItem(ALERT_KEY, JSON.stringify(next));
        return next;
      }),
    [],
  );

  return { alerts, add, remove, markTriggered, persist };
}
