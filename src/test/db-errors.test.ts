import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { fromDb } from "@/lib/db-errors";

describe("db-errors", () => {
  it("maps recognized error message strings to AppError", () => {
    const err = fromDb({ message: "EXPIRED", code: "P0001" });
    expect(err).toBeInstanceOf(AppError);
    if (err instanceof AppError) {
      expect(err.code).toBe("EXPIRED");
    }
  });

  it("maps Postgres code 42501 to FORBIDDEN", () => {
    const err = fromDb({ code: "42501", message: "permission denied" });
    expect(err).toBeInstanceOf(AppError);
    if (err instanceof AppError) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("maps Postgres code 23505 to CONFLICT", () => {
    const err = fromDb({ code: "23505" });
    expect(err).toBeInstanceOf(AppError);
    if (err instanceof AppError) {
      expect(err.code).toBe("CONFLICT");
    }
  });

  it("maps validation and constraint errors to VALIDATION_FAILED", () => {
    const err1 = fromDb({ code: "22008" });
    const err2 = fromDb({ code: "23514" });
    expect(err1).toBeInstanceOf(AppError);
    expect(err2).toBeInstanceOf(AppError);
    if (err1 instanceof AppError && err2 instanceof AppError) {
      expect(err1.code).toBe("VALIDATION_FAILED");
      expect(err2.code).toBe("VALIDATION_FAILED");
    }
  });

  it("maps unclassified database errors to generic Error", () => {
    const err = fromDb({ code: "XX000", message: "boom" });
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(AppError);
    expect(err.message).toBe("database");
  });
});
