# Firebase setup and data model

## Services

Enable these Firebase services:

1. Authentication → Sign-in method → Anonymous
2. Firestore Database

No Firebase Storage, Cloud Functions, or Cloud Messaging service is required by the current app.

## Manual UP Bank sync

The Admin screen has independent **Sync now** actions for Peu UP and Shamir UP. The first sync for each account requests the last 72 hours. Later syncs begin 48 hours before that account's last successful checkpoint, allowing late-settling activity to be found. HELD and SETTLED outgoing AUD purchases enter the pending queue and are never added to expenses until accepted. Transfers, Afterpay, Zip, BPAY/bill payments, credit-card payments, and payments to another account are filtered out before import. Rejecting a reviewed transaction records that account-and-transaction identity so it is not imported again.

Create this document manually for the owner's approved browser/device:

```text
bank_admin_devices/{ownerFirebaseAnonymousUid}
  approved: true
```

Create one `bank_admin_devices/{uid}` document for each of the owner's devices. The server verifies this document using the signed-in device's Firebase ID token, so no separate UID environment variable is required. Add `UP_API_TOKEN_PEU` and `UP_API_TOKEN_SHAMIR` to `.env.local` for local testing and to Vercel for production. The old `UP_API_TOKEN` remains a fallback for Peu. Do not put either token in Firestore or in any `NEXT_PUBLIC_` variable.

Publish the repository's updated `firestore.rules` before using sync. The app then manages:

- `pending_bank_transactions`: awaiting owner Accept/Reject review; new document IDs combine account key and UP transaction ID
- `processed_bank_transactions`: permanent per-account deduplication decisions
- `bank_sync/peu` and `bank_sync/shamir`: independent successful-sync checkpoints
- `bank_sync_audit`: append-only success/failure history for authorized manual sync attempts; history begins after this collection's Rules are published

## Collections

### `families/{familyCode}/users/{username}`

Household login record. The family document itself can be empty; users are stored in its `users` subcollection.

Required fields:

| Field | Type | Purpose |
|---|---|---|
| `displayName` | string | Name shown in the UI and on newly created items |
| `passwordHash` | string | Current SHA-256 password hash |
| `role` | string | Household role, such as `owner` or `contributor` |

The user document ID must be lowercase because usernames are case-insensitive. Family codes remain case-sensitive.

Do not expose user documents through list queries. The supplied Rules permit an authenticated direct lookup only.

### `pending_devices/{uid}`

Created automatically after valid household credentials are entered on a device that is not approved.

Fields:

| Field | Type |
|---|---|
| `familyCode` | string |
| `username` | string |
| `requestedAt` | timestamp |

The document ID is the Firebase anonymous Authentication UID.

### `approved_devices/{uid}`

Created manually in Firebase Console. The document ID must exactly match the pending-device UID.

Recommended fields:

| Field | Type | Example |
|---|---|---|
| `approved` | boolean | `true` |
| `name` | string | `Family phone` |

Only documents with `approved: true` can access household data. All approved household devices can view reports and add expenses. The household `role` remains available for shopping-list UI permissions, but it is not an expense permission field.

### `shopping_items/{itemId}`

Created by the app. Important fields include:

- `text`, `completed`, `shop`, `category`, `priority`
- `createdBy`, `createdAt`
- `qty`, `unitPrice`, `lastQty`, `lastUnitPrice` when completed
- `expectedUnitPrice` when a previous paid price was found for the item name

The supplied Security Rules limit fields, text lengths, quantities, and prices.

### `shopping_price_history/{normalizedItemName}`

Created or updated when an approved household member completes an item with a unit price greater than zero. The document ID is an encoded, lowercase item name so capitalization differences reuse the same history.

Fields:

- `itemName` and `normalizedName`
- `lastUnitPrice`
- `updatedBy`, `updatedAt`, and `updatedAtMs`

When the same item is added again, the app reads this record and stores `expectedUnitPrice` on the new shopping item. Clearing completed shopping items does not delete price history. History records cannot be deleted from the app.

### `expenses/{expenseId}`

Created by the app for approved devices. Each record contains:

- `description`, `category`, `amount`, `transactionType`, and `unusual`
- `createdBy`, `createdAt`, and `createdAtMs`
- `amendsExpenseId` for an amendment transaction
- `source: shopping-transfer` for totals transferred from the completed-shopping popup
- `source: up-bank`, `sourceAccount`, and `sourceTransactionId` for accepted bank transactions

Expense categories are loaded from `app_config/categories`. The defaults remain in `lib/config.ts` and are used automatically until the shared configuration document is created. Rules validate category text rather than maintaining a hard-coded allow-list.

Expense documents are append-only: Firestore Rules deny updates and deletes. A correction creates a new `amendment` document linked to the original expense. Negative amendments reduce the total and positive amendments increase it.

The app sets `unusual` when a new expense exceeds its category threshold in `lib/config.ts`. This stored boolean supports future unusual-expense reports without changing immutable historical transactions.

The expense screen displays `createdBy` using the family colors in `lib/config.ts`. Before creating an expense, the client warns when an existing expense from the same local calendar day has the same normalized category, case-insensitive description, and amount. This is an advisory check rather than a backend uniqueness constraint, so a legitimate repeat expense can be saved.

