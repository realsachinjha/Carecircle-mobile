import { Card } from "@/components/ui/card";
import { type Compliance, compliancePercent, settled } from "@/lib/dashboard/compliance";
import { strings } from "@/strings/en";

export function ComplianceCard({ compliance }: { compliance: Compliance; timeZone: string }) {
  const todayCounts = compliance.days[compliance.days.length - 1] ?? {
    date: "",
    taken: 0,
    skipped: 0,
    missed: 0,
    pending: 0,
  };
  const todaySettled = settled(todayCounts);
  const todayPercent = compliancePercent(todayCounts);

  const totalSettled = settled(compliance.totals);
  const totalPercent = compliancePercent(compliance.totals);

  const formatter = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <Card title={strings.dashboard.complianceTitle}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border border-line p-4">
          <div className="text-sm font-semibold text-muted">{strings.dashboard.today}</div>
          {todayPercent !== null ? (
            <div>
              <div className="text-3xl font-extrabold">{todayPercent}%</div>
              <div className="text-sm text-muted">
                {todayCounts.taken} {strings.dashboard.takenOf} {todaySettled}
                {todayCounts.pending > 0 ? (
                  <span>
                    {" · "}
                    {todayCounts.pending} {strings.dashboard.waiting}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-base text-muted">{strings.dashboard.noDosesYet}</div>
          )}
        </div>

        <div className="rounded border border-line p-4">
          <div className="text-sm font-semibold text-muted">{strings.dashboard.last7Days}</div>
          {totalPercent !== null ? (
            <div>
              <div className="text-3xl font-extrabold">{totalPercent}%</div>
              <div className="text-sm text-muted">
                {compliance.totals.taken} {strings.dashboard.takenOf} {totalSettled}
                {compliance.totals.pending > 0 ? (
                  <span>
                    {" · "}
                    {compliance.totals.pending} {strings.dashboard.waiting}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-base text-muted">{strings.dashboard.noDosesYet}</div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {compliance.days.map((day) => {
          const daySettled = settled(day);
          const dayPercent = compliancePercent(day);
          const dateLabel = formatter.format(new Date(day.date + "T00:00:00Z"));

          return (
            <div key={day.date} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-28 text-sm font-medium">{dateLabel}</span>
              <div className="h-3 flex-1 overflow-hidden rounded bg-panel border border-line" aria-hidden="true">
                {dayPercent !== null && dayPercent > 0 ? (
                  <div className="h-full bg-ok" style={{ width: `${dayPercent}%` }} />
                ) : null}
              </div>
              <span className="w-28 text-right text-xs text-muted">
                {day.taken} {strings.dashboard.takenOf} {daySettled}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted">{strings.dashboard.settledHint}</p>
    </Card>
  );
}
