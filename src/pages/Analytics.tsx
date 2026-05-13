import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, TrendingDown, ArrowRight, BrainCircuit, RefreshCw } from 'lucide-react';
import { geminiService } from '@/src/services/geminiService';
import { dashboardService } from '@/src/services/dashboardService';
import { InventoryProduct } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#6366f1'];

export const Analytics: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading || !profile) return;
    const unsubInv = dashboardService.getInventoryStats(setProducts);
    const unsubTrans = dashboardService.getRecentTransactions(setTransactions);
    return () => {
      unsubInv();
      unsubTrans();
    };
  }, [profile, authLoading]);

  const runPrediction = async () => {
    setPredicting(true);
    try {
      const result = await geminiService.predictDemand(products);
      setPrediction(result);
    } catch (err) {
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  // Aggregated trend data from transactions
  const trendData = transactions.length > 0 ? Object.entries(
    transactions.reduce((acc: any, t: any) => {
      const date = new Date(t.timestamp);
      const month = date.toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = { month, stock: 0, sales: 0 };
      if (t.type === 'inflow') acc[month].stock += t.quantity;
      if (t.type === 'outflow') acc[month].sales += t.quantity;
      return acc;
    }, {})
  ).map(([_, val]) => val) : [];

  // Group by category for pie chart
  const categoryData = Object.entries(
    products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  if (authLoading) return <div className="p-10 animate-pulse text-orange-500">Generating Neural Insights...</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="text-orange-500" />
            Stock Intelligence
          </h2>
          <p className="text-slate-400">AI-driven forecasting and warehouse performance metrics.</p>
        </div>
        <Button 
          onClick={runPrediction} 
          disabled={predicting}
          className="bg-orange-600 hover:bg-orange-700 shadow-[0_0_15px_rgba(234,88,12,0.3)]"
        >
          {predicting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
          Run AI Forecast
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Map */}
        <Card className="lg:col-span-2 bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Stock Flow Matrix 
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">6 Month Window</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStock)" strokeWidth={2} />
                <Area type="monotone" dataKey="stock" stroke="#f97316" fillOpacity={1} fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Inventory Cluster</CardTitle>
            <CardDescription>By Product Category</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {categoryData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-400 capitalize">{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {prediction.predictions?.slice(0, 3).map((p: any, i: number) => (
              <Card key={i} className="bg-orange-500/10 border-orange-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-orange-500 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Demand Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white font-medium mb-1">{p.productName}</p>
                  <p className="text-slate-400 text-xs">{p.predictedDemand}</p>
                  <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500" 
                      style={{ width: `${(p.confidence || 0.8) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {prediction.reorderSuggestions?.slice(0, 3).map((s: any, i: number) => (
              <Card key={i} className="bg-blue-500/10 border-blue-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-500 text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Reorder Suggested
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white font-medium mb-1">{s.productName}</p>
                  <p className="text-slate-400 text-xs">AI suggest ordering {s.suggestedQuantity} units soon.</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
