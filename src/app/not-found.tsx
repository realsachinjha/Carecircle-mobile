import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { strings } from "@/strings/en";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-4 text-3xl font-bold">{strings.notFound.title}</h1>
      <Link href="/start" className={buttonClass({ variant: "primary" })}>
        {strings.notFound.action}
      </Link>
    </main>
  );
}
