import { describe, expect, it } from "vitest";
import {
  enqueue,
  flushQueue,
  readQueue,
  QUEUE_KEY,
  type QueuedAck,
  type SendOutcome,
} from "@/lib/offline/ack-queue";

function createMockStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  };
}

describe("ack-queue helpers", () => {
  it("FR-8.7 keeps only the latest action when enqueueing same reminder twice", () => {
    const storage = createMockStorage();
    enqueue(storage, {
      reminderId: "rem-1",
      action: "ACKNOWLEDGED",
      queuedAt: "2026-03-10T08:00:00Z",
    });
    const updated = enqueue(storage, {
      reminderId: "rem-1",
      action: "SKIPPED",
      queuedAt: "2026-03-10T08:05:00Z",
    });

    expect(updated).toHaveLength(1);
    expect(updated[0]!.action).toBe("SKIPPED");
    expect(readQueue(storage)).toEqual(updated);
  });

  it("handles corrupted, malformed, or invalid queue data", () => {
    const emptyStorage = createMockStorage();
    expect(readQueue(emptyStorage)).toEqual([]);

    const badJsonStorage = createMockStorage({ [QUEUE_KEY]: "invalid json{" });
    expect(readQueue(badJsonStorage)).toEqual([]);

    const badShapeStorage = createMockStorage({
      [QUEUE_KEY]: JSON.stringify([{ reminderId: 1, action: "UNKNOWN" }]),
    });
    expect(readQueue(badShapeStorage)).toEqual([]);
  });

  it("flushQueue empties the queue when all items succeed in order", () => {
    const storage = createMockStorage();
    enqueue(storage, { reminderId: "1", action: "ACKNOWLEDGED", queuedAt: "T1" });
    enqueue(storage, { reminderId: "2", action: "SKIPPED", queuedAt: "T2" });

    const sentIds: string[] = [];
    return flushQueue(storage, async (item: QueuedAck): Promise<SendOutcome> => {
      sentIds.push(item.reminderId);
      return "done";
    }).then((remaining) => {
      expect(sentIds).toEqual(["1", "2"]);
      expect(remaining).toHaveLength(0);
      expect(readQueue(storage)).toHaveLength(0);
    });
  });

  it("flushQueue stops and keeps all items if the first item returns retry", () => {
    const storage = createMockStorage();
    enqueue(storage, { reminderId: "1", action: "ACKNOWLEDGED", queuedAt: "T1" });
    enqueue(storage, { reminderId: "2", action: "SKIPPED", queuedAt: "T2" });

    const sentIds: string[] = [];
    return flushQueue(storage, async (item: QueuedAck): Promise<SendOutcome> => {
      sentIds.push(item.reminderId);
      return "retry";
    }).then((remaining) => {
      expect(sentIds).toEqual(["1"]);
      expect(remaining).toHaveLength(2);
      expect(readQueue(storage)).toHaveLength(2);
    });
  });

  it("flushQueue removes done items and keeps retry items", () => {
    const storage = createMockStorage();
    enqueue(storage, { reminderId: "1", action: "ACKNOWLEDGED", queuedAt: "T1" });
    enqueue(storage, { reminderId: "2", action: "SKIPPED", queuedAt: "T2" });

    return flushQueue(storage, async (item: QueuedAck): Promise<SendOutcome> => {
      if (item.reminderId === "1") {
        return "done";
      }
      return "retry";
    }).then((remaining) => {
      expect(remaining).toHaveLength(1);
      expect(remaining[0]!.reminderId).toBe("2");
      expect(readQueue(storage)).toHaveLength(1);
    });
  });
});
