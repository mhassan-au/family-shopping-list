# Security model

## Trust boundaries

- Firebase web configuration is public and is not an authorization mechanism.
- Firebase anonymous Authentication provides a stable UID for each browser profile/device.
- `approved_devices/{uid}` is the access-control list.
- Firestore Security Rules are the authoritative protection for data and quota.
- Local storage is convenience state only and must never be trusted by backend rules.

## Current protections

- Shopping-list reads and writes require an approved authenticated UID.
- Household user records cannot be created, changed, listed, or deleted by the app.
- A device can create/read only its own pending request.
- Approval records can only be managed in Firebase Console.
- Both UP Bank tokens are read only by the Next.js server route and must remain in the server-only `UP_API_TOKEN_PEU` and `UP_API_TOKEN_SHAMIR` environment variables. The legacy `UP_API_TOKEN` is only a compatibility fallback for Peu.
- Manual bank sync requires both the owner's verified Firebase UID and a manually approved `bank_admin_devices/{uid}` document. The requested account is selected from a fixed server allow-list, not an arbitrary environment-variable name. Imported transactions remain pending until the owner accepts or rejects them.
- Unknown collections and notification requests are denied.
- Shopping documents have an allowed-field list and size/range validation.
- Shopping price-history reads and validated writes require an approved device; app-side deletion is denied.
- Expense reads and append-only writes require an approved authenticated UID.
- Expense documents have an allowed-field list, category allow-list, and amount validation.
- Shopping transfers create the validated expense and delete completed items atomically in one approved-device batch.
- Client inputs are validated again immediately before Firestore writes.
- Price input accepts digits, one decimal point, and at most two decimals.

## Known limitation

Household passwords are currently unsalted SHA-256 hashes and are verified client-side after a direct user-document lookup. Device approval and Firestore Rules protect shopping data, but PBKDF2 or server-verified authentication would provide stronger password security.

## Owner-account security

- Enable multi-factor authentication on the Google account that owns Firebase and Vercel.
- Keep the number of Firebase project members minimal.
- Never share service-account credentials.
- Review Firebase Authentication users and approved devices periodically.

## Incident response

If a device is lost or compromised:

1. Delete `approved_devices/{uid}`.
2. Delete the matching anonymous user in Firebase Authentication.
3. Change household passwords if they may have been observed.
4. Review Firestore usage and recent documents.

If private credentials are committed, rotate them immediately and remove them from Git history. Firebase browser configuration alone is not a private credential.

## Billing and quota protection

- Keep restrictive Firestore Rules published.
- Do not restore public `allow read, write: if true` rules.
- Remove abandoned pending requests and anonymous users.
- Review Firestore Usage in Firebase Console.
- If the project is upgraded to a paid plan, configure Google Cloud budget alerts; alerts do not impose a hard spending cap.
