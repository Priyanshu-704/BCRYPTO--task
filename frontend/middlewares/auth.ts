import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { verifyToken } from "@/lib/token/access-token";
import { MiddlewareFactory } from "../types/MiddlewareFactory";
import permissions from "@/middlewares/permissions.json";
import { config as i18nConfig } from "@/i18n/config";

const dev = process.env.NODE_ENV !== "production";
const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || 4000;
const apiUrl = dev
  ? `http://localhost:${backendPort}`
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost";

interface Role {
  name: string;
  permissions: string[];
}
interface RolesCache {
  [key: number]: Role;
}
let rolesCache: RolesCache | null = null;
let rolesCachePromise: Promise<void> | null = null;
let rolesCacheExpiry: number = 0;
const ROLES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

async function fetchRolesAndPermissions() {
  const now = Date.now();

  // Return cached data if still valid
  if (rolesCache && rolesCacheExpiry > now) {
    return;
  }

  // If already fetching, wait for existing promise
  if (rolesCachePromise) {
    return rolesCachePromise;
  }

  // Create new fetch promise
  rolesCachePromise = (async () => {
    try {
      const endpoint = `${apiUrl}/api/auth/role`;

      // Use AbortController with shorter timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `Failed to fetch roles and permissions: ${response.status} ${response.statusText}`
        );
        rolesCache = rolesCache || {}; // Keep old cache on error
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error(
          `Invalid response format: expected JSON, got ${contentType || "unknown"}. Response: ${text}`
        );
        rolesCache = rolesCache || {}; // Keep old cache on error
        return;
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        rolesCache = data.reduce((acc: RolesCache, role: any) => {
          if (role && role.id && role.name && Array.isArray(role.permissions)) {
            acc[role.id] = {
              name: role.name,
              permissions: role.permissions.map((p: any) => p.name),
            };
          }
          return acc;
        }, {});
        // Set cache expiry
        rolesCacheExpiry = now + ROLES_CACHE_TTL;
      } else {
        console.error("Invalid roles data format received");
        rolesCache = rolesCache || {}; // Keep old cache on error
      }
    } catch (error: any) {
      // Silently handle connection errors (ECONNRESET, ECONNREFUSED, abort)
      // These are common during server restarts or high load
      // Note: fetch errors have the code on error.cause, not directly on error
      const errorCode = error?.code || error?.cause?.code;
      const isConnectionError =
        errorCode === "ECONNRESET" ||
        errorCode === "ECONNREFUSED" ||
        error?.name === "AbortError" ||
        error?.message?.includes("aborted") ||
        error?.message?.includes("fetch failed");

      if (!isConnectionError) {
        console.error("Error fetching roles and permissions:", error);
      }
      rolesCache = rolesCache || {}; // Keep old cache on error
    } finally {
      rolesCachePromise = null;
    }
  })();

  return rolesCachePromise;
}

async function refreshToken(request: NextRequest) {
  try {
    // Use AbortController with timeout to prevent hanging connections
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const res = await fetch(`${apiUrl}/api/auth/session`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store", // Prevent caching issues
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      // Use getSetCookie() to properly handle multiple Set-Cookie headers
      // res.headers.get("set-cookie") may only return the first cookie
      const cookies = res.headers.getSetCookie?.() || [];
      for (const cookie of cookies) {
        // Match accessToken with or without trailing semicolon
        const match = cookie.match(/^accessToken=([^;]+)/);
        if (match) {
          return {
            accessToken: match[1],
            cookies,
          };
        }
      }
      // Fallback: try the old method in case getSetCookie is not available
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) {
        const accessToken = setCookie.match(/accessToken=([^;]+)/)?.[1];
        if (accessToken) {
          return {
            accessToken,
            cookies: [setCookie],
          };
        }
      }
    } else {
      console.error("Failed to refresh token:", res.status, res.statusText);
    }
  } catch (error: any) {
    // Silently handle connection errors (ECONNRESET, ECONNREFUSED, abort)
    // Note: fetch errors have the code on error.cause, not directly on error
    const errorCode = error?.code || error?.cause?.code;
    const isConnectionError =
      errorCode === "ECONNRESET" ||
      errorCode === "ECONNREFUSED" ||
      error?.name === "AbortError" ||
      error?.message?.includes("aborted") ||
      error?.message?.includes("fetch failed");

    if (!isConnectionError) {
      console.error("Error refreshing token:", error);
    }
  }
  return null;
}

const AUTH_PAGES = ["/auth", "/login", "/register"];
const defaultUserPath = process.env.NEXT_PUBLIC_DEFAULT_USER_PATH || "/user";
// Maintenance mode is now handled by a separate maintenance server
// that runs automatically when the main server is stopped


// === PERMISSIONS MATCHER ===
function matchPermission(strippedPath: string): string | null {
  // 1. Exact match
  const matched = permissions.find((perm) => perm.path === strippedPath);
  if (matched) return matched.permission;

  // 2. Dynamic segments ([id], [slug], etc)
  for (const perm of permissions) {
    const regex = new RegExp(
      "^" + perm.path.replace(/\[.*?\]/g, "[^/]+") + "$"
    );
    if (regex.test(strippedPath)) return perm.permission;
  }
  return null;
}

