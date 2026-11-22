import { SignInForm } from "./sign-in-form";
import { safeNextPath } from "@/lib/auth/next-path";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-ivory px-6 py-12">
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-sage-soft/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-10 -left-20 h-72 w-72 rounded-full bg-sage/40 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto w-full max-w-sm">
        <SignInForm next={safeNextPath(next)} linkFailed={error === "link"} />
      </div>
    </main>
  );
}
