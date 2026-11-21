import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { flagsFor, type Extraction, type ExtractedMedicine } from "@/lib/gemini/schema";
import { strings } from "@/strings/en";

function formatSlots(slots: ExtractedMedicine["slots"]): string {
  if (!slots || slots.length === 0) {
    return strings.documents.notSet;
  }
  return slots.map((s) => strings.slots[s] ?? s).join(", ");
}

function getFlagLabels(medicine: ExtractedMedicine): string[] {
  const flags = flagsFor(medicine);
  const labels: string[] = [];
  if (flags.missingField) labels.push(strings.documents.flags.missingField);
  if (flags.slotMismatch) labels.push(strings.documents.flags.slotMismatch);
  if (flags.lowConfidence) labels.push(strings.documents.flags.lowConfidence);
  return labels;
}

export function ExtractionTable({
  extraction,
  demoMode,
}: {
  extraction: Extraction;
  demoMode: boolean;
}) {
  const medicines = extraction.medicines ?? [];
  const anyNeedsAttention = medicines.some((m) => flagsFor(m).needsAttention);

  return (
    <div className="flex flex-col gap-4">
      {demoMode && (
        <Notice tone="warning">{strings.documents.demoBadge}</Notice>
      )}

      <div>
        <h2 className="text-xl font-bold">{strings.documents.extractedTitle}</h2>
        <p className="text-base text-muted">{strings.documents.extractedIntro}</p>
      </div>

      {anyNeedsAttention && (
        <Notice tone="warning">{strings.documents.checkPhoto}</Notice>
      )}

      {medicines.length === 0 ? (
        <Card>
          <p className="text-base text-muted">{strings.documents.noMedicines}</p>
        </Card>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-base">
              <thead className="border-b border-line bg-panel text-sm text-muted">
                <tr>
                  <th className="p-3">{strings.documents.columns.name}</th>
                  <th className="p-3">{strings.documents.columns.dosage}</th>
                  <th className="p-3">{strings.documents.columns.frequency}</th>
                  <th className="p-3">{strings.documents.columns.slots}</th>
                  <th className="p-3">{strings.documents.columns.duration}</th>
                  <th className="p-3">{strings.documents.columns.instructions}</th>
                  <th className="p-3">{strings.documents.columns.confidence}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {medicines.map((med, index) => {
                  const flags = flagsFor(med);
                  const flagLabels = getFlagLabels(med);
                  return (
                    <tr
                      key={index}
                      className={
                        flags.needsAttention
                          ? "border-l-4 border-warn bg-warn/5"
                          : ""
                      }
                    >
                      <td className="p-3 font-medium">
                        <div>{med.name || strings.documents.notSet}</div>
                        {flagLabels.length > 0 && (
                          <div className="mt-1 flex flex-col gap-0.5 text-xs font-semibold text-warn">
                            {flagLabels.map((lbl, i) => (
                              <span key={i}>⚠ {lbl}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3">{med.dosage || strings.documents.notSet}</td>
                      <td className="p-3">{med.frequency_per_day}</td>
                      <td className="p-3">{formatSlots(med.slots)}</td>
                      <td className="p-3">
                        {med.duration_days ?? strings.documents.notSet}
                      </td>
                      <td className="p-3">
                        {med.instructions ?? strings.documents.notSet}
                      </td>
                      <td className="p-3">
                        {strings.documents.confidence[med.confidence] ?? med.confidence}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {medicines.map((med, index) => {
              const flags = flagsFor(med);
              const flagLabels = getFlagLabels(med);
              return (
                <Card
                  key={index}
                  className={`flex flex-col gap-2 ${
                    flags.needsAttention ? "border-l-4 border-warn" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold">
                      {med.name || strings.documents.notSet}
                    </h3>
                    <span className="text-sm font-medium text-muted">
                      {strings.documents.confidence[med.confidence] ?? med.confidence}
                    </span>
                  </div>
                  {flagLabels.length > 0 && (
                    <div className="flex flex-col gap-0.5 text-xs font-semibold text-warn">
                      {flagLabels.map((lbl, i) => (
                        <span key={i}>⚠ {lbl}</span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted">{strings.documents.columns.dosage}: </span>
                      <span className="font-medium">{med.dosage || strings.documents.notSet}</span>
                    </div>
                    <div>
                      <span className="text-muted">{strings.documents.columns.frequency}: </span>
                      <span className="font-medium">{med.frequency_per_day}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted">{strings.documents.columns.slots}: </span>
                      <span className="font-medium">{formatSlots(med.slots)}</span>
                    </div>
                    <div>
                      <span className="text-muted">{strings.documents.columns.duration}: </span>
                      <span className="font-medium">{med.duration_days ?? strings.documents.notSet}</span>
                    </div>
                    <div>
                      <span className="text-muted">{strings.documents.columns.instructions}: </span>
                      <span className="font-medium">{med.instructions ?? strings.documents.notSet}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
