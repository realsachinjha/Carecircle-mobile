export type AckAction = "ACKNOWLEDGED" | "SKIPPED";
export type QueuedAck = { reminderId: string; action: AckAction; queuedAt: string };
export type SendOutcome = "done" | "retry";

export const QUEUE_KEY = "carecircle.ackQueue.v1";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isQueuedAck(value: unknown): value is QueuedAck {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.reminderId === "string" &&
    (item.action === "ACKNOWLEDGED" || item.action === "SKIPPED") &&
    typeof item.queuedAt === "string"
  );
}

export function readQueue(storage: StorageLike): QueuedAck[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(QUEUE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isQueuedAck) : [];
  } catch {
    return [];
  }
}

function writeQueue(storage: StorageLike, queue: QueuedAck[]) {
  storage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(storage: StorageLike, item: QueuedAck): QueuedAck[] {
  const queue = readQueue(storage).filter((existing) => existing.reminderId !== item.reminderId);
  queue.push(item);
  writeQueue(storage, queue);
  return queue;
}

export function removeFromQueue(storage: StorageLike, reminderId: string): QueuedAck[] {
  const queue = readQueue(storage).filter((existing) => existing.reminderId !== reminderId);
  writeQueue(storage, queue);
  return queue;
}

export async function flushQueue(
  storage: StorageLike,
  send: (item: QueuedAck) => Promise<SendOutcome>,
): Promise<QueuedAck[]> {
  for (const item of readQueue(storage)) {
    const outcome = await send(item);
    if (outcome === "retry") {
      break;
    }
    removeFromQueue(storage, item.reminderId);
  }
  return readQueue(storage);
}
