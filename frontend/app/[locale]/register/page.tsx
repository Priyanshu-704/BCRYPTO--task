"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { AuthModal } from "@/components/auth/auth-modal";
import { useUserStore } from "@/store/user";
import { PublicHero, PublicShell } from "@/components/layout/public-shell";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const ref = searchParams.get("ref");
  const returnTo = searchParams.get("return");

  const getDefaultRedirectPath = () => {
    const roleName = user?.role?.name?.toLowerCase() || "";
    return roleName.includes("admin")
      ? "/admin"
      : process.env.NEXT_PUBLIC_DEFAULT_USER_PATH || "/user";
  };

  // Store the ref parameter in sessionStorage when the page loads
  useEffect(() => {
    if (ref) {
      sessionStorage.setItem("affiliateRef", ref);
    }
  }, [ref]);

  useEffect(() => {
    if (user) {
      router.replace(returnTo || getDefaultRedirectPath());
    }
  }, [user, returnTo]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Redirect to home page when modal is closed
    router.push("/");
  };

  const handleViewChange = (view: string) => {
    // If user switches to login, keep them on the page
    if (view === "login") {
      // You can handle this if needed
    }
  };

  return (
    <PublicShell contentClassName="min-h-screen px-4 py-10 md:px-6">
      <AuthModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialView="register"
        onViewChange={handleViewChange}
        returnTo={returnTo || "/"}
      />

      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 lg:grid-cols-[26rem_minmax(0,1fr)]">
        <div className="public-card p-6 md:p-8">
          <span className="public-kicker">Open an account</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            The registration flow now feels like part of the product, not a separate popup.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Better surfaces, calmer spacing, and a clearer route-level layout make the first interaction stronger.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-2xl font-semibold text-slate-950 dark:text-white">01</div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Create</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-2xl font-semibold text-slate-950 dark:text-white">02</div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Verify</p>
            </div>
          </div>
        </div>

        <PublicHero
          eyebrow="New account"
          title="A sharper onboarding route with stronger trust cues and cleaner composition."
          description="This page now mirrors the upgraded public design language so signup feels intentional from the very first screen."
          aside={
            <div className="space-y-3 text-sm leading-6">
              <p>Referral codes still persist through session storage, while the surrounding layout now feels much more premium.</p>
              <p>The modal stays in place, but the page around it now contributes to conversion instead of acting like filler.</p>
            </div>
          }
        />
      </div>
    </PublicShell>
  );
}
