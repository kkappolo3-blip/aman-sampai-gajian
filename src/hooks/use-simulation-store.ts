import { useCallback, useEffect, useState } from "react";
import { Bill, Simulation, todayISO, addDaysISO, uid } from "@/lib/budget";

const KEY = "asg.store.v1";

type Store = {
  current: Simulation;
  history: Simulation[];
};

const blank = (): Simulation => ({
  id: uid(),
  name: "Simulasi Baru",
  income: 0,
  incomeDate: todayISO(),
  endDate: addDaysISO(todayISO(), 29),
  bills: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const load = (): Store => {
  if (typeof window === "undefined") return { current: blank(), history: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { current: blank(), history: [] };
    const parsed = JSON.parse(raw) as Store;
    if (!parsed.current) parsed.current = blank();
    if (!Array.isArray(parsed.history)) parsed.history = [];
    return parsed;
  } catch {
    return { current: blank(), history: [] };
  }
};

export function useSimulationStore() {
  const [store, setStore] = useState<Store>(() => ({ current: blank(), history: [] }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* ignore */ }
  }, [store, hydrated]);

  const updateCurrent = useCallback((patch: Partial<Simulation>) => {
    setStore((s) => ({ ...s, current: { ...s.current, ...patch, updatedAt: new Date().toISOString() } }));
  }, []);

  const addBill = useCallback((bill: Omit<Bill, "id">) => {
    setStore((s) => ({
      ...s,
      current: {
        ...s.current,
        bills: [...s.current.bills, { ...bill, id: uid() }],
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const updateBill = useCallback((id: string, patch: Partial<Bill>) => {
    setStore((s) => ({
      ...s,
      current: {
        ...s.current,
        bills: s.current.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const removeBill = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      current: {
        ...s.current,
        bills: s.current.bills.filter((b) => b.id !== id),
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const duplicateBill = useCallback((id: string) => {
    setStore((s) => {
      const found = s.current.bills.find((b) => b.id === id);
      if (!found) return s;
      const copy: Bill = { ...found, id: uid(), name: `${found.name} (salinan)` };
      const idx = s.current.bills.findIndex((b) => b.id === id);
      const next = [...s.current.bills];
      next.splice(idx + 1, 0, copy);
      return { ...s, current: { ...s.current, bills: next, updatedAt: new Date().toISOString() } };
    });
  }, []);

  const saveToHistory = useCallback(() => {
    setStore((s) => {
      const snapshot: Simulation = { ...s.current, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      return { ...s, history: [snapshot, ...s.history].slice(0, 30) };
    });
  }, []);

  const loadFromHistory = useCallback((id: string) => {
    setStore((s) => {
      const found = s.history.find((h) => h.id === id);
      if (!found) return s;
      return { ...s, current: { ...found, id: uid(), updatedAt: new Date().toISOString() } };
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setStore((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));
  }, []);

  const newSimulation = useCallback(() => {
    setStore((s) => ({ ...s, current: blank() }));
  }, []);

  return {
    hydrated,
    current: store.current,
    history: store.history,
    updateCurrent,
    addBill,
    updateBill,
    removeBill,
    duplicateBill,
    saveToHistory,
    loadFromHistory,
    removeFromHistory,
    newSimulation,
  };
}
