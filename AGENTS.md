# Codex working policy

## Always apply

- Begin every implementation request with one concise classification line using the change type, execution mode, and risk level from `docs/WORKFLOW_CLASSIFICATION.md`.
- Follow that document's routing, verification, approval, and automatic-escalation rules. Proceed without approval for clear low- and medium-risk work.
- Preserve user changes and unrelated worktree modifications. Do not commit or push unless explicitly requested.
- Search for affected symbols first and read only the files and documentation routed by the classification. Do not read every Markdown file for every task.
- This project uses Next.js 16 with breaking changes. Before changing Next.js APIs, conventions, configuration, routing, or file structure, read the relevant installed guide under `node_modules/next/dist/docs/` and heed deprecations.

## Product and security boundaries

- MyGrocery is a private household shopping and expense app for manually approved devices; do not broaden it into public registration or multi-household behavior without explicit approval.
- Firestore Security Rules are the authoritative access and quota boundary. Keep client validation and `firestore.rules` aligned, deny unknown collections, and never restore public `allow read, write: if true` access.
- Expense records are append-only. Corrections are amendment transactions; do not update or delete expense history unless an explicitly approved migration requires it.
- UP Bank synchronization remains owner-approved and manual. Keep bank credentials server-only, never expose them through `NEXT_PUBLIC_`, client code, Firestore, logs, or Git, and preserve pending Accept/Reject plus processed-transaction deduplication.
- Never commit household codes, passwords or hashes, tokens, service-account material, Firebase UIDs, approved-device IDs, or exported household data.
- Keep user-facing copy centralized in `lib/uiText.ts`. Keep shared configurable shops and categories compatible with historical records and rename aliases.
- Treat authentication, permissions, Firestore Rules, bank integrations, Vercel environment variables, dependencies, recurring services, and billing/quota exposure as Release-mode work.

## Approval boundary

Ask before proceeding only when a routine request unexpectedly requires Release mode; data may be deleted, replaced, or irreversibly migrated; a production dependency, permission, backend, recurring service, or cost is introduced; a product boundary above would be crossed; the safe implementation is materially broader than requested; or materially different product choices exist. Explain the reason briefly and wait. Do not ask for ordinary in-scope coding and testing.
