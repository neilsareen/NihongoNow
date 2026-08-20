"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Field } from "@/app/components/field";
import { GoogleMark } from "@/app/components/google-mark";
import { Card, Wordmark, buttonStyles, buttonVars } from "@/app/components/ui";

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
            <Wordmark />
          </Link>
          <div className="space-y-1">
            <h1 className="text-[28px]">Welcome back</h1>
            <p className="text-[15px] text-text-muted font-medium">Pick up where you left off.</p>
          </div>
        </div>

        <Card className="p-6 space-y-5 animate-pop-in">
          {error && (
            <p
              role="alert"
              className="text-[14px] text-rose bg-rose/12 border-2 border-rose/35 rounded-tile px-4 py-3 leading-relaxed font-semibold animate-shake"
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
            <button type="submit" disabled={loading} className={buttonStyles({ full: true, size: "lg" })}
              style={buttonVars("primary")}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t-2 border-line" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-surface font-display text-[11px] font-bold uppercase tracking-wider text-text-subtle">or</span>
            </div>
          </div>

          <button onClick={handleGoogleLogin} className={buttonStyles({ variant: "secondary", full: true, size: "lg" })}
            style={buttonVars("secondary")}>
            <GoogleMark />
            Continue with Google
          </button>
        </Card>

        <p className="text-center text-[14px] text-text-subtle font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-coral hover:brightness-110 transition-all font-bold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
