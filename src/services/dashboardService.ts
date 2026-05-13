import { collection, query, getDocs, limit, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryProduct, Transaction, Warehouse } from '../types';

export const dashboardService = {
  getInventoryStats: (callback: (products: InventoryProduct[]) => void) => {
    const path = 'products';
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryProduct));
      callback(products);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  getRecentTransactions: (callback: (transactions: Transaction[]) => void) => {
    const path = 'transactions';
    const q = query(
      collection(db, path),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      callback(transactions);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
