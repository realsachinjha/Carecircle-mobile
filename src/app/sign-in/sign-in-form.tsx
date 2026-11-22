"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CareCircleIcon } from "@/components/brand/carecircle-logo";
import { Notice } from "@/components/ui/notice";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { strings } from "@/strings/en";

type Mode = "password" | "code";

export function SignInForm({ next, linkFailed }: { next: string; linkFailed: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
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
    <div className="relative mx-auto flex w-full max-w-sm flex-col items-center">
      <div className="mb-4 flex flex-col items-center text-center">
        <CareCircleIcon size={64} />
        <span className="mt-2 text-xl font-bold tracking-tight text-forest-deep">
          {strings.appName}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          {strings.auth.welcomeBack}
        </h1>
        <p className="mt-1 text-sm font-medium text-muted">
          {strings.auth.signInToContinue}
        </p>
      </div>

      <div className="w-full">
        <div role="tablist" className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-surface p-1 border border-line-soft">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "password"}
            onClick={() => {
              setMode("password");
              setMessage(null);
            }}
            className={`min-h-10 rounded-full text-xs font-semibold transition-colors ${
              mode === "password"
                ? "bg-forest text-white shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            {strings.auth.passwordTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "code"}
            onClick={() => {
              setMode("code");
              setMessage(null);
            }}
            className={`min-h-10 rounded-full text-xs font-semibold transition-colors ${
              mode === "code"
                ? "bg-forest text-white shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            {strings.auth.codeTab}
          </button>
        </div>

        {message ? (
          <div className="mb-4">
            <Notice tone="error">{message}</Notice>
          </div>
        ) : null}

        {mode === "password" ? (
          <form onSubmit={signInWithPassword} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-xs font-semibold text-muted">
                {strings.auth.email}
              </label>
              <div className="relative flex items-center rounded-2xl border border-line-soft bg-white px-4 py-3 shadow-xs focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
                <svg className="h-5 w-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={strings.auth.emailPlaceholder}
                  className="ml-3 w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-xs font-semibold text-muted">
                {strings.auth.password}
              </label>
              <div className="relative flex items-center rounded-2xl border border-line-soft bg-white px-4 py-3 shadow-xs focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
                <svg className="h-5 w-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={strings.auth.passwordPlaceholder}
                  className="ml-3 w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-6 text-base font-semibold text-white shadow-sm transition-transform active:scale-98 hover:bg-forest-deep disabled:opacity-50"
            >
              {busy ? strings.common.saving : strings.auth.signIn}
            </button>
          </form>
        ) : null}

        {mode === "code" && !codeSentTo ? (
          <form onSubmit={sendCode} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="email-code" className="text-xs font-semibold text-muted">
                {strings.auth.email}
              </label>
              <div className="relative flex items-center rounded-2xl border border-line-soft bg-white px-4 py-3 shadow-xs focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
                <svg className="h-5 w-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <input
                  id="email-code"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={strings.auth.emailPlaceholder}
                  className="ml-3 w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-6 text-base font-semibold text-white shadow-sm transition-transform active:scale-98 hover:bg-forest-deep disabled:opacity-50"
            >
              {busy ? strings.auth.sending : strings.auth.sendCode}
            </button>
          </form>
        ) : null}

        {mode === "code" && codeSentTo ? (
          <form onSubmit={verifyCode} className="flex flex-col gap-3.5">
            <p className="text-center text-sm text-muted">
              {strings.auth.codeSent} <strong className="text-ink">{codeSentTo}</strong>
            </p>
            <div className="flex flex-col gap-1">
              <label htmlFor="code" className="text-xs font-semibold text-muted text-center">
                {strings.auth.code}
              </label>
              <div className="relative flex items-center rounded-2xl border border-line-soft bg-white px-4 py-3 shadow-xs focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-bold text-ink outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-6 text-base font-semibold text-white shadow-sm transition-transform active:scale-98 hover:bg-forest-deep disabled:opacity-50"
            >
              {busy ? strings.common.saving : strings.auth.verify}
            </button>

            <button
              type="button"
              onClick={() => {
                setCodeSentTo(null);
                setCode("");
              }}
              className="text-center text-xs font-semibold text-muted hover:text-ink"
            >
              {strings.auth.useDifferentEmail}
            </button>
          </form>
        ) : null}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-line-soft" />
          <span className="text-xs font-medium text-muted uppercase">{strings.auth.or}</span>
          <div className="h-px flex-1 bg-line-soft" />
        </div>

        <button
          type="button"
          disabled
          aria-label={strings.auth.continueWithGoogle}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line-soft bg-white px-6 text-sm font-semibold text-ink shadow-xs opacity-80 cursor-not-allowed"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{strings.auth.continueWithGoogle}</span>
        </button>

        <div className="mt-6 text-center text-sm text-muted">
          <span>{strings.auth.noAccountPrompt} </span>
          <Link href="/sign-up" className="font-bold text-forest hover:underline">
            {strings.auth.signUpLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
