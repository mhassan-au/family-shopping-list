# Operations and troubleshooting

## Routine workflow

```bash
npm install
npm run dev
npm test
npx tsc --noEmit
npx eslint app components hooks lib --no-cache
npm run build
```

The build script runs the tests before invoking Next.js, which makes the normal Vercel build fail fast when a tested money-input or bank-sync rule regresses.

## Device lifecycle

### Add

1. Let the person sign in.
2. Find the UID under `pending_devices`.
3. Create the matching approved-device document.
4. Ask the user to press **Check approval**.

### Rename

Change only the `name` field in the approved-device document. The name is for Firebase Console administration.

### Remove

Delete the approved-device document and corresponding anonymous Authentication user.

## Common problems

### “Missing or insufficient permissions” during login

- Confirm Anonymous Authentication is enabled.
- Confirm the published Rules match `firestore.rules`.
- Confirm the login performs anonymous authentication before reading the user record.

### Approved user remains on waiting screen

- Verify the approved document ID exactly matches the pending UID.
- Verify `approved` is a boolean set to `true`, not a string.
- Press **Check approval**, then fully close/reopen the app if needed.

### List does not update promptly

- Check the sticky footer for Offline or Syncing status.
- Reopen the app to restart the Firestore connection.
- The app uses persistent local cache and forced long polling for mobile-network reliability.

### Expected price is not shown

- Price history is created only after an item is completed with a price greater than zero.
- Item-name matching ignores capitalization but otherwise requires the same spelling.
- A device adding the item while fully offline can show the expected price only if that history record is already in its local Firestore cache.

### Local server is unavailable

Run `npm run dev` and open `http://localhost:3000`.

### Production did not update

- Confirm the Git push reached `main`.
- Check the Vercel deployment status.
- Fully close/reopen an installed PWA or clear its site cache if it retains an old build.

### One UP account does not sync

- Confirm that account's server-only token exists in the current environment: `UP_API_TOKEN_PEU` or `UP_API_TOKEN_SHAMIR`.
- Restart the local server or redeploy Vercel after changing environment variables.
- Confirm the current device has `bank_admin_devices/{uid}.approved` set to boolean `true`.
- Each account records its own checkpoint under `bank_sync`; a 48-hour overlap is queried automatically.

### Duplicate expense warning

The warning appears only when description, category, and amount match another expense from the same local calendar day. Choose **Save anyway** for a legitimate repeated expense, or **Cancel** to review the entry. This warning does not delete or modify existing transactions.

### Shopping total transfer

Use **Transfer to Expenses & Clear** in the completed-items popup to add its final total as one `Grocery` expense and clear the completed list. The Auto added tag identifies the resulting transaction. Use **Clear completed** when no expense should be created.

## Firestore housekeeping

Periodically remove:

- Pending-device records already approved
- Approved-device records for retired devices
- Anonymous Authentication users for retired browsers
- Old completed shopping items using the app’s completed-items popup

Do not delete active household user documents or active approval documents.

## Backup

For this small app, periodic manual export of important Firestore documents is sufficient. Do not store exported password hashes or device UIDs in the Git repository.
