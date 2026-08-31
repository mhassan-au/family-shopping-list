# Expense-tracker continuation handoff

Use this document when starting a new Codex chat to extend MyGrocery further as an expense tracker. The existing Shopping and Expenses sections should remain working and visually intact unless a request explicitly changes them.

## Product direction

- Keep MyGrocery a private household app for manually approved family devices.
- Preserve the current Shopping and Expenses sections.
- Add the next expense-tracking capability as a separate section in the existing household application navigation.
- Design the new section around household spending decisions rather than accounting, business bookkeeping, public users, or multi-household behavior.
- Decide the new section's purpose and data requirements before implementation. Do not assume that existing immutable expense transactions can be rewritten.

## Existing expense features

- Simple manual expense entry with description, category, and amount.
- Configurable expense categories and rename aliases managed from the owner Admin dashboard.
- Monday-to-Sunday weekly transaction grouping with category filters and price/date sorting.
- Append-only transactions. Mistakes are corrected using a linked positive or negative amendment.
- Same-day duplicate warning based on normalized category, description, and amount, with an explicit save-anyway choice.
- Configurable unusual-expense thresholds and stored `unusual` tags.
- Unusual-transaction popup from the expense summary card.
- Day, week, month, and year reports.
- Report category filters affecting totals, transaction count, average, unusual count, trend, and comparisons.
- Category pie chart with percentages, amount legend, and previous-period direction indicators.
- Per-category previous/current comparison bars.
- Family-color indicators showing who added each expense.
- Completed shopping totals can optionally become one auto-tagged `Grocery` expense while the completed list is cleared atomically.
- Amount input is cents-first for whole digits and also accepts explicit decimals. The dollars-versus-cents popup appears only when the cents-first result is below $1 or above $1,000; the `>>` control explicitly shifts to dollars.

## Existing bank-import flow

- Peu and Shamir UP accounts have independent owner-triggered **Sync now** buttons.
- Tokens remain server-only in `UP_API_TOKEN_PEU` and `UP_API_TOKEN_SHAMIR`.
- The first sync requests 72 hours; later syncs overlap the prior checkpoint by 48 hours.
- HELD and SETTLED outgoing AUD purchases may enter the pending review queue.
- Transfer, Afterpay, Zip, BPAY/bill-payment, credit-card-payment, and other-account-payment descriptions are excluded before import.
- Account key plus UP transaction ID provides deduplication across overlap windows.
- The owner must Accept or Reject every pending import. Accept opens category review and creates an immutable expense; Reject records the decision without creating one.
- A successful sync result containing new transactions is clickable and opens the Expenses review page.

## Data and security boundaries

- `expenses/{expenseId}` is append-only: create is permitted to approved devices; update and delete are denied.
- New correction behavior must continue to use amendment transactions unless a separately approved migration is designed.
- `approved_devices/{uid}` controls normal household access.
- `bank_admin_devices/{uid}` controls owner bank sync and shared shop/category configuration.
- Firestore Rules are the backend authority. Any new collection requires explicit deny-by-default Rules, validation, and tests before use.
- Do not put bank tokens, household credentials, hashes, Firebase UIDs, device IDs, or exported household data in source control or client-visible variables.
- Keep visible text in `lib/uiText.ts`.
- Keep shared categories compatible with historical names and rename aliases.
- Preserve UP pending Accept/Reject and processed-transaction deduplication.

## Relevant implementation files

| Area | Files |
|---|---|
| Section navigation | `components/HouseholdApp.tsx` |
| Expense list, entry, bank review | `components/Expenses.tsx` |
| Expense reporting | `components/ExpenseReport.tsx` |
| Expense live state | `hooks/useExpenses.ts` |
| Expense persistence | `lib/expenses.ts` |
| Bank UI state and persistence | `hooks/useBankSync.ts`, `lib/bankSync.ts` |
| Server-only UP fetch | `app/api/up/sync/route.ts` |
| Bank windows/filtering/deduplication policy | `lib/bankSyncPolicy.ts` |
| Categories and thresholds | `lib/config.ts`, `hooks/useCategoryConfig.ts` |
| Validation and money input | `lib/validation.ts`, `hooks/useSmartMoneyInput.ts` |
| User-facing text | `lib/uiText.ts` |
| Backend access and validation | `firestore.rules` |
| Current data model | `docs/FIREBASE.md` |
| Security constraints | `docs/SECURITY.md` |

## Before building the new section

Agree on these points first because they affect data shape and reporting:

1. The section's name and main household question it should answer.
2. Whether it reads existing expenses only or stores new records.
3. The default time period and category behavior.
4. Whether it is visible to every approved family member or owner-only.
5. Whether any values are targets/budgets, recurring plans, account balances, or derived insights.
6. What should happen offline and how new local writes synchronize.

If the section stores data, update `docs/FIREBASE.md`, `docs/SECURITY.md`, `firestore.rules`, shared TypeScript types, and automated security/data-shape tests together.

## Verification baseline

The project currently uses build-gated Node tests. Before handing off an implementation, run:

```bash
npm test
npx tsc --noEmit
npx eslint app components hooks lib tests --no-cache
npm run build
```

Vercel runs `npm run build`, which runs `npm test` first. Firestore Rules still require separate manual publication in Firebase Console.

## Copy-ready prompt for a new chat

```text
Continue the MyGrocery project using docs/EXPENSE_TRACKER_HANDOFF.md and the repository AGENTS.md. I want to expand it further as an expense tracker by adding a separate section while preserving the existing Shopping and Expenses sections. First review the handoff and affected architecture, then help me define the new section's purpose, layout, data source, permissions, and persistence before implementing it. Preserve append-only expenses, manual owner-approved UP sync, centralized UI text, Firestore security boundaries, offline behavior, and the existing visual theme.
```
