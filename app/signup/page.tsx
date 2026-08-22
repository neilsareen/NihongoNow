"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Field } from "@/app/components/field";
import { GoogleMark } from "@/app/components/google-mark";
import { Card, Wordmark, buttonStyles, buttonVars } from "@/app/components/ui";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      window.location.href = "/onboarding";
    } else {
      setLoading(false);
      setSuccess(true);
    }
  }

  async function handleGoogleSignup() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm p-6 text-center space-y-3 animate-pop-in">
          <span className="w-14 h-14 rounded-tile bg-lime text-on-light grid place-items-center mx-auto elevated">
            <MailCheck className="w-7 h-7" strokeWidth={2.5} />
          </span>
          <h1 className="text-2xl">Check your email</h1>
          <p className="text-[14px] text-text-muted leading-relaxed font-medium">
            We sent a confirmation link to <span className="text-text font-medium">{email}</span>.
            Open it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block text-[14px] font-semibold text-text-subtle hover:text-text transition-colors pt-1"
          >
            Back to sign in
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block">
            <Wordmark />
          </Link>
          <div className="space-y-1">
            <h1 className="text-[28px]">Create your account</h1>
            <p className="text-[15px] text-text-muted font-medium">Free, and no prior Japanese needed.</p>
          </div>
        </div>

        <Card className="p-6 space-y-5 animate-pop-in">
          {error && (
            <p
              role="alert"
              className="text-[14px] text-rose bg-rose/12 border border-rose/35 rounded-tile px-4 py-3 leading-relaxed font-semibold animate-shake"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <Field
              id="name"
              label="Name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Your name"
            />
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
            <button type="submit" disabled={loading} className={buttonStyles({ full: true, size: "lg" })}
              style={buttonVars("primary")}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-surface font-display text-[11px] font-bold uppercase tracking-wider text-text-subtle">or</span>
            </div>
          </div>

          <button onClick={handleGoogleSignup} className={buttonStyles({ variant: "secondary", full: true, size: "lg" })}
            style={buttonVars("secondary")}>
            <GoogleMark />
            Continue with Google
          </button>
        </Card>

        <p className="text-center text-[14px] text-text-subtle font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-coral hover:brightness-110 transition-all font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
