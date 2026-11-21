import { Card } from "@/components/ui/card";
import { EARLY_LIMIT_MS, groupBySlot, type Dose } from "@/lib/doses/view";
import { timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";

function doseStatusLabel(dose: Dose, timeZone: string, now: Date): string {
  if (dose.status === "ACKNOWLEDGED") {
    const time = dose.acknowledged_at
      ? timeInZone(dose.acknowledged_at, timeZone)
      : timeInZone(dose.scheduled_for, timeZone);
    return `${strings.patient.takenAt} ${time}`;
  }
  if (dose.status === "SKIPPED") {
    return strings.patient.skipped;
  }
  if (dose.status === "MISSED") {
    return strings.patient.missed;
  }
  if (new Date(dose.scheduled_for).getTime() - now.getTime() > EARLY_LIMIT_MS) {
    return strings.patient.later;
  }
  return strings.dashboard.waiting;
}

export function TodayDosesCard({ doses, timeZone }: { doses: Dose[]; timeZone: string }) {
  const groups = groupBySlot(doses);
  const now = new Date();

  return (
    <Card title={strings.dashboard.todayDosesTitle}>
      {groups.length === 0 ? (
        <p className="text-muted">{strings.patient.noDoses}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.slot} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {strings.slots[group.slot]}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.doses.map((dose) => (
                  <li
                    key={dose.reminder_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-line p-3"
                  >
                    <div>
                      <div className="font-semibold">{dose.medication_name}</div>
                      <div className="text-sm text-muted">
                        {dose.dosage} · {timeInZone(dose.scheduled_for, timeZone)}
                        {dose.instructions ? ` · ${dose.instructions}` : ""}
                      </div>
                    </div>
                    <span className="text-sm font-medium">{doseStatusLabel(dose, timeZone, now)}</span>
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
