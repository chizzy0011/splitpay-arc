"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNetwork } from "./network";

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

const keyFor = (network: string) => `splitpay-activity-${network}`;

function load(network: string): ActivityItem[] {
  try {
    const raw = window.localStorage.getItem(keyFor(network));
    return raw ? (JSON.parse(raw) as ActivityItem[]) : [];
  } catch {
    return [];
  }
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { network } = useNetwork();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [toast, setToast] = useState<ActivityItem | null>(null);

  // Load the bucket for the active network (and when it changes).
  useEffect(() => {
    setItems(load(network));
  }, [network]);

  const add = useCallback(
    (item: Omit<ActivityItem, "id" | "ts">) => {
      const full: ActivityItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: Date.now(),
      };
      setItems((prev) => {
        const next = [full, ...prev].slice(0, 50);
        try {
          window.localStorage.setItem(keyFor(network), JSON.stringify(next));
        } catch {
          /* ignore quota / private-mode errors */
        }
        return next;
      });
      setToast(full);
      window.setTimeout(() => setToast((t) => (t?.id === full.id ? null : t)), 6000);
    },
    [network],
  );

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
