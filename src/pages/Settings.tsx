import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, Bell, Shield, Database, Smartphone, 
  Mail, MessageSquare, Globe, LogOut, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const Settings: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    aiAlerts: true
  });

  const [displayName, setDisplayName] = useState(profile?.displayName || '');

  const handleUpdate = async () => {
    if (!profile) return;
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/src/lib/firebase');
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        updatedAt: new Date()
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">System Settings</h2>
        <p className="text-slate-400">Configure your Godown dashboard and account security.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          <nav className="flex flex-col gap-2">
            <Button variant="ghost" className="justify-start bg-slate-900 text-white">
              <User className="w-4 h-4 mr-2 text-orange-500" /> Account
            </Button>
            <Button variant="ghost" className="justify-start text-slate-400 hover:text-white">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </Button>
            <Button variant="ghost" className="justify-start text-slate-400 hover:text-white">
              <Shield className="w-4 h-4 mr-2" /> Security
            </Button>
            <Button variant="ghost" className="justify-start text-slate-400 hover:text-white">
              <Database className="w-4 h-4 mr-2" /> API & Integration
            </Button>
          </nav>
        </aside>

        <div className="md:col-span-3 space-y-6">
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription>Update your personal details and how others see you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase">Display Name</label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    className="bg-slate-900 border-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase">Email Address</label>
                  <Input disabled value={profile?.email || ''} className="bg-slate-900 border-none opacity-50" />
                </div>
              </div>
              <Button onClick={handleUpdate} className="bg-orange-600 hover:bg-orange-700">Save Profile</Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Control</CardTitle>
              <CardDescription>Choose how you want to be alerted about critical stock levels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow 
                icon={<Mail className="w-4 h-4" />} 
                title="Email Notifications" 
                description="Daily inventory summaries and stock reports."
                active={notifications.email}
                onToggle={() => setNotifications({...notifications, email: !notifications.email})}
              />
              <ToggleRow 
                icon={<MessageSquare className="w-4 h-4" />} 
                title="SMS Alerts" 
                description="Real-time security alerts and critical stock-outs."
                active={notifications.sms}
                onToggle={() => setNotifications({...notifications, sms: !notifications.sms})}
              />
              <ToggleRow 
                icon={<Smartphone className="w-4 h-4" />} 
                title="In-App Push" 
                description="Browser notifications for warehouse activities."
                active={notifications.aiAlerts}
                onToggle={() => setNotifications({...notifications, aiAlerts: !notifications.aiAlerts})}
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-950 border-red-900/50">
            <CardHeader>
              <CardTitle className="text-white">Danger Zone</CardTitle>
              <CardDescription>Actions that cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={signOut} variant="destructive" className="bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/50">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out from All Devices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({ icon, title, description, active, onToggle }: any) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-900 hover:border-slate-800 transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${active ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-800 text-slate-500'}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <div 
      onClick={onToggle}
      className={`w-12 h-6 flex items-center rounded-full px-1 cursor-pointer transition-colors ${active ? 'bg-orange-600' : 'bg-slate-800'}`}
    >
      <motion.div 
        animate={{ x: active ? 24 : 0 }}
        className="w-4 h-4 bg-white rounded-full shadow-lg"
      />
    </div>
  </div>
);
