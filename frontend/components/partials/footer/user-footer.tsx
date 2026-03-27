"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  TrendingUp,
  BarChart3,
  Globe,
  Coins,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import Image from "next/image";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Bicrypto";
const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "The most trusted cryptocurrency platform with advanced trading tools and secure storage.";

// Social link interface matching the settings configuration
interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
}

interface FooterLink {
  name: string;
  href: string;
  icon?: React.ElementType;
}

interface FooterSection {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  links: FooterLink[];
}

export function SiteFooter() {
  const t = useTranslations("common");
  const tComponents = useTranslations("components");
  const { extensions, settings, settingsFetched } = useSettings();

  const hasExtension = (name: string) => extensions?.includes(name) ?? false;
  const getSetting = (key: string) => {
    if (!settings) return false;
    const value = settings[key];
    return value === true || value === "true";
  };

  const isSpotEnabled = getSetting("spotWallets");
  const isEcosystemEnabled = hasExtension("ecosystem");
  const showSpotTrading = isSpotEnabled || isEcosystemEnabled;

  // Get social links from customSocialLinks setting
  const socialLinks = useMemo(() => {
    if (!settings) return [];
    const customLinks = settings.customSocialLinks;
    if (!customLinks) return [];

    try {
      const parsed: SocialLink[] = typeof customLinks === 'string'
        ? JSON.parse(customLinks)
        : customLinks;

      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((link) => link.url && link.url.trim() !== "")
        .map((link) => ({
          id: link.id,
          label: link.name,
          href: link.url,
          icon: link.icon || "/img/social/globe.svg",
        }));
    } catch {
      return [];
    }
  }, [settings]);

  const footerSections = useMemo<FooterSection[]>(() => {
    const sections: FooterSection[] = [];

    // Trading Section
    const tradingLinks: FooterLink[] = [];
    if (showSpotTrading) {
      tradingLinks.push({ name: "Spot Trading", href: "/trade" });
    }
    if (getSetting("binaryStatus")) {
      tradingLinks.push({ name: "Binary Options", href: "/binary" });
    }
    if (hasExtension("futures")) {
      tradingLinks.push({ name: "Futures", href: "/futures" });
    }
    if (hasExtension("p2p")) {
      tradingLinks.push({ name: "P2P Trading", href: "/p2p" });
    }
    if (hasExtension("forex")) {
      tradingLinks.push({ name: "Forex", href: "/forex" });
    }
    tradingLinks.push({ name: "Markets", href: "/market" });

    if (tradingLinks.length > 0) {
      sections.push({
        title: "Trading",
        icon: BarChart3,
        iconColor: "text-blue-500 dark:text-blue-400",
        links: tradingLinks,
      });
    }

    // Products Section
    const productLinks: FooterLink[] = [];
    if (getSetting("investment")) {
      productLinks.push({ name: "Investment", href: "/investment" });
    }
    if (hasExtension("staking")) {
      productLinks.push({ name: "Staking", href: "/staking" });
    }
    if (hasExtension("ico")) {
      productLinks.push({ name: "Token Sales", href: "/ico" });
    }
    if (hasExtension("ai_investment")) {
      productLinks.push({ name: "AI Investment", href: "/ai/investment" });
    }
    if (hasExtension("nft")) {
      productLinks.push({ name: "NFT Marketplace", href: "/nft" });
    }
    if (hasExtension("ecommerce")) {
      productLinks.push({ name: "Store", href: "/ecommerce" });
    }

    if (productLinks.length > 0) {
      sections.push({
        title: "Products",
        icon: Coins,
        iconColor: "text-emerald-500 dark:text-emerald-400",
        links: productLinks,
      });
    }

    // Resources Section
    const resourceLinks: FooterLink[] = [
      { name: "API Documentation", href: "/api-docs" },
      { name: "Help Center", href: "/support" },
    ];
    if (hasExtension("knowledge_base")) {
      resourceLinks.push({ name: "FAQ", href: "/faq" });
    }
    resourceLinks.push({ name: "Blog", href: "/blog" });

    sections.push({
      title: "Resources",
      icon: BookOpen,
      iconColor: "text-amber-500 dark:text-amber-400",
      links: resourceLinks,
    });

    // Company Section
    sections.push({
      title: "Company",
      icon: Globe,
      iconColor: "text-purple-500 dark:text-purple-400",
      links: [
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "KYC Verification", href: "/user/kyc" },
        ...(hasExtension("mlm") ? [{ name: "Affiliate", href: "/affiliate" }] : []),
      ],
    });

    return sections;
  }, [extensions, settings, showSpotTrading]);

  if (!settingsFetched) {
    return (
      <footer className="bg-muted/30 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative border-t border-black/5 bg-transparent dark:border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/40 to-transparent dark:from-white/[0.02]" />

      <div className="relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="public-card overflow-hidden px-6 py-8 md:px-8 md:py-10">
            <div className="mb-10 flex flex-col gap-8 border-b border-black/5 pb-10 dark:border-white/10 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-primary-foreground shadow-lg shadow-sky-500/20">
                    <TrendingUp className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-foreground">{siteName}</span>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  {siteDescription}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="flex flex-col items-start gap-4 lg:items-end">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Follow Us</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.id}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        title={social.label}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground dark:border-white/10 dark:bg-white/5"
                      >
                        <Image
                          src={social.icon}
                          alt={social.label}
                          width={20}
                          height={20}
                          className="opacity-70 transition-opacity hover:opacity-100 dark:invert"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-12 lg:py-12">
              {footerSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <section.icon className={cn("w-4 h-4", section.iconColor)} />
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-black/5 pt-5 dark:border-white/10">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-center text-sm text-muted-foreground sm:text-left">
                  © {new Date().getFullYear()} {siteName}. {tComponents("all_rights_reserved")}.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                  {[
                    { name: "Privacy", href: "/privacy" },
                    { name: "Terms", href: "/terms" },
                  ].map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
