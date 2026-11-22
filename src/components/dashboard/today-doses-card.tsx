import { Card } from "@/components/ui/card";
import { EARLY_LIMIT_MS, groupBySlot, type Dose } from "@/lib/doses/view";
import { timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";

function doseStatusBadge(dose: Dose, timeZone: string, now: Date) {
  if (dose.status === "ACKNOWLEDGED") {
    const time = dose.acknowledged_at
      ? timeInZone(dose.acknowledged_at, timeZone)
      : timeInZone(dose.scheduled_for, timeZone);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-semibold text-forest">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        {strings.patient.takenAt} {time}
      </span>
    );
  }
  if (dose.status === "SKIPPED") {
    return (
      <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
        {strings.patient.skipped}
      </span>
    );
  }
  if (dose.status === "MISSED") {
    return (
      <span className="rounded-full bg-peach px-2.5 py-0.5 text-xs font-bold text-terracotta-ink">
        {strings.patient.missed}
      </span>
    );
  }
  if (new Date(dose.scheduled_for).getTime() - now.getTime() > EARLY_LIMIT_MS) {
    return (
      <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
        {strings.patient.later}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">
      {strings.dashboard.waiting}
    </span>
  );
}

export function TodayDosesCard({ doses, timeZone }: { doses: Dose[]; timeZone: string }) {
  const groups = groupBySlot(doses);
  const now = new Date();

  return (
    <Card title={strings.dashboard.todayDosesTitle}>
      {groups.length === 0 ? (
        <p className="text-sm text-muted">{strings.patient.noDoses}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.slot} className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {strings.slots[group.slot]}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.doses.map((dose) => (
                  <li
                    key={dose.reminder_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface/40 p-3.5 transition-colors hover:bg-white"
                  >
                    <div>
                      <div className="font-bold text-ink">{dose.medication_name}</div>
                      <div className="text-xs text-muted">
                        {dose.dosage} · {timeInZone(dose.scheduled_for, timeZone)}
                        {dose.instructions ? ` · ${dose.instructions}` : ""}
                      </div>
                    </div>
                    <div>{doseStatusBadge(dose, timeZone, now)}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
