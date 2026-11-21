"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Notice } from "@/components/ui/notice";
import { strings } from "@/strings/en";

export function DeleteCheckupButton({
  checkupId,
}: {
  checkupId: string;
  patientId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(strings.checkups.confirmDelete)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/checkups/${checkupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={submitting}
      className="min-h-12 px-3 text-sm font-semibold text-danger underline disabled:opacity-50"
    >
      {strings.checkups.delete}
    </button>
  );
}

export function CompleteCheckupForm({
  checkupId,
}: {
  checkupId: string;
  patientId?: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleComplete(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/checkups/${checkupId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errKey = data?.error as keyof typeof strings.errors;
        setError(strings.errors[errKey] ?? strings.errors.INTERNAL);
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError(strings.errors.INTERNAL);
      setSubmitting(false);
    }
  }

  return (
    <details className="mt-2 rounded border border-line p-3">
      <summary className="cursor-pointer font-medium text-accent">
        {strings.checkups.complete}
      </summary>
      <form onSubmit={handleComplete} className="mt-3 flex flex-col gap-3">
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="flex flex-col gap-1">
          <label htmlFor={`clinicalNotes-${checkupId}`} className="text-sm font-medium">
            {strings.checkups.clinicalNotes}
          </label>
          <textarea
            id={`clinicalNotes-${checkupId}`}
            maxLength={4000}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded border border-line bg-paper p-2 text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 rounded bg-ok px-4 font-semibold text-paper disabled:opacity-50"
          >
            {submitting ? strings.common.saving : strings.checkups.complete}
          </button>
        </div>
      </form>
    </details>
  );
}
