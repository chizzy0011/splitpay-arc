"use client";

import type { ReactNode } from "react";
import { WalletProvider } from "@/lib/wallet";
import { ActivityProvider } from "@/lib/activity";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <ActivityProvider>{children}</ActivityProvider>
    </WalletProvider>
  );
}
