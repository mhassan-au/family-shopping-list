import "server-only";

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
  const upToken = process.env.UP_API_TOKEN;
  const ownerUid = process.env.UP_SYNC_OWNER_UID;
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!upToken || !ownerUid || !firebaseApiKey) {
    return Response.json({ error: "Bank sync is not configured" }, { status: 503 });
  }

  const bearer = request.headers.get("authorization");
  const idToken = bearer?.startsWith("Bearer ") ? bearer.slice(7) : "";
  const authenticatedUid = await verifyFirebaseToken(idToken, firebaseApiKey);
  if (!authenticatedUid || authenticatedUid !== ownerUid) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  let requestedSince: number | undefined;
  try {
    const body = await request.json() as { since?: unknown };
    if (typeof body.since === "number" && Number.isFinite(body.since)) {
      requestedSince = body.since;
    }
  } catch {
    // An empty body is treated as the first sync.
  }

  const syncedAtMs = Date.now();
  const sinceMs = requestedSince && requestedSince > 0 && requestedSince < syncedAtMs
    ? requestedSince
    : syncedAtMs - 72 * 60 * 60 * 1000;

  try {
    const transactions = await fetchTransactions(upToken, sinceMs, syncedAtMs);
    return Response.json({ syncedAtMs, sinceMs, transactions });
  } catch (error) {
    console.error("UP transaction sync failed", error);
    return Response.json({ error: "UP Bank sync failed" }, { status: 502 });
  }
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
  url.searchParams.set("filter[status]", "SETTLED");
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
        transaction.attributes.status === "SETTLED" &&
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
      occurredAt,
      occurredAtMs: new Date(occurredAt).getTime(),
    };})
    .filter((transaction) => Number.isFinite(transaction.occurredAtMs));
}
