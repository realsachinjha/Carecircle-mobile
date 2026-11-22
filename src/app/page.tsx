import Link from "next/link";
import { Disclaimer } from "@/components/disclaimer";
import { strings } from "@/strings/en";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-forest-deep p-8 text-white shadow-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-peach text-forest-deep shadow-xs">
          <svg className="h-7 w-7 fill-terracotta" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold tracking-wider text-peach uppercase">{strings.appName}</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{strings.landing.title}</h1>
        </div>
        <p className="text-base text-white/80 leading-relaxed">{strings.landing.body}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-in"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-base font-bold text-forest-deep shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {strings.landing.signIn}
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 text-base font-bold text-white transition-colors hover:bg-white/20 active:scale-[0.98]"
          >
            {strings.landing.signUp}
          </Link>
        </div>
      </div>
      <Disclaimer />
    </main>
  );
}
