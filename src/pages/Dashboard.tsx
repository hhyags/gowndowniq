import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertCircle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardService } from '@/src/services/dashboardService';
import { geminiService } from '@/src/services/geminiService';
import { InventoryProduct, Transaction } from '@/src/types';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { handleFirestoreError, OperationType } from '@/src/lib/firebase';

export const Dashboard: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;

    const unsubProducts = dashboardService.getInventoryStats((p) => {
      setProducts(p);
    });
    
    const unsubTransactions = dashboardService.getRecentTransactions((t) => {
      setTransactions(t);
    });

    return () => {
      unsubProducts();
      unsubTransactions();
    };
  }, [profile, authLoading]);

  if (authLoading) return <div className="p-8"><Sparkles className="animate-pulse text-orange-500" /></div>;

  const totalValue = products.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
  const totalQuantity = products.reduce((acc, p) => acc + p.quantity, 0);
  const lowStock = products.filter(p => p.quantity <= p.minStockLevel).length;

  const runAiAnalysis = async () => {
    if (products.length === 0) {
      toast.info("Add some products first to run AI analysis");
      return;
    }
    setIsAnalyzing(true);
    const result = await geminiService.predictDemand(products.slice(0, 20)); // Limit for prompt size
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Process transaction data for chart
  const chartData = transactions.length > 0 ? Object.entries(
    transactions.reduce((acc: any, t: any) => {
      const date = new Date(t.timestamp);
      const day = date.toLocaleString('default', { weekday: 'short' });
      if (!acc[day]) acc[day] = { name: day, sales: 0, stock: 0 };
      if (t.type === 'outflow') acc[day].sales += t.quantity;
      if (t.type === 'inflow') acc[day].stock += t.quantity;
      return acc;
    }, {})
  ).map(([_, val]) => val) : [];

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Inventory Overview</h2>
          <p className="text-slate-400">Real-time stock monitoring and AI insights.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
            onClick={runAiAnalysis}
            disabled={isAnalyzing}
          >
            <Sparkles className={cn("w-4 h-4", isAnalyzing && "animate-pulse")} />
            {isAnalyzing ? "Analyzing..." : "Ask AI"}
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Inventory Value" 
          value={`$${totalValue.toLocaleString()}`} 
          desc="Market valuation"
          icon={DollarSign}
          color="blue"
        />
        <StatCard 
          title="Total Units" 
          value={totalQuantity.toString()} 
          desc="Across all locations"
          icon={Package}
          color="orange"
        />
        <StatCard 
          title="Low Stock Warning" 
          value={lowStock.toString()} 
          desc={lowStock > 0 ? "Needs immediate attention" : "All levels healthy"}
          icon={AlertCircle}
          color="red"
          isAlert={lowStock > 0}
        />
        <StatCard 
          title="Recent Movements" 
          value={transactions.length.toString()} 
          desc="In the last 30 days"
          icon={Activity}
          color="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 bg-slate-950 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Inflow & Outflow Trends</CardTitle>
            <CardDescription className="text-slate-500">Activity based on recent transactions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#f97316' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    name="Outflow"
                    stroke="#ef4444" 
                    fillOpacity={0.1} 
                    fill="#ef4444" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="stock" 
                    name="Inflow"
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Activity className="w-10 h-10 mb-2 opacity-20" />
                <p>No transaction data to display</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insight Card */}
        <Card className="lg:col-span-3 bg-slate-950 border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              AI Predictive Insights
            </CardTitle>
            <CardDescription className="text-slate-500">Demand forecasting & reorder suggestions.</CardDescription>
          </CardHeader>
          <CardContent>
            {aiAnalysis ? (
              <div className="space-y-4">
                {aiAnalysis.lowStockAlerts?.map((alert: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{alert.productName}</p>
                      <p className="text-xs text-orange-400">Stock out in approx {alert.daysRemaining} days</p>
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-300">Suggested Reorders</h4>
                  {aiAnalysis.reorderSuggestions?.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900">
                      <span className="text-xs text-slate-400">{item.productName}</span>
                      <Badge variant="outline" className="border-orange-500/50 text-orange-400">+{item.suggestedQuantity} units</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="p-4 rounded-full bg-slate-900">
                  <Activity className="w-8 h-8 text-slate-700" />
                </div>
                <p className="text-sm text-slate-500 max-w-xs">Run the AI Analysis to see stock predictions and demand forecasting for your inventory.</p>
                <Button variant="secondary" size="sm" onClick={runAiAnalysis}>Run Analysis</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-slate-500">Latest stock movements across godowns.</CardDescription>
          </div>
          <Button variant="ghost" className="text-orange-500 hover:text-orange-400">View All</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length > 0 ? transactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            )) : (
              <p className="text-center py-4 text-slate-600">No recent transactions found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ title, value, desc, icon: Icon, color, isAlert }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className={cn(
      "bg-slate-950 border-slate-800 shadow-lg group hover:border-orange-500/50 transition-colors",
      isAlert && "border-red-500/50 bg-red-500/5"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-2 rounded-lg",
            color === 'blue' && "bg-blue-500/10 text-blue-500",
            color === 'orange' && "bg-orange-500/10 text-orange-500",
            color === 'red' && "bg-red-500/10 text-red-500",
            color === 'green' && "bg-green-500/10 text-green-500",
          )}>
            <Icon className="w-5 h-5" />
          </div>
          {isAlert && <Badge variant="destructive" className="animate-pulse">Urgent</Badge>}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{value}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            {desc.includes('+') ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
            {desc}
          </p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const isOut = transaction.type === 'outflow';
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-900 bg-slate-950/50 hover:bg-slate-900 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-full",
          transaction.type === 'inflow' ? "bg-green-500/10 text-green-500" :
          transaction.type === 'outflow' ? "bg-red-500/10 text-red-500" :
          "bg-blue-500/10 text-blue-500"
        )}>
          {transaction.type === 'inflow' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200 capitalize">{transaction.type} - {transaction.productId}</p>
          <p className="text-xs text-slate-500">{new Date(transaction.timestamp).toLocaleString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-sm font-bold",
          isOut ? "text-red-400" : "text-green-400"
        )}>
          {isOut ? "-" : "+"}{transaction.quantity}
        </p>
        <p className="text-[10px] text-slate-600 uppercase tracking-tighter">Units</p>
      </div>
    </div>
  );
};

/** helper removed as we use lib/utils */
