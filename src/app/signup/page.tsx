"use client";

/**
 * /signup — sign-up surface. Same provider tiles as /login plus an
 * email + password form that calls signUpWithPassword. Successful
 * email signups need a confirmation click; OAuth bounces straight in.
 */

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

function SignupInner() {
  const { signInWithGoogle, signInWithMicrosoft, signUpWithPassword, authConfigured } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"google" | "microsoft" | "email" | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function go(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, label: typeof loading) {
    setError(null);
    setLoading(label);
    const r = await fn();
    if (!r.ok) {
      setError(r.error);
      setLoading(null);
      return;
    }
    if (label === "email") setConfirmation(true);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (email.length === 0 || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    await go(() => signUpWithPassword(email, password), "email");
  }

  if (confirmation) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-white">
        <MarketingHeader />
        <main className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 ring-4 ring-emerald-100 text-emerald-700 inline-flex items-center justify-center mb-5">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 mb-3">
            Check your inbox.
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            We sent a confirmation link to <strong className="text-slate-700">{email}</strong>.
            Click it to finish signing up. The link bounces back here and signs you in.
          </p>
          <Link
            href="/lobby"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
          >
            Continue anonymously while I wait <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-white">
      <MarketingHeader />
      <main className="max-w-md mx-auto px-6 py-16 lg:py-20">
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight mb-2">
          Create your account.
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Save your runs and history across devices. Free, no credit card.
        </p>

        {!authConfigured && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
            <p className="text-sm text-amber-900 font-semibold mb-1">Sign-up not configured</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Supabase isn&rsquo;t wired up yet. <Link href="/lobby" className="underline font-medium">Play anonymously</Link> in the meantime.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 mb-5 text-sm text-rose-700">{error}</div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => go(signInWithGoogle, "google")}
            disabled={!authConfigured || loading !== null}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon className="w-4 h-4" />}
            Sign up with Google
          </button>
          <button
            type="button"
            onClick={() => go(signInWithMicrosoft, "microsoft")}
            disabled={!authConfigured || loading !== null}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading === "microsoft" ? <Loader2 className="w-4 h-4 animate-spin" /> : <MicrosoftIcon className="w-4 h-4" />}
            Sign up with Microsoft
          </button>
          {!showEmail ? (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              disabled={!authConfigured}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 disabled:opacity-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Sign up with email
            </button>
          ) : (
            <form onSubmit={handleEmail} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@work.com"
                autoComplete="email"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (8+ chars)"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={loading !== null}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#00C2CB] hover:bg-[#00a9b1] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-slate-500 space-y-2">
          <div>
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-700 hover:text-cyan-800 font-medium underline underline-offset-2">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-slate-50" aria-hidden />}>
      <SignupInner />
    </Suspense>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
