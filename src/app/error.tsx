"use client";

import { Button } from "@/components/ui/button";
import { strings } from "@/strings/en";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-4 text-3xl font-bold">{strings.systemError.title}</h1>
      {error.digest ? (
        <p className="mb-6 font-mono text-base text-muted">
          {strings.systemError.reference} {error.digest}
        </p>
      ) : null}
      <Button type="button" onClick={() => reset()}>
        {strings.systemError.tryAgain}
      </Button>
    </main>
  );
}