async function hasPermission(roleId: number, strippedPath: string) {
  if (!rolesCache || Object.keys(rolesCache).length === 0) return false;
  const role = rolesCache[roleId];
  if (!role) return false;
  if (role.name === "Super Admin") return true;

  const requiredPermission = matchPermission(strippedPath);
  if (!requiredPermission) return true; // No permission required for this route
  return role.permissions.includes(requiredPermission);
}

function appendRefreshedCookies(
  response: NextResponse | Response | undefined,
  refreshedCookies: string[]
) {
  if (!(response instanceof NextResponse) || refreshedCookies.length === 0) {
    return response;
  }

  for (const cookie of refreshedCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}

export const authMiddleware: MiddlewareFactory =
  (next) => async (request: NextRequest, event: NextFetchEvent) => {
    const { pathname } = request.nextUrl;
    const locales = i18nConfig.locales;
    // Extract locale from path, e.g. /en/admin
    let strippedPath = pathname;
    let currentLocale: string | null = null;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && locales.includes(segments[0])) {
      currentLocale = segments[0];
      strippedPath = "/" + segments.slice(1).join("/");
    }
    const isAdminRoute = strippedPath.startsWith("/admin");

    // Warm the cache in the background for general navigation, but make
    // protected admin permission checks block on a fresh roles snapshot.
    if (!rolesCache) {
      rolesCache = {};
      fetchRolesAndPermissions().catch((err) =>
        console.error("Background role fetch failed:", err)
      );
    }

    const accessToken = request.cookies.get("accessToken")?.value;
    let payload: any = null;
    let isTokenValid = false;
    let refreshedCookies: string[] = [];

    if (accessToken) {
      const verified = await verifyToken(accessToken);
      if (verified) {
        payload = verified;
        isTokenValid = true;
      }
    }
    if (!isTokenValid) {
      const sessionId = request.cookies.get("sessionId")?.value;
      if (sessionId) {
        try {
          const refreshedSession = await refreshToken(request);
          if (refreshedSession?.accessToken) {
            const verified = await verifyToken(refreshedSession.accessToken);
            if (verified) {
              payload = verified;
              isTokenValid = true;
              refreshedCookies = refreshedSession.cookies || [];
            }
          }
        } catch (error) {
          console.error("Error during token refresh:", error);
          // Continue with invalid token state
        }
      }
    }

    const shouldRequireFreshRoles =
      isAdminRoute ||
      (isTokenValid &&
        AUTH_PAGES.some((page) => strippedPath.startsWith(page)));

    if (
      shouldRequireFreshRoles &&
      (!rolesCache || Object.keys(rolesCache).length === 0 || rolesCacheExpiry < Date.now())
    ) {
      await fetchRolesAndPermissions();
    }

    // Maintenance mode removed - handled by separate maintenance server

    // If logged in and tries to access auth page, redirect to defaultUserPath
    if (
      isTokenValid &&
      AUTH_PAGES.some((page) => strippedPath.startsWith(page))
    ) {
      const roleId = payload?.sub?.role;
      const redirectPath =
        roleId && (await hasPermission(roleId, "/admin"))
          ? "/admin"
          : defaultUserPath;
      const returnUrl =
        request.nextUrl.searchParams.get("return") || redirectPath;
      const url = request.nextUrl.clone();
      url.pathname = currentLocale
        ? `/${currentLocale}${returnUrl}`
        : returnUrl;
      url.searchParams.delete("return");
      return appendRefreshedCookies(NextResponse.redirect(url), refreshedCookies);
    }

    // Handle admin routes
    if (isAdminRoute) {
      const authParam = request.nextUrl.searchParams.get("auth");
      
      if (!isTokenValid) {
        // User not authenticated
        if (authParam !== "false") {
          const url = request.nextUrl.clone();
          url.searchParams.set("auth", "false");
          return appendRefreshedCookies(NextResponse.redirect(url), refreshedCookies);
        }
        // If auth=false is already present, let the request continue to show the page with auth modal
      } else {
        // User is authenticated, check permissions
        const roleId = payload?.sub?.role;
        
        if (roleId && (await hasPermission(roleId, strippedPath))) {
          // User has permission, remove auth parameter if present and allow access
          if (authParam === "false") {
            const url = request.nextUrl.clone();
            url.searchParams.delete("auth");
            return appendRefreshedCookies(NextResponse.redirect(url), refreshedCookies);
          }
          // User has access, continue normally
        } else {
          // User is authenticated but doesn't have admin permissions
          if (authParam !== "false") {
            const url = request.nextUrl.clone();
            url.searchParams.set("auth", "false");
            return appendRefreshedCookies(NextResponse.redirect(url), refreshedCookies);
          }
          // If auth=false is already present, let the request continue to show no permission state
        }
      }
    }

    return appendRefreshedCookies(next(request, event), refreshedCookies);
  };
