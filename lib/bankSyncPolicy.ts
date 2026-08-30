export type SupportedBankAccount = "peu" | "shamir";

export const INITIAL_BANK_SYNC_HOURS = 72;
export const BANK_SYNC_OVERLAP_HOURS = 48;

const HOUR_MS = 60 * 60 * 1000;

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
