# Firebase setup and data model

## Services

Enable these Firebase services:

1. Authentication → Sign-in method → Anonymous
2. Firestore Database

No Firebase Storage, Cloud Functions, or Cloud Messaging service is required by the current app.

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

Only documents with `approved: true` can access the shopping list.

### `shopping_items/{itemId}`

Created by the app. Important fields include:

- `text`, `completed`, `shop`, `category`, `priority`
- `createdBy`, `createdAt`
- `qty`, `unitPrice`, `lastQty`, `lastUnitPrice` when completed

The supplied Security Rules limit fields, text lengths, quantities, and prices.

### `expenses/{expenseId}`

Created by the app for approved devices. Each record contains:

- `description`, `category`, `amount`, `transactionType`, and `unusual`
- `createdBy`, `createdAt`, and `createdAtMs`
- `amendsExpenseId` for an amendment transaction

The allowed categories are currently `Dinner`, `Kids Dinner`, `Kids Toy`, `Grocery`, `Kmart`, `Gift`, `Other`, and `B'Day`. If categories change in `lib/config.ts`, update the matching category allow-list in `firestore.rules` before publishing.

Expense documents are append-only: Firestore Rules deny updates and deletes. A correction creates a new `amendment` document linked to the original expense. Negative amendments reduce the total and positive amendments increase it.

The app sets `unusual` when a new expense exceeds its category threshold in `lib/config.ts`. This stored boolean supports future unusual-expense reports without changing immutable historical transactions.

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
5. Confirm an unapproved browser remains on the approval screen

Vercel does not deploy Firestore Rules.

## Password maintenance

Passwords are currently compared using SHA-256 hashes in the browser. Use long, unique household passwords and change them manually in Firestore when required. Never commit or share password hashes.

A future improvement is PBKDF2 with a unique salt per user, or migration to a fully server-verified Firebase Authentication method.
