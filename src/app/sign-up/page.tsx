"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Disclaimer } from "@/components/disclaimer";
import { strings } from "@/strings/en";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    const supabase = createSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/start`,
      },
    });
    setBusy(false);
    if (signUpError) {
      setError(true);
      return;
    }
    setSuccess(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-6 rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">{strings.appName}</span>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{strings.auth.signUpTitle}</h1>
          <p className="text-sm text-muted">{strings.auth.signUpIntro}</p>
        </div>

        {success ? (
          <div className="flex flex-col gap-4">
            <Notice tone="success">{strings.auth.checkEmail}</Notice>
            <Link
              href="/sign-in"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-6 text-base font-semibold text-white shadow-xs transition-colors hover:bg-forest-deep"
            >
              {strings.landing.signIn}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? <Notice tone="error">{strings.errors.VALIDATION_FAILED}</Notice> : null}
            <TextField
              id="fullName"
              label={strings.auth.fullName}
              required
              maxLength={128}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <TextField
              id="email"
              label={strings.auth.email}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              id="password"
              label={strings.auth.password}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              hint={strings.auth.passwordHint}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              {busy ? strings.common.saving : strings.auth.createAccount}
            </Button>
          </form>
        )}

        <div className="pt-2 text-center text-sm border-t border-line">
          <Link href="/sign-in" className="font-semibold text-forest hover:underline">
            {strings.auth.haveAccount}
          </Link>
        </div>
      </div>
      <Disclaimer />
    </main>
  );
}
