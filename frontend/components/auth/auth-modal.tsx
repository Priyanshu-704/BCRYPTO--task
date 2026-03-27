"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import { Lock, Shield, CheckCircle2, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import RegisterSuccess from "@/components/auth/register-success";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import WalletLoginForm from "@/components/auth/wallet-login-form";
import { useRouter } from "@/i18n/routing";
import { LazyWalletProvider } from "@/context/wallet-lazy";
import { useTranslations } from "next-intl";
import { cleanupAuthFalseParam, hasAuthFalseParam } from "@/utils/url-cleanup";
import { useUserStore } from "@/store/user";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView:
    | "login"
    | "register"
    | "register-success"
    | "forgot-password"
    | "reset-password"
    | "wallet-login";
  onViewChange?: (view: string) => void;
  returnTo?: string | null;

}

export function AuthModal({
  isOpen,
  onClose,
  initialView,
  onViewChange,
  returnTo,
}: AuthModalProps) {
  const t = useTranslations("components_auth");
  const [view, setView] = useState<
    "login" | "register" | "register-success" | "forgot-password" | "reset-password" | "wallet-login"
  >(initialView);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animateContent, setAnimateContent] = useState(true);
  const [registrationData, setRegistrationData] = useState<{
    email: string;
    needsEmailVerification: boolean;
  } | null>(null);

  const sanitizeReturnPath = (path: string | null | undefined) => {
    if (!path || !path.startsWith("/")) {
      return null;
    }

    if (typeof window !== "undefined") {
      try {
        const candidateUrl = new URL(path, window.location.origin);
        const currentOrigin = new URL(window.location.origin);
        if (candidateUrl.origin !== currentOrigin.origin) {
          return null;
        }
        return `${candidateUrl.pathname}${candidateUrl.search}${candidateUrl.hash}`;
      } catch (error) {
        return null;
      }
    }

    return path;
  };

  useEffect(() => {
    try {
      const token = searchParams?.get("token");
      if (token) {
        setResetToken(token);
        setView("reset-password");
        if (onViewChange) {
          onViewChange("reset-password");
        }
      }
    } catch (error) {
      console.error("Error checking for reset token:", error);
      setError("Failed to process reset token from URL");
    }
  }, [searchParams, onViewChange]);

  useEffect(() => {
    try {
      setView(initialView);
    } catch (error) {
      console.error("Error in AuthModal useEffect:", error);
      setError("Failed to update view");
    }
  }, [initialView]);

  useEffect(() => {
    setAnimateContent(false);
    const timer = setTimeout(() => setAnimateContent(true), 50);
    return () => clearTimeout(timer);
  }, [view]);

  const handleViewChange = (newView: string) => {
    try {
      setAnimateContent(false);
      setTimeout(() => {
        setView(
          newView as
            | "login"
            | "register"
            | "register-success"
            | "forgot-password"
            | "reset-password"
            | "wallet-login"
        );
        if (onViewChange) {
          onViewChange(newView);
        }
        setAnimateContent(true);
      }, 150);
    } catch (error) {
      console.error("Error in handleViewChange:", error);
      setError("Failed to change view");
    }
  };

  const handleSuccess = () => {
    try {
      // Clean up auth=false and return parameters from URL after successful login
      if (hasAuthFalseParam()) {
        cleanupAuthFalseParam();
      }

      const currentReturnParam =
        searchParams?.get("return") ||
        (typeof window !== "undefined"
          ? new URL(window.location.href).searchParams.get("return")
          : null);
      const targetPath =
        sanitizeReturnPath(returnTo) || sanitizeReturnPath(currentReturnParam);

      if (targetPath) {
        // Check if returnTo already contains locale, if so, strip it
        const locales = process.env.NEXT_PUBLIC_LANGUAGES?.split(/[,\s]+/).map(code => code.trim()).filter(code => code.length > 0) || [];
        let cleanPath = targetPath;
        
        // Remove locale prefix if present (e.g., /en/admin -> /admin)
        const pathSegments = cleanPath.split("?")[0].split("/").filter(Boolean);
        if (pathSegments.length > 0 && locales.includes(pathSegments[0])) {
          const normalizedPath = "/" + pathSegments.slice(1).join("/");
          const queryIndex = cleanPath.indexOf("?");
          cleanPath =
            queryIndex >= 0
              ? `${normalizedPath}${cleanPath.slice(queryIndex)}`
              : normalizedPath;
        }
        
        router.push(cleanPath);
      } else if (view === "reset-password" && resetToken) {
        const newUrl = window.location.pathname;
        router.replace(newUrl);
      } else {
        const currentUser = useUserStore.getState().user;
        const roleName = currentUser?.role?.name?.toLowerCase() || "";
        const defaultUserPath =
          process.env.NEXT_PUBLIC_DEFAULT_USER_PATH || "/user";
        const destination =
          roleName.includes("admin") ? "/admin" : defaultUserPath;

        router.push(destination);
      }
    } catch (error) {
      console.error("Error in handleSuccess:", error);
      setError("Failed to process successful action");
      if (view !== "forgot-password") {
        onClose();
      }
    }
  };

  const handleClose = () => {
    try {
      onClose();
    } catch (error) {
      console.error("Error in handleClose:", error);
      onClose();
    }
  };

  const handleLoginClick = () => {
    try {
      handleViewChange("login");
    } catch (error) {
      console.error("Error in handleLoginClick:", error);
      setError("Failed to return to login");
    }
  };

  const handleTokenSubmit = (token: string) => {
    try {
      setResetToken(token);
      handleViewChange("reset-password");
    } catch (error) {
      console.error("Error in handleTokenSubmit:", error);
      setError("Failed to process token");
    }
  };

  const handleRegistrationSuccess = (email: string, needsEmailVerification: boolean) => {
    try {
      setRegistrationData({ email, needsEmailVerification });
      handleViewChange("register-success");
    } catch (error) {
      console.error("Error in handleRegistrationSuccess:", error);
      setError("Failed to process registration success");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,244,236,0.96)_100%)] p-0 shadow-[0_45px_120px_-50px_rgba(15,23,42,0.7)] backdrop-blur-xl sm:max-w-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(10,16,28,0.96)_100%)]">
        {/* ---- Accessibility: DialogTitle and DialogDescription ---- */}
        <DialogTitle>
          <span className="sr-only">Authentication</span>
        </DialogTitle>
        <DialogDescription>
          <span className="sr-only">
            Sign in or create an account securely.
          </span>
        </DialogDescription>
        {/* --------------------------------------------------------- */}

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl"></div>
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent dark:from-white/5"></div>
        </div>
        <DialogPrimitive.Close className="hidden absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>

        {/* Error display */}
        {error && (
          <div
            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mx-6 mt-6 relative z-10"
            role="alert"
          >
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="block sm:inline text-sm">{error}</span>
            </div>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3 text-destructive/70 hover:text-destructive transition-colors"
              onClick={() => setError(null)}
            >
              <span className="sr-only">Dismiss</span>
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}

        {/* Main content */}
        <div
          className={`max-h-[90vh] pb-8 overflow-y-auto scrollbar-hide auth-modal-content ${animateContent ? "opacity-100" : "opacity-0"}`}
        >
          {view === "forgot-password" ? (
            <div className="p-8 md:p-9">
              <ForgotPasswordForm
                onSuccess={handleSuccess}
                onLoginClick={handleLoginClick}
                onTokenSubmit={handleTokenSubmit}
              />
            </div>
          ) : view === "reset-password" ? (
            <div className="p-8 md:p-9">
              <ResetPasswordForm
                token={resetToken || ""}
                onSuccess={handleSuccess}
                onLoginClick={handleLoginClick}
                preserveToken={true}
              />
            </div>
          ) : view === "wallet-login" ? (
            <div className="p-8 md:p-9">
              <LazyWalletProvider cookies="">
                <WalletLoginForm
                  onSuccess={handleSuccess}
                  onCancel={handleLoginClick}
                />
              </LazyWalletProvider>
            </div>
          ) : (
            <div className="p-8 md:p-9">
              {view === "login" ? (
                <LoginForm
                  onSuccess={handleSuccess}
                  onRegisterClick={() => handleViewChange("register")}
                  onForgotPasswordClick={() =>
                    handleViewChange("forgot-password")
                  }
                  onWalletLoginClick={() => handleViewChange("wallet-login")}
                />
              ) : view === "register" ? (
                <RegisterForm
                  onSuccess={handleSuccess}
                  onRegistrationSuccess={handleRegistrationSuccess}
                  onLoginClick={handleLoginClick}
                />
              ) : (
                <RegisterSuccess 
                  email={registrationData?.email || ""}
                  needsEmailVerification={registrationData?.needsEmailVerification || false}
                  onLoginClick={handleLoginClick}
                  onClose={handleClose}
                />
              )}
            </div>
          )}

          {(view === "login" || view === "register") && (
            <div className="px-8 pb-8 pt-1 md:px-9 md:pb-9">
              <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.025] p-4 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t("secure_authentication")}</span>
                  <div className="h-4 w-px bg-border"></div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t("data_protection")}</span>
                  <div className="h-4 w-px bg-border"></div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t("verified_security")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