A completed-shopping transfer creates one `Grocery` expense and deletes the completed shopping documents in the same Firestore batch. If any operation is rejected, none of the batch is committed. The ordinary clear action never creates an expense.

### `app_config/categories`

Created when the owner first adds or renames a category in the Admin dashboard. It contains:

- `shops`, `shopping`, and `expenses`: shop and category-name arrays shared by all approved devices
- `shopAliases`, `shoppingAliases`, and `expenseAliases`: rename mappings so existing records appear under their replacement option
- `updatedBy`, `updatedAt`, and `updatedAtMs`: audit metadata

The Admin settings icon is shown only in the shopping header when the locally saved household role is `owner`. All approved devices can read this shared configuration, but Rules require the device UID to have an approved `bank_admin_devices/{uid}` document before it can create or update the configuration. Configuration deletion remains denied.

### Forecast collections

Forecast data is owner-only and uses the same manually controlled `bank_admin_devices/{uid}` boundary as bank administration. `forecast_schedules` stores recurring income and expenses with weekly, fortnightly, monthly, every-three-months (`quarterly`), and yearly frequencies; records may only transition from active to inactive and cannot be deleted. `forecast_one_offs` stores append-only unusual income, unexpected expenses, and signed adjustments. A positive adjustment increases the balance and a negative adjustment decreases it. `forecast_months/{YYYY-MM}` stores the manually adjustable opening balance. `forecast_overrides/{YYYY-MM-DD}` stores excluded immutable Expense transaction IDs and an optional locked daily total without changing `expenses`; unlocked days automatically include later Expense transactions. `forecast_occurrence_overrides/{scheduleId-YYYY-MM-DD}` stores an append-only exclusion for one past or current recurring expense occurrence without changing its schedule or future occurrences. `forecast_audit` is append-only and records every creation, adjustment, selection change, manual lock, occurrence exclusion, and inactivation with its reason, actor, values, and timestamp.

Publish `firestore.rules` before opening Forecast. Every owner device needs both `approved_devices/{uid}` and `bank_admin_devices/{uid}` with boolean `approved: true`.

### Personal Loan collections

Personal Loan data is owner-only and uses the same `bank_admin_devices/{uid}` boundary as Forecast and bank administration.

- `personal_loans` is append-only and stores `lender`, `reason`, `originalAmount`, `takenDate`, `createdAt`, `createdAtMs`, and `createdBy`.
- `personal_loan_repayments` is append-only and stores `loanId`, `amount`, `repaidDate`, `createdAt`, `createdAtMs`, and `createdBy`.

Outstanding balances are calculated from the original loan minus all linked repayment records. Neither collection permits client updates or deletes. Publish the updated `firestore.rules` before opening the Personal Loan Ledger or recording data.

### `improvement_logs/{entryId}`

Owner-only private backlog entries use the same `bank_admin_devices/{uid}` boundary as the Admin dashboard. Each entry stores its type, title, optional notes, lifecycle status, actor, and timestamps. Only `inbox` entries may have their description edited or be deleted. After the owner approves work in Codex, the entry moves directly to `in_progress`; the legacy `agreed` value remains accepted for compatibility but is not produced by the UI. `in_progress` entries preserve their recorded description. `done`, `not_doing`, and `duplicate` entries require a fix/implementation summary and become immutable, non-deletable history.

Publish `firestore.rules` before using the Improvement Log. Existing collections are unchanged.

## Approving a device

1. User enters home code, username, and password.
2. The waiting screen appears.
3. Open Firestore → `pending_devices`.
4. Copy the pending document ID.
5. Create `approved_devices/{same UID}`.
6. Add `approved` (boolean) = `true` and a descriptive `name`.
7. User presses **Check approval**.
8. Optionally delete the corresponding pending document in Firebase Console.

## Revoking a device

Delete its `approved_devices/{uid}` document. The device will be blocked the next time approval is checked or the app is reopened.

Also delete stale anonymous users from Firebase Authentication when a device is permanently retired.

## Security Rules

The source-controlled rules are in `firestore.rules`.

To publish manually:

1. Firebase Console → Firestore Database → Rules
2. Replace the editor contents with `firestore.rules`
3. Publish
4. Immediately test shopping read/write actions and adding an expense from an approved device
5. Confirm the owner's Admin category/shop update works from a device listed in `bank_admin_devices`
6. Confirm an approved non-admin device cannot update `app_config/categories` directly
7. Confirm an unapproved browser remains on the approval screen
8. Confirm an owner device can create a Personal Loan and partial repayment
9. Confirm an approved contributor cannot read or write either Personal Loan collection
10. Confirm an owner can save a transaction-level Forecast exclusion and manual lock, and that a contributor cannot read or write `forecast_overrides`
11. Confirm an owner can exclude today’s recurring expense occurrence without changing the recurring schedule or a future occurrence
12. Confirm an owner can add, edit, and remove an Inbox improvement, then move another entry to History with a summary
13. Confirm History improvements cannot be edited or deleted and a contributor cannot read `improvement_logs`

Vercel does not deploy Firestore Rules.

## Password maintenance

Passwords are currently compared using SHA-256 hashes in the browser. Use long, unique household passwords and change them manually in Firestore when required. Never commit or share password hashes.

A future improvement is PBKDF2 with a unique salt per user, or migration to a fully server-verified Firebase Authentication method.
