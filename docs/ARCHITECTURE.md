# Architecture and customization

## Application flow

1. `AuthGate` restores anonymous Firebase Authentication and local session state.
2. `FamilyCodeScreen` validates household credentials.
3. Unknown UIDs create a `pending_devices` request.
4. `DeviceApprovalScreen` waits for manual approval.
5. Approved devices render `HouseholdApp`.
6. The bottom menu switches between `ShoppingList` and `Expenses` without a page reload.
7. The expense banner opens `ExpenseReport`, while the Expenses navigation tab stays active.
8. The shopping and expense hooks maintain their real-time Firestore listeners.

## Key files

| File | Responsibility |
|---|---|
| `components/ShoppingList.tsx` | Main UI composition and action notifications |
| `components/HouseholdApp.tsx` | Bottom navigation and section switching |
| `components/Expenses.tsx` | Expense form and weekly expense list |
| `components/ExpenseReport.tsx` | Day/week/month/year insights and category comparisons |
| `hooks/useShoppingList.ts` | Real-time state, optimistic updates, reconnects |
| `hooks/useExpenses.ts` | Real-time expense state |
| `lib/shopping.ts` | Firestore shopping-item and price-history operations |
| `lib/expenses.ts` | Expense validation and Firestore writes |
| `lib/firebase.ts` | Firebase, persistent cache, long polling |
| `app/api/up/sync/route.ts` | Owner-authenticated, server-only UP transaction fetch |
| `lib/bankSync.ts` | Pending transaction import, accept/reject, and deduplication writes |
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

Shopping duplicate detection checks active items only. A completed item may be added again while it remains in the completed list, but another active item with the same case-insensitive name is still blocked.

The completed-items popup has two separate flows. **Clear completed** deletes only shopping items. **Transfer to Expenses & Clear** uses one Firestore batch to create a `Grocery` expense with `source: shopping-transfer` and delete the completed items atomically. The expense list displays this source with an Auto added tag.

UP Bank sync is deliberately manual. The browser sends its Firebase ID token to a server-only route; the route verifies the token and confirms that the matching `bank_admin_devices/{uid}` document is approved before using the UP token. New outgoing settled AUD transactions are stored in a pending queue. Accepting atomically creates an immutable expense, records the external transaction as processed, and removes it from the queue. Rejecting records the decision and removes it without creating an expense.
