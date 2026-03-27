"use client";
import SiteHeader from "@/components/partials/header/site-header";
import { SiteFooter } from "@/components/partials/footer/user-footer";
import { PublicShell } from "@/components/layout/public-shell";

interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <PublicShell contentClassName="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-24 md:pt-28">{children}</main>
      <SiteFooter />
    </PublicShell>
  );
}
