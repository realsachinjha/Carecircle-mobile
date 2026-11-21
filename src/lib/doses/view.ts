import type { Slot } from "@/lib/gemini/schema";

export const SLOT_ORDER: Slot[] = ["MORNING", "AFTERNOON", "EVENING", "BEDTIME"];
export const EARLY_LIMIT_MS = 2 * 60 * 60 * 1000;

export type DoseStatus = "PENDING" | "ACKNOWLEDGED" | "SKIPPED" | "MISSED";

export type Dose = {
  reminder_id: string;
  scheduled_for: string;
  status: DoseStatus;
  acknowledged_at: string | null;
  slot: Slot;
  medication_name: string;
  dosage: string;
  instructions: string | null;
};

export type DoseView = "due" | "later" | "taken" | "skipped" | "missed" | "queued";

export function doseView(dose: Dose, now: Date, queued: boolean): DoseView {
  if (dose.status === "ACKNOWLEDGED") {
    return "taken";
  }
  if (dose.status === "SKIPPED") {
    return "skipped";
  }
  if (queued) {
    return "queued";
  }
  if (dose.status === "MISSED") {
    return "missed";
  }
  return new Date(dose.scheduled_for).getTime() - now.getTime() > EARLY_LIMIT_MS ? "later" : "due";
}

export function groupBySlot(doses: Dose[]): Array<{ slot: Slot; doses: Dose[] }> {
  return SLOT_ORDER.map((slot) => ({
    slot,
    doses: doses
      .filter((dose) => dose.slot === slot)
      .sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for) || a.medication_name.localeCompare(b.medication_name)),
  })).filter((group) => group.doses.length > 0);
}
