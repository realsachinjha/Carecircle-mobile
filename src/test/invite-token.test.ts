import { describe, expect, it } from "vitest";
import {
  hashInviteToken,
  inviteTokenSchema,
  newInviteToken,
} from "@/lib/auth/invite-token";

describe("invite-token", () => {
  it("FR-3.1 newInviteToken returns a 43-char token and 64-char hex hash", () => {
    const { token, hash } = newInviteToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(token)).toBe(hash);
  });

  it("FR-3.1 generates distinct tokens across calls", () => {
    const first = newInviteToken();
    const second = newInviteToken();
    expect(first.token).not.toBe(second.token);
    expect(first.hash).not.toBe(second.hash);
  });

  it("FR-3.1 inviteTokenSchema rejects invalid lengths and URL-unsafe chars", () => {
    expect(inviteTokenSchema.safeParse("a".repeat(42)).success).toBe(false);
    expect(inviteTokenSchema.safeParse("a".repeat(44)).success).toBe(false);
    expect(inviteTokenSchema.safeParse("a".repeat(42) + "+").success).toBe(false);
    expect(inviteTokenSchema.safeParse("a".repeat(42) + "/").success).toBe(false);
    expect(inviteTokenSchema.safeParse("a".repeat(42) + "=").success).toBe(false);
    expect(inviteTokenSchema.safeParse("a".repeat(43)).success).toBe(true);
  });
});
