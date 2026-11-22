import Link from "next/link";
import { CareCircleIcon } from "@/components/brand/carecircle-logo";
import { Disclaimer } from "@/components/disclaimer";
import { strings } from "@/strings/en";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-ivory px-6 py-10">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sage-soft/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-sage/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-24 w-24 items-center justify-center">
          <CareCircleIcon size={84} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-forest-deep sm:text-4xl">
          {strings.appName}
        </h1>
        <p className="mt-2 text-lg font-medium text-forest">
          {strings.landing.tagline}
        </p>
        <h2 className="mt-1 text-sm font-medium text-muted max-w-xs">
          {strings.landing.title}
        </h2>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/sign-up"
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-6 text-base font-semibold text-white shadow-sm transition-transform active:scale-98 hover:bg-forest-deep"
        >
          {strings.landing.getStarted}
        </Link>
        <Link
          href="/sign-in"
          className="flex min-h-11 w-full items-center justify-center rounded-full text-base font-semibold text-forest transition-colors hover:bg-sage-soft"
        >
          {strings.landing.signIn}
        </Link>
        <div className="mt-4">
          <Disclaimer />
        </div>
      </div>
    </main>
  );
}
