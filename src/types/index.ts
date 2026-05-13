export type Role = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  warehouseId?: string;
  createdAt: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  imei?: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  supplier: string;
  warehouseId: string;
  rackLocation: string;
  status: 'in-stock' | 'out-of-stock' | 'transferred';
  warrantyDetails?: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  managerId: string;
}

export interface Transaction {
  id: string;
  productId: string;
  type: 'inflow' | 'outflow' | 'transfer';
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}
