"use client";

import type { ReactNode } from "react";
import { NetworkProvider } from "@/lib/network";
import { WalletProvider } from "@/lib/wallet";
import { ActivityProvider } from "@/lib/activity";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NetworkProvider>
      <WalletProvider>
        <ActivityProvider>{children}</ActivityProvider>
      </WalletProvider>
    </NetworkProvider>
  );
}
