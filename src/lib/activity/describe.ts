import { strings } from "@/strings/en";

function asRecord(val: unknown): Record<string, unknown> | null {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return null;
}

export function describeActivity(row: {
  action: string;
  target_table: string;
  before: unknown;
  after: unknown;
}): string {
  const { action, target_table, before, after } = row;
  const afterRec = asRecord(after);
  const beforeRec = asRecord(before);

  if (target_table === "medication_reminders" && action === "UPDATE" && afterRec) {
    const status = typeof afterRec.status === "string" ? afterRec.status : "";
    const statusLabel =
      status in strings.activity.doseStatus
        ? strings.activity.doseStatus[status as keyof typeof strings.activity.doseStatus]
        : status;
    return `${strings.activity.markedDose} ${statusLabel}`.trim();
  }

  if (target_table === "medications") {
    const name = typeof afterRec?.name === "string" ? afterRec.name : "";
    if (action === "INSERT" && name) {
      return `${strings.activity.addedMedicine} ${name}`;
    }
    if (action === "UPDATE" && afterRec?.status === "STOPPED" && name) {
      return `${strings.activity.stoppedMedicine} ${name}`;
    }
  }

  if (target_table === "medical_documents" && action === "UPDATE" && afterRec) {
    const status = typeof afterRec.extraction_status === "string" ? afterRec.extraction_status : "";
    if (status && (!beforeRec || beforeRec.extraction_status !== status)) {
      const statusLabel =
        status in strings.documents.statuses
          ? strings.documents.statuses[status as keyof typeof strings.documents.statuses]
          : status;
      return `${strings.activity.documentStatus} ${statusLabel}`;
    }
  }

  if (target_table === "caregiver_links") {
    if (action === "INSERT" && afterRec) {
      const roleKey = typeof afterRec.role === "string" ? afterRec.role : "";
      const roleLabel =
        roleKey in strings.roles ? strings.roles[roleKey as keyof typeof strings.roles] : roleKey;
      return `${strings.activity.gaveAccess} (${roleLabel})`;
    }
    if (action === "UPDATE" && afterRec?.status === "REVOKED") {
      return strings.activity.removedAccess;
    }
  }

  if (target_table === "consents") {
    if (action === "INSERT") {
      return strings.activity.gaveConsent;
    }
    if (action === "UPDATE" && afterRec?.withdrawn_at) {
      return strings.activity.withdrewConsent;
    }
  }

  const actionLabel =
    action in strings.activity.actions
      ? strings.activity.actions[action as keyof typeof strings.activity.actions]
      : action.toLowerCase();
  const tableLabel =
    target_table in strings.activity.tables
      ? strings.activity.tables[target_table as keyof typeof strings.activity.tables]
      : target_table;

  return `${actionLabel} ${tableLabel}`.trim();
}
