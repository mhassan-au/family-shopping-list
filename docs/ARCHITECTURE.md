# Architecture and customization

## Application flow

1. `AuthGate` restores anonymous Firebase Authentication and local session state.
2. `FamilyCodeScreen` validates household credentials.
3. Unknown UIDs create a `pending_devices` request.
4. `DeviceApprovalScreen` waits for manual approval.
5. Approved devices render `HouseholdApp`.
6. The bottom menu switches between `ShoppingList`, `Expenses`, and the staged `Forecast` section without a page reload.
7. A single shared top banner changes identity by section: MyGrocery for Shopping, MyExpenses for Expenses, and MyCashFlow for Forecast. `ExpenseReport` opens from the report icon in the weekly Expenses summary while the Expenses navigation tab stays active; secondary Settings and report views hide the shared banner.
8. Owner-only administration and the Personal Loan Ledger open from the top menu without occupying primary navigation tabs.
9. The shopping, expense, forecast, and personal-loan hooks maintain their real-time Firestore listeners.

## Key files

| File | Responsibility |
|---|---|
| `components/ShoppingList.tsx` | Main UI composition and action notifications |
| `components/HouseholdApp.tsx` | Bottom navigation and section switching |
| `components/Expenses.tsx` | Expense form and weekly expense list |
| `components/ExpenseReport.tsx` | Day/week/month/year insights and category comparisons |
| `components/Forecast.tsx` | Owner-only monthly cash-flow projection starting in September 2026, capped at 12 months ahead, with actionable dated lowest-balance warnings, opening adjustment, a viewport-constrained scrollable daily activity list, jump-to-today navigation, transaction-level daily Expense inclusion, optional audited manual locks, audited past/current recurring-expense occurrence exclusions, and an inline one-off entry control supporting expenses, income, and signed adjustments |
| `components/AdminDashboard.tsx` | Owner settings, persisted drag/keyboard ordering for shops and categories, Improvement Log entry point, exact next-30-day recurring totals and occurrence dates, forecast audit, and manual bank-sync controls with local status feedback |
| `components/ImprovementLog.tsx` | Owner-only current/history backlog with lifecycle controls, pagination, and permanent resolution summaries |
| `hooks/useImprovementLog.ts` | Live owner-only Improvement Log listener |
| `lib/improvementLogStore.ts` | Improvement Log creation, inbox editing/removal, lifecycle, and resolution writes |
| `hooks/useForecast.ts` | Live Forecast schedules, months, overrides, one-offs, audit, and immutable Expenses aggregation |
| `lib/forecastStore.ts` | Atomic Forecast writes paired with append-only audit events |
| `lib/forecast.ts` | Daily projection and recurring occurrence calculations |
| `components/PersonalLoans.tsx` | Owner-only loan and partial/full repayment ledger UI |
| `hooks/usePersonalLoans.ts` | Live owner-only loan and repayment listeners |
| `lib/personalLoanStore.ts` | Append-only personal loan and repayment writes |
| `lib/personalLoans.ts` | Loan validation and outstanding-balance calculations |
| `hooks/useShoppingList.ts` | Real-time state, optimistic updates, reconnects |
| `hooks/useExpenses.ts` | Real-time expense state |
| `lib/shopping.ts` | Firestore shopping-item and price-history operations |
| `lib/expenses.ts` | Expense validation and Firestore writes |
| `lib/firebase.ts` | Firebase, persistent cache, long polling |
| `app/api/up/sync/route.ts` | Owner-authenticated, server-only UP transaction fetch |
| `lib/bankSync.ts` | Pending transaction import, accept/reject, and deduplication writes |
| `lib/securityPolicy.ts` | Allow-list validation for server-side UP API pagination |
| `hooks/useBankSync.ts` | Live pending queue and last-sync status |
| `lib/deviceApproval.ts` | Pending and approved-device lookup |
| `lib/config.ts` | Shops, categories, priorities, member colors |
| `lib/uiText.ts` | Central user-facing text and message formatters |
| `lib/validation.ts` | Input limits and validation helpers |
| `firestore.rules` | Backend authorization and validation |

## Offline and synchronization behavior

- Firestore persistent local cache is shared across browser tabs.
- User actions update local React state first for immediate feedback.
- Firestore queues writes while offline and synchronizes after reconnection.
- Snapshot metadata drives Syncing/Offline status.
- Mobile network compatibility is improved with forced long polling.

## Customization

