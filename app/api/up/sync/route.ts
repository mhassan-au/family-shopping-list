import "server-only";

import { BankAccountKey } from "@/lib/types";
import { getBankSyncSince } from "@/lib/bankSyncPolicy";

const ACCOUNT_CONFIG: Record<BankAccountKey, { label: string; token: string | undefined }> = {
  peu: { label: "Peu UP", token: process.env.UP_API_TOKEN_PEU ?? process.env.UP_API_TOKEN },
  shamir: { label: "Shamir UP", token: process.env.UP_API_TOKEN_SHAMIR },
};

interface UpTransactionResource {
  id: string;
  attributes: {
    status: "HELD" | "SETTLED";
    description: string;
    rawText?: string | null;
    message?: string | null;
    createdAt: string;
    settledAt?: string | null;
    amount: {
      currencyCode: string;
      value: string;
      valueInBaseUnits: number;
    };
  };
}

interface UpTransactionPage {
  data: UpTransactionResource[];
  links: { next?: string | null };
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!firebaseApiKey || !firebaseProjectId) {
    return Response.json({ error: "Bank sync is not configured" }, { status: 503 });
  }

  const bearer = request.headers.get("authorization");
  const idToken = bearer?.startsWith("Bearer ") ? bearer.slice(7) : "";
  const authenticatedUid = await verifyFirebaseToken(idToken, firebaseApiKey);
  if (
    !authenticatedUid ||
    !(await isApprovedBankAdmin(idToken, authenticatedUid, firebaseProjectId))
  ) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  let requestedSince: number | undefined;
  let accountKey: BankAccountKey | undefined;
  try {
    const body = await request.json() as { since?: unknown; account?: unknown };
    if (typeof body.since === "number" && Number.isFinite(body.since)) {
      requestedSince = body.since;
    }
    if (body.account === "peu" || body.account === "shamir") {
      accountKey = body.account;
    }
  } catch {
    // Invalid request bodies are rejected below.
  }

  if (!accountKey) {
    return Response.json({ error: "Invalid UP account" }, { status: 400 });
  }
  const account = ACCOUNT_CONFIG[accountKey];
  if (!account.token) {
    return Response.json({ error: `${account.label} is not configured` }, { status: 503 });
  }

  const syncedAtMs = Date.now();
  const sinceMs = getBankSyncSince(requestedSince, syncedAtMs);

  try {
    const transactions = await fetchTransactions(account.token, sinceMs, syncedAtMs);
    return Response.json({ accountKey, accountLabel: account.label, syncedAtMs, sinceMs, transactions });
  } catch (error) {
    console.error("UP transaction sync failed", error);
    return Response.json({ error: "UP Bank sync failed" }, { status: 502 });
  }
}

async function isApprovedBankAdmin(idToken: string, uid: string, projectId: string) {
  const documentUrl =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/bank_admin_devices/${encodeURIComponent(uid)}`;
  const response = await fetch(documentUrl, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  if (!response.ok) return false;
  const result = await response.json() as {
    fields?: { approved?: { booleanValue?: boolean } };
  };
  return result.fields?.approved?.booleanValue === true;
}

async function verifyFirebaseToken(idToken: string, apiKey: string) {
  if (!idToken) return null;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );
  if (!response.ok) return null;
  const result = await response.json() as { users?: Array<{ localId?: string }> };
  return result.users?.[0]?.localId ?? null;
}

async function fetchTransactions(token: string, sinceMs: number, untilMs: number) {
  const url = new URL("https://api.up.com.au/api/v1/transactions");
  url.searchParams.set("filter[since]", new Date(sinceMs).toISOString());
  url.searchParams.set("filter[until]", new Date(untilMs).toISOString());
  url.searchParams.set("page[size]", "100");

  const transactions: UpTransactionResource[] = [];
  let nextUrl: string | null = url.toString();
  let pages = 0;
  while (nextUrl && pages < 10) {
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`UP returned HTTP ${response.status}`);
    const page = await response.json() as UpTransactionPage;
    transactions.push(...page.data);
    nextUrl = page.links.next ?? null;
    pages += 1;
  }
  if (nextUrl) throw new Error("UP transaction result exceeded the safe page limit");

  return transactions
    .filter(
      (transaction) =>
        ["HELD", "SETTLED"].includes(transaction.attributes.status) &&
        transaction.attributes.amount.currencyCode === "AUD" &&
        transaction.attributes.amount.valueInBaseUnits < 0,
    )
    .map((transaction) => {
      const occurredAt = transaction.attributes.settledAt ?? transaction.attributes.createdAt;
      return {
      externalId: transaction.id.slice(0, 128),
      description: (
        transaction.attributes.description ||
        transaction.attributes.rawText ||
        transaction.attributes.message ||
        "UP transaction"
      ).trim().slice(0, 80),
      amount: Math.abs(transaction.attributes.amount.valueInBaseUnits) / 100,
      status: transaction.attributes.status,
      occurredAt,
      occurredAtMs: new Date(occurredAt).getTime(),
    };})
    .filter((transaction) => Number.isFinite(transaction.occurredAtMs));
}
