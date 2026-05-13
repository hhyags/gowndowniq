import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Transaction } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History, Search, Filter, Download, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/src/context/AuthContext';

export const Transactions: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;

    setLoading(true);
    let q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50));
    
    if (filterType) {
      q = query(collection(db, 'transactions'), where('type', '==', filterType), orderBy('timestamp', 'desc'), limit(50));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'transactions');
      setLoading(false);
    });

    return unsub;
  }, [filterType, profile, authLoading]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="text-orange-500" />
            Audit Logs
          </h2>
          <p className="text-slate-400">Complete immutable record of all stock inflow and outflow.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-800 text-slate-300">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </header>

      <Card className="bg-slate-950 border-slate-800 shadow-2xl">
        <CardHeader className="p-4 border-b border-slate-800">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input placeholder="Search by Product ID or Transaction ID..." className="pl-10 bg-slate-900 border-none" />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={filterType === 'inflow' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilterType(filterType === 'inflow' ? null : 'inflow')}
                className={cn(filterType === 'inflow' && "bg-green-600 hover:bg-green-700")}
              >
                Inflow
              </Button>
              <Button 
                variant={filterType === 'outflow' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilterType(filterType === 'outflow' ? null : 'outflow')}
                className={cn(filterType === 'outflow' && "bg-red-600 hover:bg-red-700")}
              >
                Outflow
              </Button>
              <Button 
                variant={filterType === 'transfer' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterType(filterType === 'transfer' ? null : 'transfer')}
                className={cn(filterType === 'transfer' && "bg-blue-600 hover:bg-blue-700")}
              >
                Transfer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500">Timestamp</TableHead>
                <TableHead className="text-slate-500">Operation</TableHead>
                <TableHead className="text-slate-500">Product</TableHead>
                <TableHead className="text-slate-500 text-right">Quantity</TableHead>
                <TableHead className="text-slate-500">Performed By</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className="border-slate-800 hover:bg-slate-900/30">
                  <TableCell className="text-slate-300 text-xs font-mono">
                    {format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1 rounded",
                        t.type === 'inflow' ? "bg-green-500/10 text-green-500" :
                        t.type === 'outflow' ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        {t.type === 'inflow' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      </div>
                      <span className="capitalize text-sm text-slate-200">{t.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">{t.productId}</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    t.type === 'inflow' ? "text-green-400" : "text-red-400"
                  )}>
                    {t.type === 'inflow' ? '+' : '-'}{t.quantity}
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">{t.performedBy}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {transactions.length === 0 && !loading && (
            <div className="py-20 text-center text-slate-600">No logs matching filters.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
