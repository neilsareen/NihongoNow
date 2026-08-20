"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Field } from "@/app/components/field";
import { GoogleMark } from "@/app/components/google-mark";
import { Card, Wordmark, buttonStyles } from "@/app/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block">
            <Wordmark className="text-base" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-[13px] text-text-muted">Pick up where you left off.</p>
          </div>
        </div>

        <Card className="p-6 space-y-5">
          {error && (
            <p
              role="alert"
              className="text-[13px] text-danger bg-danger/10 border border-danger/25 rounded-lg px-3 py-2.5 leading-relaxed"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <button type="submit" disabled={loading} className={buttonStyles({ full: true })}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-surface text-[11px] uppercase tracking-wider text-text-subtle">or</span>
            </div>
          </div>

          <button onClick={handleGoogleLogin} className={buttonStyles({ variant: "secondary", full: true })}>
            <GoogleMark />
            Continue with Google
          </button>
        </Card>

        <p className="text-center text-[13px] text-text-subtle">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-text-muted hover:text-text transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
