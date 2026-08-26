export interface ShoppingItem {

  id: string;

  text: string;

  completed: boolean;

  createdAt: number;

  createdBy?: string;

  shop?: string;

  category?: string;

  priority?: string;

  qty?: number;

  unitPrice?: number;

  lastQty?: number;

  lastUnitPrice?: number;

  expectedUnitPrice?: number;

}

export interface DeviceLogin {
  familyCode: string;
  username: string;
  role: string;
  authUid: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  createdAt: { toDate: () => Date } | null;
  createdAtMs: number;
  createdBy: string;
  transactionType: "expense" | "amendment";
  amendsExpenseId?: string;
  unusual?: boolean;
  source?: "shopping-transfer";
}
