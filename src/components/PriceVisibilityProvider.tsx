"use client";

import { createContext, useContext } from "react";

const PriceVisibilityContext = createContext(true);

export function PriceVisibilityProvider({
  showPrices,
  children,
}: {
  showPrices: boolean;
  children: React.ReactNode;
}) {
  return <PriceVisibilityContext.Provider value={showPrices}>{children}</PriceVisibilityContext.Provider>;
}

export function useShowPrices() {
  return useContext(PriceVisibilityContext);
}
