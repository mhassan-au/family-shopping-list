# Security model

## Trust boundaries

- Firebase web configuration is public and is not an authorization mechanism.
- Firebase anonymous Authentication provides a stable UID for each browser profile/device.
- `approved_devices/{uid}` is the access-control list.
- Firestore Security Rules are the authoritative protection for data and quota.
- Local storage is convenience state only and must never be trusted by backend rules.

## Threat model

### Protected assets

- Household shopping and append-only expense history
- Password hashes, approved-device identities, and owner-admin authorization
- Server-only UP Bank tokens and imported transaction details
- Firebase/Vercel quota and the availability of the household app

### Relevant threat actors

- An unauthenticated internet user or automated quota-abuse client
- A signed-in but unapproved browser
- A compromised approved household device, including a non-owner device
- A malicious or compromised upstream response during bank pagination
- Accidental configuration, deployment, or secret-management mistakes

### Trust boundaries and mitigations

| Boundary | Main threat | Mitigation |
|---|---|---|
| Browser → Firestore | Unauthorized reads/writes and quota abuse | Anonymous Firebase identity plus manually approved UID; deny-by-default Rules; field, range, and immutable-ledger validation |
| Non-owner → shared configuration | Direct category/shop tampering outside the hidden UI | `app_config/categories` writes require the manually maintained `bank_admin_devices` owner boundary |
| Browser → bank-sync route | Token theft or unauthorized imports | Firebase ID-token verification, owner bank-admin lookup, fixed account allow-list, server-only tokens, and no-store responses |
| UP API → server pagination | Server-side request forgery through a forged `next` link | Every page URL must remain HTTPS on `api.up.com.au` under `/api/v1/`, with a ten-page cap |
| Third-party page → app browser | Clickjacking, referrer leakage, or unnecessary device API access | CSP frame protection, frame denial, no-referrer, nosniff, HSTS, and a restrictive Permissions Policy |
| Code change → deployment | Accidental weakening of important boundaries | Security contract and URL-policy tests run inside `npm run build` before Next.js builds |

## Current protections

- Shopping-list reads and writes require an approved authenticated UID.
- Household user records cannot be created, changed, listed, or deleted by the app.
- A device can create/read only its own pending request.
- Approval records can only be managed in Firebase Console.
- Both UP Bank tokens are read only by the Next.js server route and must remain in the server-only `UP_API_TOKEN_PEU` and `UP_API_TOKEN_SHAMIR` environment variables. The legacy `UP_API_TOKEN` is only a compatibility fallback for Peu.
- Manual bank sync requires both the owner's verified Firebase UID and a manually approved `bank_admin_devices/{uid}` document. The requested account is selected from a fixed server allow-list, not an arbitrary environment-variable name. Imported transactions remain pending until the owner accepts or rejects them.
- Authorized manual bank-sync attempts append a minimal success/failure event to the owner-only `bank_sync_audit` collection. Events contain no bank token or transaction description and cannot be updated or deleted by the app.
- UP pagination is restricted to the official HTTPS API origin and path, and bank-sync responses cannot be cached.
- Shared shop and category configuration can be changed only by a manually approved bank-admin device.
- Production responses include clickjacking, MIME-sniffing, referrer, transport, and browser-permission protections.
- Unknown collections and notification requests are denied.
- Forecast collections require the owner `bank_admin_devices` boundary. One-off entries and audit events are append-only; schedules can only transition from active to inactive; source Expenses remain immutable.
- Shopping documents have an allowed-field list and size/range validation.
- Shopping price-history reads and validated writes require an approved device; app-side deletion is denied.
- Expense reads and append-only writes require an approved authenticated UID.
- Expense documents have an allowed-field list, bounded category text, and amount validation; shared category choices are managed separately so historical names remain valid.
- Shopping transfers create the validated expense and delete completed items atomically in one approved-device batch.
- Client inputs are validated again immediately before Firestore writes.
- Price input accepts digits, one decimal point, and at most two decimals.

## Residual risks and next priorities

- Household passwords are unsalted SHA-256 hashes and are verified client-side after a direct user-document lookup. An attacker who learns a family code and username can retrieve that one hash after anonymous authentication and attempt offline guesses. A future server-verified login or managed Firebase Authentication migration is the strongest fix; PBKDF2 with per-user salt is an interim improvement.
- A compromised approved device can use the ordinary shopping and expense permissions until its UID is revoked. Manual approval, periodic review, and rapid revocation are therefore important.
- Firestore Rules protect the database, but anonymous-auth and login endpoints do not currently have server-side rate limiting or App Check. Monitor quota; consider App Check or a server login boundary only if abuse appears because those add deployment/configuration work.
- The repository tests enforce important Rules text and helper policy, but they do not execute Rules against the Firebase Emulator. Emulator-based authorization tests are a worthwhile future improvement if the extra tooling becomes justified.

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
