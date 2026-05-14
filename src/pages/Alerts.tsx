import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Clock, Trash2, CheckCircle, Smartphone, Filter } from 'lucide-react';
import { collection, onSnapshot, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { InventoryProduct } from '@/src/types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';

export const Alerts: React.FC = () => {
  const { profile } = useAuth();
  const [lowStockProducts, setLowStockProducts] = useState<InventoryProduct[]>([]);

  useEffect(() => {
    // Threshold of 5 for Alerts page to match global notifications
    const q = query(collection(db, 'products'), where('quantity', '<=', 5)); 
    const unsub = onSnapshot(q, (snapshot) => {
      setLowStockProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryProduct)));
    });
    return unsub;
  }, []);

  const resolveAlert = async (id: string) => {
    // In a real app we might update a dedicated alerts collection
    // Here we just toast for demo since these are dynamic product states
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="relative">
              <Bell className="text-orange-500" />
              {lowStockProducts.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping" />}
            </div>
            Notification Intelligence
          </h2>
          <p className="text-slate-400">Critical warehouse events and AI stock warnings.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-500 hover:text-white cursor-pointer">
            <Filter className="w-3 h-3 mr-1" /> All Alerts
          </Badge>
        </div>
      </header>

      <div className="space-y-4">
        {lowStockProducts.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-medium">All systems normal. No critical alerts reported.</p>
          </div>
        )}

        <AnimatePresence>
          {lowStockProducts.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="bg-slate-950 border-red-500/20 overflow-hidden hover:border-red-500/40 transition-all group">
                <div className="w-1 h-full bg-red-600 absolute left-0" />
                <CardHeader className="flex flex-row items-center justify-between py-4 pl-6 pr-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-600/10 text-red-500 ring-1 ring-red-600/20">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {p.quantity === 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500 text-white rounded-full uppercase tracking-widest">Out of Stock</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-500/20 text-orange-500 border border-orange-500/20 rounded-full uppercase tracking-widest">Low Stock Alert</span>
                        )}
                        <span className="text-[10px] text-slate-600 font-mono">• {p.id}</span>
                      </div>
                      <CardTitle className="text-white text-lg">
                        {p.brand} {p.name} <span className="text-slate-500 text-sm font-normal">({p.sku})</span>
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" /> Reported {format(new Date(), 'HH:mm')}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Smartphone className="w-3 h-3" /> SKU Category: {p.category}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white leading-none">{p.quantity}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Units Remaining</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toast.success("Alert snoozed for 24 hours.")}
                        className="px-3 py-1 scale-90 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                      >
                        Ignore
                      </button>
                      <button 
                        onClick={() => toast.info(`Restock requisition for ${p.name} created.`)}
                        className="px-3 py-1 scale-90 rounded bg-orange-600 text-[10px] font-bold text-white hover:bg-orange-700 transition-all"
                      >
                        Restock Now
                      </button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Card className="bg-blue-500/5 border-blue-500/20 mt-10">
        <CardContent className="p-6 flex gap-4 items-center">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Weekly Summary Incoming</h4>
            <p className="text-slate-400 text-sm">Your AI-generated inventory report will be sent to <b>{profile?.email}</b> tomorrow at 09:00 AM.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
