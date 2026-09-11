"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { PriceVisibilityProvider } from "@/components/PriceVisibilityProvider";

type Props = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  backToTop: React.ReactNode;
  showPrices: boolean;
};

export default function SiteFrame({ children, header, footer, backToTop, showPrices }: Props) {
  const pathname = usePathname();
  const isManagement = pathname.startsWith("/admin") || pathname.startsWith("/commercial");

  if (isManagement) return <>{children}</>;

  return (
    <PriceVisibilityProvider showPrices={showPrices}>
      <Fragment key="header">{header}</Fragment>
      <main key="content">{children}</main>
      <Fragment key="footer">{footer}</Fragment>
      <Fragment key="back-to-top">{backToTop}</Fragment>
    </PriceVisibilityProvider>
  );
}
