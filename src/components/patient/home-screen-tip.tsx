"use client";

import { useEffect, useState } from "react";
import { strings } from "@/strings/en";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "carecircle.homeTipDismissed";

export function HomeScreenTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
      if (!isStandalone && !dismissed) {
        setVisible(true);
      }
    });
  }, []);

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 text-ink">
      <p className="text-lg leading-relaxed">{strings.patient.homeScreenTip}</p>
      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleDismiss}
          className="min-h-10 text-base"
        >
          {strings.patient.dismiss}
        </Button>
      </div>
    </aside>
  );
}
