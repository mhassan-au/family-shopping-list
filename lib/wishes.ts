import type { Wish, WishTransaction } from "./types";

export const WISH_LIMITS = {
  name: 80,
  note: 160,
  amountCents: 999_999_999,
} as const;

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function toCents(amount: number) {
  return Math.round(amount * 100);
}

export function fromCents(cents: number) {
  return cents / 100;
}

export function isValidWishInput(input: { name: string; targetAmount: number; deadlineDate: string; eventDate: string }) {
  const name = input.name.trim();
  const targetCents = toCents(input.targetAmount);
  return name.length > 0
    && name.length <= WISH_LIMITS.name
    && Number.isInteger(targetCents)
    && targetCents > 0
    && targetCents <= WISH_LIMITS.amountCents
    && dateKeyPattern.test(input.deadlineDate)
    && dateKeyPattern.test(input.eventDate)
    && input.deadlineDate <= input.eventDate;
}

export function isValidWishMovement(input: { amount: number; dateKey: string; note: string }, balanceCents: number, type: "contribution" | "withdrawal", latestDate: string) {
  const amountCents = toCents(input.amount);
  return Number.isInteger(amountCents)
    && amountCents > 0
    && amountCents <= WISH_LIMITS.amountCents
    && dateKeyPattern.test(input.dateKey)
    && input.dateKey <= latestDate
    && input.note.trim().length <= WISH_LIMITS.note
    && (type !== "withdrawal" || amountCents <= balanceCents);
}

export function wishProgress(wish: Wish) {
  return Math.min(100, Math.round((wish.balanceCents / wish.targetCents) * 100));
}

export function wishTransactionAmount(transaction: WishTransaction) {
  return fromCents(transaction.amountCents);
}
