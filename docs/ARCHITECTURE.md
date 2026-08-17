# Architecture and customization

## Application flow

1. `AuthGate` restores anonymous Firebase Authentication and local session state.
2. `FamilyCodeScreen` validates household credentials.
3. Unknown UIDs create a `pending_devices` request.
4. `DeviceApprovalScreen` waits for manual approval.
5. Approved devices render `HouseholdApp`.
6. The bottom menu switches between `ShoppingList` and `Expenses` without a page reload.
7. The shopping and expense hooks maintain their real-time Firestore listeners.

## Key files

| File | Responsibility |
|---|---|
| `components/ShoppingList.tsx` | Main UI composition and action notifications |
| `components/HouseholdApp.tsx` | Bottom navigation and section switching |
| `components/Expenses.tsx` | Expense form and weekly expense list |
| `hooks/useShoppingList.ts` | Real-time state, optimistic updates, reconnects |
| `hooks/useExpenses.ts` | Real-time expense state |
| `lib/shopping.ts` | Firestore shopping-item operations |
| `lib/expenses.ts` | Expense validation and Firestore writes |
| `lib/firebase.ts` | Firebase, persistent cache, long polling |
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

The current shopping list uses one household-wide top-level `shopping_items` collection. Approved devices share the same list. Expenses use a top-level `expenses` collection and keep unaggregated records so future weekly and monthly reports can reuse them. Expense records cannot be updated or deleted; corrections are separate amendment transactions linked to the original. If multi-household support is ever required, move both collections under `families/{familyCode}` and update queries and Rules together.
