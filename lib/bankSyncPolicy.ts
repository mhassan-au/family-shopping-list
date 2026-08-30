export type SupportedBankAccount = "peu" | "shamir";

export const INITIAL_BANK_SYNC_HOURS = 72;
export const BANK_SYNC_OVERLAP_HOURS = 48;

const HOUR_MS = 60 * 60 * 1000;

const EXCLUDED_TRANSACTION_PATTERNS = [
  /\btransfer\b/i,
  /\bafter\s*pay\b/i,
  /\bzip(?:\s*pay)?\b/i,
  /\bbpay\b/i,
  /\bbill\s*(?:pay|payment)\b/i,
  /\b(?:credit\s*card|cc)\s*(?:pay|payment)\b/i,
  /\bpayment\s+to\s+(?:another|other|my)?\s*(?:account|acct)\b/i,
] as const;

export function getBankSyncSince(lastSyncedAtMs: number | undefined, nowMs: number) {
  return lastSyncedAtMs && lastSyncedAtMs > 0 && lastSyncedAtMs < nowMs
    ? Math.max(0, lastSyncedAtMs - BANK_SYNC_OVERLAP_HOURS * HOUR_MS)
    : nowMs - INITIAL_BANK_SYNC_HOURS * HOUR_MS;
}

export function bankTransactionDocumentId(
  accountKey: SupportedBankAccount,
  externalId: string,
) {
  return `${accountKey}__${externalId}`;
}

export function isExcludedBankTransaction(...details: Array<string | null | undefined>) {
  const searchableText = details.filter(Boolean).join(" ");
  return EXCLUDED_TRANSACTION_PATTERNS.some((pattern) => pattern.test(searchableText));
}