### Change messages

Edit `lib/uiText.ts`. Dynamic messages such as totals and item counts are formatter functions in the same file.

### Change shops, categories, priorities, or member colors

Edit `lib/config.ts`.

### Change validation limits

Update `lib/validation.ts` and make the same change in `firestore.rules`. Client and backend limits must remain aligned.

### Change the default category for a family member

The current default is selected in `components/ShoppingList.tsx` from the locally saved display name.

## Data ownership

The current shopping list uses one household-wide top-level `shopping_items` collection. Approved devices share the same list. Expenses use a top-level `expenses` collection and keep unaggregated records so reports can calculate day, week, month, and year totals directly. Expense records cannot be updated or deleted; corrections are separate amendment transactions linked to the original. The expense form warns when description, category, and amount match another transaction from the same local calendar day, but the user may deliberately save it. If multi-household support is ever required, move both collections under `families/{familyCode}` and update queries and Rules together.

The `shopping_price_history` collection keeps the latest non-zero unit price under an encoded, case-insensitive item-name key. Adding a matching item copies that value to `expectedUnitPrice` for display only; the value is not treated as an actual purchase price or included in totals.

Shared shop, shopping-category, and expense-category names are stored in `app_config/categories`. Static definitions in `lib/config.ts` are fallback defaults, allowing existing deployments to load normally before the owner creates the configuration document. Rename aliases are applied at render and reporting time so append-only expense history and existing shopping items do not need bulk rewrites. Removing an option only removes it from future selectors; it does not delete or rewrite historical records.

Each configuration array also controls display order. Admin drag-and-drop and move controls rewrite only the selected array order while preserving aliases and historical records.

Shopping duplicate detection checks active items only. A completed item may be added again while it remains in the completed list, but another active item with the same case-insensitive name is still blocked.

The completed-items popup has two separate flows. **Clear completed** deletes only shopping items. **Transfer to Expenses & Clear** uses one Firestore batch to create a `Grocery` expense with `source: shopping-transfer` and delete the completed items atomically. The expense list displays this source with an Auto added tag.

UP Bank sync is deliberately manual and separate for Peu and Shamir. The browser sends its Firebase ID token and selected account key to a server-only route; the route verifies the token and confirms that the matching `bank_admin_devices/{uid}` document is approved before selecting that account's server-only token. Every UP pagination link is revalidated against the official HTTPS API origin and path before the server follows it. Each account has an independent checkpoint. Later syncs query from 48 hours before that checkpoint so late settlement is not missed, while account-key-plus-transaction-ID deduplication prevents repeat review. Both HELD and SETTLED outgoing AUD purchases enter the pending queue, except descriptions that identify transfers, Afterpay, Zip, BPAY/bill payments, credit-card payments, or payments to another account. All available UP description fields participate in this exclusion. An existing pending item is refreshed when its bank status or amount changes. Accepting atomically creates an immutable expense, records the account and external transaction as processed, and removes it from the queue. Rejecting records the same identity and removes it without creating an expense. Each authorized sync attempt appends a success or failure event to `bank_sync_audit`; Settings shows that permanent history without transaction details.

Whole-number money input remains optimized for cents, but can be ambiguous: `12` may mean `$0.12` or `$12.00`. Shopping completion and new-expense entry show the two-choice confirmation only when the cents-first result is unusual—below $1 or above $1,000. Values from $1 through $1,000 save normally; entering a decimal or using the `>>` action also removes the ambiguity.

Personal loans are an owner-only ledger separate from Expenses. Each `personal_loans` record preserves the original lender, reason, amount, and borrowing date. Partial or full returns are appended to `personal_loan_repayments`; future repayment dates are rejected, and the UI derives repaid and outstanding totals without updating or deleting historical records. Forecast derives one outgoing daily entry from each immutable repayment record without copying it into Expenses or another Firestore collection. Unpaid loans are listed first, while fully paid loans move to the bottom, use a muted grey treatment, and collapse by default.

The owner-only Improvement Log records bugs, UI changes, and small feature ideas in `improvement_logs`. Unreviewed entries may be edited or deleted before Codex begins work. After explicit approval in the Codex conversation, the selected entry moves directly to in-progress; there is no separate in-app Agree action. In-progress entries preserve their original description, while done, not-doing, and duplicate outcomes move to immutable history with a required resolution summary. Current and history lists are paginated in the UI, and history is retained to prevent later duplicate work.
