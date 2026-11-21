export type DayCounts = { date: string; taken: number; skipped: number; missed: number; pending: number };
export type Compliance = { days: DayCounts[]; totals: Omit<DayCounts, "date"> };

export function settled(counts: Omit<DayCounts, "date">): number {
  return counts.taken + counts.skipped + counts.missed;
}

export function compliancePercent(counts: Omit<DayCounts, "date">): number | null {
  const total = settled(counts);
  return total === 0 ? null : Math.round((counts.taken / total) * 100);
}
