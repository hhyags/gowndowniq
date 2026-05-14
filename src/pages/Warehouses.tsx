import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Warehouse as WarehouseType } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Plus, Warehouse as WarehouseIcon, MapPin, Package, Users, ArrowUpRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/context/AuthContext';

export const Warehouses: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (authLoading || !profile) return;

    const q = query(collection(db, 'warehouses'));
    const unsub = onSnapshot(q, (snapshot) => {
      setWarehouses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarehouseType)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'warehouses'));

    // Fetch product counts per warehouse
    const fetchCounts = async () => {
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        const newCountsMap: Record<string, number> = {};
        pSnap.docs.forEach(doc => {
          const wId = doc.data().warehouseId;
          newCountsMap[wId] = (newCountsMap[wId] || 0) + (doc.data().quantity || 0);
        });
        setCounts(newCountsMap);
      } catch (err) {
        console.error("Failed to fetch warehouse counts", err);
      }
    };
    fetchCounts();

    return unsub;
  }, [profile, authLoading]);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Godown Management</h2>
          <p className="text-slate-400">Track and manage inventory across multiple godown locations.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<div className={cn(buttonVariants({ variant: "default" }), "bg-orange-600 hover:bg-orange-700 text-white cursor-pointer inline-flex items-center justify-center")}>
              <Plus className="w-4 h-4 mr-2" /> New Godown
            </div>} />
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
            </DialogHeader>
            <AddWarehouseForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((w) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-950 border-slate-800 hover:border-orange-500/50 transition-all group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="p-2 rounded-lg bg-orange-600/10 text-orange-500">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Active
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl mb-1 text-white">{w.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <MapPin className="w-3 h-3" />
                  {w.location}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400">Capacity Usage</span>
                      <span className="text-slate-200">{Math.round(((counts[w.id] || 0) / w.capacity) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((counts[w.id] || 0) / w.capacity) * 100)}%` }}
                        className="h-full bg-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Total Units</span>
                      <span className="text-lg font-bold text-slate-200">{counts[w.id] || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Occupancy</span>
                      <span className="text-lg font-bold text-slate-200">{w.capacity}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-slate-800 text-xs gap-2 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    View Inventory Details <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const AddWarehouseForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 1000,
    managerId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'warehouses'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      toast.success('Warehouse created successfully');
      onSuccess();
    } catch (err) {
      toast.error('Failed to create warehouse');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400">Warehouse Name</label>
        <Input 
          required 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="bg-slate-950 border-slate-800"
          placeholder="e.g. Main Godown - Block A"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400">Location</label>
        <Input 
          required 
          value={formData.location} 
          onChange={e => setFormData({...formData, location: e.target.value})}
          className="bg-slate-950 border-slate-800"
          placeholder="Full address or GPS coordinates"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400">Total Capacity (Units)</label>
        <Input 
          type="number"
          required 
          value={formData.capacity} 
          onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
          className="bg-slate-950 border-slate-800"
        />
      </div>
      <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Initialize Godown</Button>
    </form>
  );
};
