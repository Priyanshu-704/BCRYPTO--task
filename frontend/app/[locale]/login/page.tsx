"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthModal } from "@/components/auth/auth-modal";
import { $fetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, Link } from "@/i18n/routing";
import { useUserStore } from "@/store/user";
import { PublicHero, PublicShell } from "@/components/layout/public-shell";

export default function LoginPage() {
  const t = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const user = useUserStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'none'>('none');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const returnTo = searchParams?.get("return");

  const getDefaultRedirectPath = () => {
    const roleName = user?.role?.name?.toLowerCase() || "";
    return roleName.includes("admin")
      ? "/admin"
      : process.env.NEXT_PUBLIC_DEFAULT_USER_PATH || "/user";
  };

  useEffect(() => {
    const token = searchParams?.get('token');

    if (user && !token) {
      router.replace(returnTo || getDefaultRedirectPath());
      return;
    }
    
    if (token) {
      // Handle email verification token
      handleEmailVerification(token);
    } else {
      // Show login modal for regular login
      setIsModalOpen(true);
    }
  }, [searchParams, user, returnTo]);

  const handleEmailVerification = async (token: string) => {
    setIsVerifying(true);
    setVerificationStatus('pending');

    try {
      const result = await $fetch({
        url: '/api/auth/verify/email',
        method: 'POST',
        body: { token },
        silent: true,
      });

      if (result.data?.message) {
        setVerificationStatus('success');
        setVerificationMessage(result.data.message);
        toast({
          title: "Email Verified Successfully",
          description: "Your email has been verified. You can now access all features.",
        });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setVerificationMessage(result.error || 'Email verification failed');
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid or expired verification token.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      setVerificationMessage('An unexpected error occurred during verification');
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);

    if (!user) {
      router.push('/');
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast({
        title: "Email Required",
        description: "Please provide your email address to resend verification.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    try {
      const result = await $fetch({
        url: '/api/auth/verify/resend',
        method: 'POST',
        body: { email: userEmail },
        silent: true,
      });

      if (result.data?.message) {
        toast({
          title: "Verification Email Sent",
          description: result.data.message,
        });
      } else {
        toast({
          title: "Failed to Send",
          description: result.error || "Failed to send verification email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Email verification result page
  if (verificationStatus !== 'none') {
    return (
      <PublicShell contentClassName="min-h-screen px-4 py-10 md:px-6">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
          <div className="w-full max-w-xl space-y-6 text-center">
            <PublicHero
              eyebrow="Account status"
              title={
                isVerifying
                  ? t("verifying_email")
                  : verificationStatus === "success"
                    ? t("email_verified")
                    : t("verification_failed")
              }
              description={
                isVerifying
                  ? t("please_wait_while_we_verify_your")
                  : verificationMessage
              }
              className="mb-6 text-left"
            />
          <div className="space-y-2">
            {isVerifying ? (
              <>
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  {t("verifying_email")}
                </h1>
                <p className="text-muted-foreground">
                  {t("please_wait_while_we_verify_your")}
                </p>
              </>
            ) : verificationStatus === 'success' ? (
              <>
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500">
                  {t("email_verified")}
                </h1>
                <p className="text-muted-foreground">
                  {verificationMessage}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t("you_will_be_redirected_to_the")}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-500">
                  {t("verification_failed")}
                </h1>
                <p className="text-muted-foreground">
                  {verificationMessage}
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {t("the_verification_link_may_have_expired")} {t("please_try_requesting_a_new_one")}
                  </p>
                  <div className="mt-3">
                    <Input
                      type="email"
                      placeholder={t("enter_your_email_address")}
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="bg-white dark:bg-red-900/10 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100 placeholder-red-500 dark:placeholder-red-400 focus:ring-red-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {!isVerifying && (
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/')}
                className="w-full py-6 px-8 relative overflow-hidden btn-glow transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                {t("go_to_home")}
              </Button>
              
              {verificationStatus === 'error' && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-6 px-8"
                  >
                    {t("try_login_instead")}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleResendVerification}
                    className="w-full py-6 px-8"
                    disabled={isResending}
                  >
                    {isResending ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell contentClassName="min-h-screen px-4 py-10 md:px-6">
      <AuthModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialView="login"
        onViewChange={() => {}}
        returnTo={returnTo}
      />

      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <PublicHero
          eyebrow="Secure access"
          title="A cleaner, calmer entry point into the trading platform."
          description="The login route now uses the same premium shell as the public site, with stronger hierarchy, better spacing, and a more intentional first impression across mobile and desktop."
          aside={
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Access stack</p>
                <ul className="mt-3 space-y-2 text-sm leading-6">
                  <li>Live trading and wallet controls.</li>
                  <li>Email verification and recovery support.</li>
                  <li>Responsive auth flow for every screen size.</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full border border-black/10 px-3 py-1 dark:border-white/10">Secure auth</span>
                <span className="rounded-full border border-black/10 px-3 py-1 dark:border-white/10">Fast recovery</span>
                <span className="rounded-full border border-black/10 px-3 py-1 dark:border-white/10">Mobile ready</span>
              </div>
            </div>
          }
        />

        <div className="public-card p-6 text-left md:p-8">
          <span className="public-kicker">Welcome back</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {isModalOpen ? "Your login form is open and ready." : "Access your account in one step."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isModalOpen
              ? "Use the secure dialog to continue into your portfolio, trading tools, and account settings."
              : "Open the authentication flow to continue into the platform."}
          </p>
          <div className="mt-6 space-y-3">
            {!isModalOpen && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full rounded-full px-8 py-6"
              >
                {t("open_login_form")}
              </Button>
            )}
            <Link href="/" className="block">
              <Button variant="outline" className="w-full rounded-full py-6">
                {t("return_to_home")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
