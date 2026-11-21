import type { Slot } from "@/lib/gemini/schema";
import type { FrequencyType } from "./defaults";
import { strings } from "@/strings/en";

type DescribeInput = {
  slot: Slot | string;
  target_time: string;
  frequency_type: FrequencyType | string;
  weekdays?: number[] | null;
  interval_days?: number | null;
  start_date?: string | null;
  end_date?: string | null;
};

export function describeSchedule(schedule: DescribeInput): string {
  const slotName = strings.slots[schedule.slot as Slot] ?? schedule.slot;
  const time = schedule.target_time.slice(0, 5);
  const parts = [`${slotName} ${strings.medicines.describe.at} ${time}`];

  if (schedule.frequency_type === "DAILY") {
    parts.push(strings.medicines.describe.everyDay);
  } else if (schedule.frequency_type === "SPECIFIC_DAYS" && schedule.weekdays?.length) {
    const days = schedule.weekdays
      .map((d) => strings.medicines.weekdayNames[d as 1 | 2 | 3 | 4 | 5 | 6 | 7] ?? String(d))
      .join(", ");
    parts.push(`${strings.medicines.describe.on} ${days}`);
  } else if (schedule.frequency_type === "EVERY_N_DAYS" && schedule.interval_days) {
    parts.push(`${strings.medicines.describe.every} ${schedule.interval_days} ${strings.medicines.describe.days}`);
  }

  if (schedule.start_date && schedule.end_date) {
    parts.push(`${strings.medicines.describe.from} ${schedule.start_date} ${strings.medicines.describe.until} ${schedule.end_date}`);
  } else if (schedule.end_date) {
    parts.push(`${strings.medicines.describe.until} ${schedule.end_date}`);
  }

  return parts.join(", ");
}
