export interface ShoppingItem {

  id: string;

  text: string;

  completed: boolean;

  createdAt: number;

  createdBy?: string;

  shop?: string;

  category?: string;

  priority?: string;

  qty?: number;

  unitPrice?: number;

  lastQty?: number;

  lastUnitPrice?: number;

  expectedUnitPrice?: number;

}

export interface DeviceLogin {
  familyCode: string;
  username: string;
  role: string;
  authUid: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  createdAt: { toDate: () => Date } | null;
  createdAtMs: number;
  createdBy: string;
  transactionType: "expense" | "amendment";
  amendsExpenseId?: string;
  unusual?: boolean;
  source?: "shopping-transfer" | "up-bank";
  sourceTransactionId?: string;
  sourceAccount?: BankAccountKey;
}

export type BankAccountKey = "peu" | "shamir";

export type BankTransactionStatus = "HELD" | "SETTLED";

export interface PendingBankTransaction {
  id: string;
  externalId: string;
  description: string;
  amount: number;
  occurredAt: string;
  occurredAtMs: number;
  importedAtMs: number;
  importedBy: string;
  accountKey?: BankAccountKey;
  accountLabel?: string;
  status?: BankTransactionStatus;
}

export interface BankSyncStatus {
  lastSyncedAtMs: number;
  lastSinceMs?: number | null;
  importedCount: number;
  updatedBy: string;
  accountKey: BankAccountKey;
}

export interface BankSyncAuditRecord {
  id: string;
  accountKey: BankAccountKey;
  accountLabel: string;
  status: "success" | "failed";
  occurredAtMs: number;
  deviceUid: string;
}

export type ForecastDirection = "income" | "expense";
export type ForecastOneOffKind = ForecastDirection | "adjustment";
export type ForecastFrequency = "weekly" | "fortnightly" | "monthly" | "quarterly" | "yearly";

export interface ForecastSchedule {
  id: string;
  kind: ForecastDirection;
  name: string;
  amount: number;
  frequency: ForecastFrequency;
  firstDate: string;
  active: boolean;
  createdAtMs: number;
  createdBy: string;
  inactiveAt?: string;
  inactiveReason?: string;
}

export interface ForecastOneOff {
  id: string;
  kind: ForecastOneOffKind;
  description: string;
  amount: number;
  dateKey: string;
  createdAtMs: number;
  createdBy: string;
}

export interface ForecastMonth {
  id: string;
  openingBalance: number;
  updatedAtMs: number;
  updatedBy: string;
}

export interface ForecastOverride {
  id: string;
  dateKey: string;
  amount: number;
  excluded: boolean;
  excludedExpenseIds?: string[];
  locked?: boolean;
  updatedAtMs: number;
  updatedBy: string;
}

export interface ForecastOccurrenceOverride {
  id: string;
  occurrenceId: string;
  scheduleId: string;
  dateKey: string;
  name: string;
  amount: number;
  excluded: true;
  createdAtMs: number;
  createdBy: string;
}

export interface ForecastAuditRecord {
  id: string;
  action: "opening_balance_changed" | "daily_expense_adjusted" | "daily_expense_excluded" | "daily_expense_selection_changed" | "daily_expense_amount_locked" | "recurring_occurrence_excluded" | "schedule_created" | "schedule_inactivated" | "one_off_created";
  subject: string;
  oldValue: string;
  newValue: string;
  reason: string;
  createdAtMs: number;
  createdBy: string;
}

export interface PersonalLoan {
  id: string;
  lender: string;
  reason: string;
  originalAmount: number;
  takenDate: string;
  createdAtMs: number;
  createdBy: string;
}

export interface PersonalLoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  repaidDate: string;
  createdAtMs: number;
  createdBy: string;
}

export type WishStatus = "active" | "terminated";
export type WishTransactionType = "contribution" | "withdrawal" | "termination_refund";

export interface Wish {
  id: string;
  name: string;
  targetCents: number;
  balanceCents: number;
  deadlineDate: string;
  eventDate: string;
  status: WishStatus;
  createdAtMs: number;
  createdBy: string;
  updatedAtMs: number;
  updatedBy: string;
  lastTransactionId?: string;
  terminatedAtMs?: number;
}

export interface WishTransaction {
  id: string;
  wishId: string;
  type: WishTransactionType;
  amountCents: number;
  dateKey: string;
  note: string;
  createdAtMs: number;
  createdBy: string;
}

export type ImprovementType = "bug" | "ui_change" | "feature";
export type ImprovementStatus = "inbox" | "agreed" | "in_progress" | "done" | "not_doing" | "duplicate";

export interface ImprovementLogEntry {
  id: string;
  type: ImprovementType;
  title: string;
  notes: string;
  status: ImprovementStatus;
  createdAtMs: number;
  createdBy: string;
  updatedAtMs: number;
  updatedBy: string;
  resolutionSummary?: string;
  resolvedAtMs?: number;
}
