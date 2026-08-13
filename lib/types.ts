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

}

export interface DeviceLogin {
  familyCode: string;
  username: string;
  role: string;
  authUid: string;
}
