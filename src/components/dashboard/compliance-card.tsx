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

  const displayPercent = todayPercent ?? totalPercent ?? 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, displayPercent)) / 100) * circumference;

  const formatter = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <Card title={strings.dashboard.complianceTitle}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-sage-light p-4 sm:flex-row sm:items-center sm:gap-6 border border-line">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center self-center sm:self-auto">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="stroke-sage fill-none"
                strokeWidth="8"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="stroke-forest fill-none transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-forest">
                {todayPercent !== null ? `${todayPercent}%` : totalPercent !== null ? `${totalPercent}%` : "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">
              {strings.dashboard.today}
            </div>
            {todayPercent !== null ? (
              <div className="text-lg font-bold text-ink">
                {todayCounts.taken} {strings.dashboard.takenOf} {todaySettled}
                {todayCounts.pending > 0 ? (
                  <span className="font-normal text-muted">
                    {" · "}
                    {todayCounts.pending} {strings.dashboard.waiting}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="text-sm font-medium text-muted">
                {strings.dashboard.noDosesYet}
              </div>
            )}
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-sage">
              <div
                className="h-full rounded-full bg-forest transition-all duration-500"
                style={{ width: `${displayPercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{strings.dashboard.last7Days}: {totalPercent !== null ? `${totalPercent}%` : strings.dashboard.noDosesYet}</span>
              <span>{compliance.totals.taken} {strings.dashboard.takenOf} {totalSettled}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {compliance.days.map((day) => {
            const daySettled = settled(day);
            const dayPercent = compliancePercent(day);
            const dateLabel = formatter.format(new Date(day.date + "T00:00:00Z"));

            return (
              <div key={day.date} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-28 text-sm font-medium text-ink">{dateLabel}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface border border-line" aria-hidden="true">
                  {dayPercent !== null && dayPercent > 0 ? (
                    <div className="h-full rounded-full bg-forest" style={{ width: `${dayPercent}%` }} />
                  ) : null}
                </div>
                <span className="w-28 text-right text-xs font-medium text-muted">
                  {day.taken} {strings.dashboard.takenOf} {daySettled}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted">{strings.dashboard.settledHint}</p>
      </div>
    </Card>
  );
}
