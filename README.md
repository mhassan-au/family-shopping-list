# MyGrocery

MyGrocery is a private, real-time household shopping and expense tracker built with Next.js, Firebase Authentication, Cloud Firestore, and Tailwind CSS. It is designed for a small set of manually approved family devices rather than public registration.

## Features

- Real-time list updates across approved phones and browsers
- Offline-first Firestore cache and automatic reconnection
- Add, edit, complete, undo, and delete shopping items
- Shop, category, and priority grouping/filtering
- Active-item duplicate prevention, including comma-separated submissions; completed items may be added again
- Quantity, price, and completed-shopping total
- Last paid unit-price history shown as an expected price when an item is added again
- Optional completed-shopping transfer to one auto-tagged Grocery expense, with atomic clearing
- Shared household expense entry grouped into Monday-to-Sunday weeks
- Day, week, month, and year expense reports with trends and period comparisons
- Category pie charts, previous/current category bars, and unusual-spend insights
- Family-color indicators showing who added shopping items and expenses
- Same-day duplicate expense warning with an explicit save-anyway option
- Manual device approval through Firebase Console
- Creator color indicators and user display names
- Centralized UI copy in `lib/uiText.ts`
- Client validation plus matching Firestore Security Rules

## Technology

- Next.js 16 (App Router)
- React 19 and TypeScript
- Firebase Authentication (anonymous device identity)
- Cloud Firestore
- Tailwind CSS 4
- Vercel deployment

## Requirements

- Node.js and npm
- A Firebase project with Anonymous Authentication and Firestore enabled
- A Vercel project for production deployment (optional for local use)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add the Firebase web configuration values.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

For phone testing on the same Wi-Fi network, use the network URL printed by `npm run dev`.

## Environment variables

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase web configuration is public by design; authorization is enforced by Authentication and Firestore Rules. Never add service-account JSON, private keys, household passwords, device UIDs, or tokens to the repository.

## Firebase setup

See [docs/FIREBASE.md](docs/FIREBASE.md) for:

- Authentication and Firestore setup
- Required collections and fields
- Creating household users
- Approving and revoking devices
- Publishing `firestore.rules`

## Configuration

- Shops, categories, priorities, and family colors: `lib/config.ts`
- All visible labels and messages: `lib/uiText.ts`
- Input lengths and validation rules: `lib/validation.ts`
- Firestore Security Rules: `firestore.rules`

## Validation

Before committing changes, run:

```bash
npx tsc --noEmit
npx eslint app components hooks lib --no-cache
npm run build
```

## Deployment

1. Add the same environment variables to Vercel.
2. Push the `main` branch to GitHub.
3. Wait for Vercel deployment to complete.
4. Test an approved device before publishing stricter Firestore Rules.

The repository's `firestore.rules` file is not automatically deployed by Vercel. Copy it into Firebase Console → Firestore Database → Rules and publish it separately.

## Documentation

- [Firebase and data model](docs/FIREBASE.md)
- [Security model](docs/SECURITY.md)
- [Operations and troubleshooting](docs/OPERATIONS.md)
- [Architecture and customization](docs/ARCHITECTURE.md)

## Privacy

This repository must not contain real household codes, passwords, password hashes, approved-device UIDs, Firebase Authentication UIDs, or personal tokens.
