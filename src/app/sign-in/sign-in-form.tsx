"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { strings } from "@/strings/en";

type Mode = "code" | "password";

export function SignInForm({ next, linkFailed }: { next: string; linkFailed: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(linkFailed ? strings.auth.linkFailed : null);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) {
      setMessage(error.status === 429 ? strings.errors.RATE_LIMITED : strings.errors.VALIDATION_FAILED);
      return;
    }
    setCodeSentTo(cleanEmail);
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!codeSentTo) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({ email: codeSentTo, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) {
      setMessage(strings.auth.wrongCode);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (error) {
      setMessage(error.code === "email_not_confirmed" ? strings.auth.unconfirmed : strings.auth.wrongPassword);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">{strings.appName}</span>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{strings.auth.signInTitle}</h1>
      </div>

      <div role="tablist" className="grid grid-cols-2 gap-2 rounded-full bg-surface p-1 border border-line">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "code"}
          onClick={() => setMode("code")}
          className={`min-h-10 rounded-full text-sm font-semibold transition-colors ${
            mode === "code"
              ? "bg-forest text-white shadow-xs"
              : "text-muted hover:text-ink"
          }`}
        >
          {strings.auth.codeTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          onClick={() => setMode("password")}
          className={`min-h-10 rounded-full text-sm font-semibold transition-colors ${
            mode === "password"
              ? "bg-forest text-white shadow-xs"
              : "text-muted hover:text-ink"
          }`}
        >
          {strings.auth.passwordTab}
        </button>
      </div>

      {message ? <Notice tone="error">{message}</Notice> : null}

      {mode === "code" && !codeSentTo ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <TextField id="email" label={strings.auth.email} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={busy}>{busy ? strings.auth.sending : strings.auth.sendCode}</Button>
        </form>
      ) : null}

      {mode === "code" && codeSentTo ? (
        <form onSubmit={verifyCode} className="flex flex-col gap-4">
          <p className="text-sm text-muted">{strings.auth.codeSent} <strong className="text-ink">{codeSentTo}</strong></p>
          <TextField id="code" label={strings.auth.code} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" disabled={busy}>{strings.auth.verify}</Button>
          <Button type="button" variant="secondary" onClick={() => { setCodeSentTo(null); setCode(""); }}>{strings.auth.useDifferentEmail}</Button>
        </form>
      ) : null}

      {mode === "password" ? (
        <form onSubmit={signInWithPassword} className="flex flex-col gap-4">
          <TextField id="email" label={strings.auth.email} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField id="password" label={strings.auth.password} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={busy}>{strings.auth.signIn}</Button>
        </form>
      ) : null}

      <div className="pt-2 text-center text-sm border-t border-line">
        <Link href="/sign-up" className="font-semibold text-forest hover:underline">{strings.auth.noAccount}</Link>
      </div>
    </div>
  );
}
