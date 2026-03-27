"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PublicShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

interface PublicHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function PublicShell({
  children,
  className,
  contentClassName,
}: PublicShellProps) {
  return (
    <div className={cn("relative isolate min-h-screen overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.22),transparent_22%),linear-gradient(180deg,#fcfcf7_0%,#f4efe5_44%,#eef4f7_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_24%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.18),transparent_18%),linear-gradient(180deg,#07111a_0%,#0d1622_44%,#101826_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:32px_32px] dark:opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-white/80 via-white/20 to-transparent dark:from-white/8 dark:via-white/0 dark:to-transparent" />
      <div className={cn("relative", contentClassName)}>{children}</div>
    </div>
  );
}

export function PublicHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className,
}: PublicHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 px-6 py-10 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur md:px-10 md:py-14 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_90px_-45px_rgba(0,0,0,0.75)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.16),transparent_22%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="max-w-3xl space-y-5">
          {eyebrow ? (
            <span className="inline-flex rounded-full border border-sky-200/80 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-800 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-100">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl md:leading-[1.05] dark:text-white">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg dark:text-slate-300">
              {description}
            </p>
          ) : null}
          {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
        </div>
        {aside ? (
          <div className="rounded-[1.5rem] border border-slate-900/8 bg-slate-950/[0.035] p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
