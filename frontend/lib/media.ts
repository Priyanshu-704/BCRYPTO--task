"use client";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

function getBackendOrigin(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (backendUrl) {
    return backendUrl.replace(/\/$/, "");
  }

  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "4000";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (typeof window !== "undefined") {
    const { protocol, hostname, origin, port } = window.location;
    const isDefaultBackendPort =
      port === backendPort || (!port && (backendPort === "80" || backendPort === "443"));

    if (process.env.NODE_ENV !== "production" && !isDefaultBackendPort) {
      return `${protocol}//${hostname}:${backendPort}`;
    }

    if (siteUrl) {
      try {
        return new URL(siteUrl).origin;
      } catch {
        return siteUrl.replace(/\/$/, "");
      }
    }

    return origin;
  }

  if (siteUrl) {
    try {
      return new URL(siteUrl).origin;
    } catch {
      return siteUrl.replace(/\/$/, "");
    }
  }

  return `http://localhost:${backendPort}`;
}

export function resolveMediaUrl(
  input?: string | null,
  fallback = "/img/placeholder.svg"
): string {
  if (!input) {
    return fallback;
  }

  const value = input.trim();
  if (!value) {
    return fallback;
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    ABSOLUTE_URL_PATTERN.test(value)
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("/uploads/") || value.startsWith("/img/")) {
    return `${getBackendOrigin()}${value}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  return value;
}
