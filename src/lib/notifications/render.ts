import { strings } from "@/strings/en";
import { dateInZone, timeInZone } from "@/lib/time/local-date";

export function renderNotification(
  kind: string,
  data: Record<string, unknown> = {},
  timeZone: string,
): { title: string; body: string } {
  if (kind === "INVITE_ACCEPTED") {
    const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : strings.notifications.someone;
    const roleKey = typeof data.role === "string" ? data.role : "";
    const roleLabel =
      roleKey in strings.roles ? strings.roles[roleKey as keyof typeof strings.roles] : roleKey;
    return {
      title: strings.notifications.inviteAccepted,
      body: `${name} ${strings.notifications.joinedAs} ${roleLabel}`.trim(),
    };
  }

  if (kind === "DOCUMENT_PARSED") {
    return {
      title: strings.notifications.documentParsed,
      body: strings.notifications.documentParsedBody,
    };
  }

  if (kind === "DOCUMENT_FAILED") {
    const code = typeof data.code === "string" ? data.code : "";
    const body =
      code in strings.errors
        ? strings.errors[code as keyof typeof strings.errors]
        : strings.errors.AI_UNAVAILABLE;
    return {
      title: strings.notifications.documentFailed,
      body,
    };
  }

  if (kind === "DOSE_MISSED") {
    const medicationName =
      typeof data.medicationName === "string"
        ? data.medicationName
        : typeof data.medication_name === "string"
          ? data.medication_name
          : "";
    const dosage = typeof data.dosage === "string" ? data.dosage : "";
    const scheduledFor =
      typeof data.scheduledFor === "string"
        ? data.scheduledFor
        : typeof data.scheduled_for === "string"
          ? data.scheduled_for
          : typeof data.time === "string"
            ? data.time
            : "";
    const timeStr = scheduledFor ? timeInZone(scheduledFor, timeZone) : "";
    const medDose = [medicationName, dosage].filter(Boolean).join(" ");
    const body = timeStr ? (medDose ? `${medDose} at ${timeStr}` : `at ${timeStr}`) : medDose;
    return {
      title: strings.notifications.doseMissed,
      body,
    };
  }

  if (kind === "CHECKUP_SOON") {
    const doctorName =
      typeof data.doctorName === "string"
        ? data.doctorName
        : typeof data.doctor_name === "string"
          ? data.doctor_name
          : "";
    const appointmentTime =
      typeof data.appointmentTime === "string"
        ? data.appointmentTime
        : typeof data.appointment_time === "string"
          ? data.appointment_time
          : "";
    let whenStr = "";
    if (appointmentTime) {
      const date = dateInZone(appointmentTime, timeZone);
      const time = timeInZone(appointmentTime, timeZone);
      whenStr = `${date} at ${time}`;
    }
    const body = doctorName && whenStr ? `${doctorName}, ${whenStr}` : doctorName || whenStr;
    return {
      title: strings.notifications.checkupSoon,
      body,
    };
  }

  return {
    title: strings.notifications.generic,
    body: "",
  };
}

export function notificationLink(
  kind: string,
  data: Record<string, unknown> = {},
  patientId?: string | null,
): string | null {
  if (!patientId) {
    return null;
  }
  if (kind.startsWith("DOCUMENT_")) {
    const docId =
      typeof data.documentId === "string"
        ? data.documentId
        : typeof data.document_id === "string"
          ? data.document_id
          : null;
    return docId ? `/patients/${patientId}/documents/${docId}` : null;
  }
  if (kind === "DOSE_MISSED") {
    return `/patients/${patientId}`;
  }
  if (kind === "CHECKUP_SOON") {
    return `/patients/${patientId}/checkups`;
  }
  if (kind === "INVITE_ACCEPTED") {
    return `/patients/${patientId}/people`;
  }
  return null;
}
