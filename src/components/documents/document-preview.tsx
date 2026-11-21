"use client";

import { useCallback, useEffect, useState } from "react";
import { callApi } from "@/lib/client/call-api";
import { strings } from "@/strings/en";

type PreviewProps = {
  documentId: string;
  mimeType: string;
};

export function DocumentPreview({ documentId, mimeType }: PreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [retried, setRetried] = useState(false);
  const [failed, setFailed] = useState(false);

  const fetchUrl = useCallback(async (): Promise<string | null> => {
    const result = await callApi<{ url: string }>(
      `/api/documents/${documentId}/url`,
      "GET"
    );
    if (!result.ok) {
      return null;
    }
    return result.data.url;
  }, [documentId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const fetched = await fetchUrl();
      if (cancelled) return;
      if (fetched) {
        setUrl(fetched);
      } else {
        setFailed(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchUrl]);

  async function handleImageError() {
    if (retried) {
      setFailed(true);
      return;
    }
    setRetried(true);
    const refreshed = await fetchUrl();
    if (refreshed) {
      setUrl(refreshed);
    } else {
      setFailed(true);
    }
  }

  async function openPdfInNewTab(event: React.MouseEvent) {
    event.preventDefault();
    const freshUrl = await fetchUrl();
    if (freshUrl) {
      window.open(freshUrl, "_blank", "noopener,noreferrer");
    }
  }

  if (failed) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-line p-4 text-center text-muted">
        {strings.documents.previewFailed}
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-line p-4 text-center text-muted">
        …
      </div>
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <div className="flex flex-col gap-2">
        <iframe
          src={url}
          title={strings.documents.openPdf}
          className="h-[70vh] w-full rounded-lg border border-line"
        />
        <div>
          <button
            type="button"
            onClick={openPdfInNewTab}
            className="text-base font-medium text-accent underline"
          >
            {strings.documents.openPdf}
          </button>
        </div>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={strings.documents.previewAlt}
      onError={handleImageError}
      className="max-h-[70vh] w-full rounded-lg border border-line object-contain"
    />
  );
}
