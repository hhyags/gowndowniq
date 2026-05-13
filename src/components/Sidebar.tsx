import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Warehouse, label: 'Warehouses', path: '/warehouses' },
    { icon: History, label: 'Transactions', path: '/transactions' },
    { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
    { icon: AlertTriangle, label: 'Alerts', path: '/alerts' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transition-transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <Package className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-50">SmartGodown</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto lg:hidden"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-orange-600/10 text-orange-500" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                )}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.path === '/alerts' && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-orange-600 text-[10px] flex items-center justify-center text-white font-bold">
                    3
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-800">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
