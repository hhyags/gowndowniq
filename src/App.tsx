import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import { Package, Menu, Search, Bell, User as UserIcon, Sparkles, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { AIChat } from './components/AIChat';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { motion } from 'motion/react';

// Lazy load pages for performance
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Inventory = lazy(() => import('./pages/Inventory'));
const Warehouses = lazy(() => import('./pages/Warehouses'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Alerts = lazy(() => import('./pages/Alerts'));

const PageLoader = () => (
  <div className="h-[60vh] flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center"><Sparkles className="w-8 h-8 text-orange-500 animate-pulse" /></div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search command... (⌘K)" 
                className="bg-transparent border-none text-xs focus:ring-0 w-48 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-slate-950" />
            </Button>
            <div className="h-8 w-[1px] bg-slate-800 hidden md:block" />
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-200">{user?.displayName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Administrator</p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full bg-slate-800 border border-slate-700">
                <UserIcon className="w-4 h-4 text-slate-300" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </main>

      <AIChat />
      <Toaster position="top-right" theme="dark" />
    </div>
  );
};

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  if (user) return <Navigate to="/" />;

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center mb-6 shadow-2xl shadow-orange-600/20">
          <Package className="text-white w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter">SmartGodown</h1>
          <p className="text-slate-400">Next-gen AI Inventory Management for Mobile Stores</p>
        </div>
        
        <Card className="bg-slate-900 border-slate-800 shadow-2xl p-8">
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <h3 className="text-xl font-bold text-white">Welcome back</h3>
              <p className="text-sm text-slate-500">Please sign in with your corporate Google account to access the dashboard.</p>
            </div>
            <Button 
              onClick={login}
              className="w-full bg-white text-slate-950 hover:bg-slate-200 h-12 text-lg font-bold flex gap-3"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500 tracking-widest">Enterprise Secured</span></div>
            </div>
            <p className="text-[10px] text-slate-600">
              By signing in, you agree to our Terms of Service and Privacy Policy. 
              Protected by military-grade encryption.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  );
}
