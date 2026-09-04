import test from "node:test";
import assert from "node:assert/strict";
import { fromCents, isValidWishInput, isValidWishMovement, toCents, wishProgress } from "../lib/wishes";
import type { Wish } from "../lib/types";

const wish: Wish = {
  id: "wish",
  name: "Birthday PC",
  targetCents: 50_000,
  balanceCents: 12_500,
  deadlineDate: "2026-11-30",
  eventDate: "2026-12-06",
  status: "active",
  createdAtMs: 1,
  createdBy: "Owner",
  updatedAtMs: 1,
  updatedBy: "Owner",
};

test("wish amounts use integer cents and calculate progress", () => {
  assert.equal(toCents(125.55), 12_555);
  assert.equal(fromCents(12_555), 125.55);
  assert.equal(wishProgress(wish), 25);
  assert.equal(wishProgress({ ...wish, balanceCents: 60_000 }), 100);
});

test("wish deadline cannot be after its event", () => {
  assert.equal(isValidWishInput({ name: "Birthday PC", targetAmount: 500, deadlineDate: "2026-11-30", eventDate: "2026-12-06" }), true);
  assert.equal(isValidWishInput({ name: "Birthday PC", targetAmount: 500, deadlineDate: "2026-12-07", eventDate: "2026-12-06" }), false);
});

test("withdrawals cannot exceed the current saved balance", () => {
  assert.equal(isValidWishMovement({ amount: 125, dateKey: "2026-11-30", note: "" }, wish.balanceCents, "withdrawal", "2026-12-01"), true);
  assert.equal(isValidWishMovement({ amount: 125.01, dateKey: "2026-11-30", note: "" }, wish.balanceCents, "withdrawal", "2026-12-01"), false);
});

test("wish movements cannot be future dated", () => {
  assert.equal(isValidWishMovement({ amount: 10, dateKey: "2026-12-02", note: "" }, wish.balanceCents, "contribution", "2026-12-01"), false);
});
