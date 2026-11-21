import { dateInZone, timeInZone } from "./local-date";

export function toLocalInputValue(instant: string, timeZone: string): string {
  return `${dateInZone(instant, timeZone)}T${timeInZone(instant, timeZone)}`;
}
