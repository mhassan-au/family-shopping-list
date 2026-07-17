export interface ShoppingItem {

  id: string;

  text: string;

  completed: boolean;

  createdAt: number;

  shop?: string;

  category?: string;

  priority?: string;

  qty?: number;

  unitPrice?: number;

  lastQty?: number;

  lastUnitPrice?: number;

}