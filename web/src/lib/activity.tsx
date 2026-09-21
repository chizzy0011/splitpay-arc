"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ActivityItem = {
  id: string;
  kind: "split" | "lock" | "release" | "refund";
  title: string;
  detail: string;
  hash?: `0x${string}`;
  ts: number;
};

type ActivityState = {
  items: ActivityItem[];
  add: (item: Omit<ActivityItem, "id" | "ts">) => void;
  toast: ActivityItem | null;
  dismissToast: () => void;
};

const Ctx = createContext<ActivityState | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [toast, setToast] = useState<ActivityItem | null>(null);

  const add = useCallback((item: Omit<ActivityItem, "id" | "ts">) => {
    const full: ActivityItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
    };
    setItems((prev) => [full, ...prev].slice(0, 20));
    setToast(full);
    window.setTimeout(() => {
      setToast((t) => (t?.id === full.id ? null : t));
    }, 6000);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <Ctx.Provider value={{ items, add, toast, dismissToast }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider");
  return ctx;
}
