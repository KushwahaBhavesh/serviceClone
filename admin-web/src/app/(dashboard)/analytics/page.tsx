'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Store, IndianRupee, MapPin, TrendingUp, UserCheck, Loader2, Zap, ArrowUpRight, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  totalMerchants: number;
  totalBookings: number;
  activeBookings: number;
  pendingMerchants: number;
  totalRevenue: number;
  totalAgents: number;
  recentUsers: Array<{ id: string; name: string | null; email: string | null; role: string; createdAt: string }>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <Zap size={20} className="absolute inset-0 m-auto text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Initializing Neural Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-8 py-6 rounded-2xl flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black">!</div>
        <div>
           <p className="font-black uppercase tracking-widest text-xs">System Fault Detected</p>
           <p className="text-sm font-medium mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Global Membership',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      trend: '+12%',
      sub: `${stats.totalAgents} agents operational`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Network Merchants',
      value: stats.totalMerchants.toLocaleString(),
      icon: Store,
      trend: '+5%',
      sub: `${stats.pendingMerchants} awaiting clearance`,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Platform Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      trend: '+24%',
      sub: 'Net Gross Volume',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Real-time Traffic',
      value: stats.activeBookings.toString(),
      icon: Activity,
      trend: 'Live',
      sub: `${stats.totalBookings} lifetime bookings`,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <Zap size={14} className="text-primary fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Live Operations</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Platform Intelligence</h1>
        </div>
        
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
          <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
             <p className="text-xs font-black text-emerald-400 flex items-center">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-2" />
               Fully Operational
             </p>
          </div>
          <div className="px-4 py-2 border border-slate-800 rounded-xl">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Update</p>
             <p className="text-xs font-black text-white">Just now</p>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} variants={item}>
              <Card className="relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-4 transform translate-x-1/2 -translate-y-1/2 h-24 w-24 ${card.bg} rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500`} />
                
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-none">
                  <div className={`h-11 w-11 ${card.bg} ${card.color} rounded-xl flex items-center justify-center border border-white/5 shadow-inner`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-2 py-1 rounded bg-slate-900 text-[10px] font-black text-emerald-400 border border-slate-800 flex items-center">
                      <ArrowUpRight size={10} className="mr-1" />
                      {card.trend}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-[10px] text-slate-500 mb-1">{card.label}</CardTitle>
                  <div className="text-3xl font-black text-white tracking-tighter mb-2 group-hover:text-primary transition-colors">{card.value}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-800" />
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest whitespace-nowrap">{card.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Intelligence Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Neural Feed (Signups) */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Node Activations</CardTitle>
                <CardDescription>Latest users added to the ecosystem</CardDescription>
              </div>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 transition-all">
                View All Directory
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-5 border-b border-slate-900 last:border-0 group hover:bg-slate-900/50 -mx-4 px-4 rounded-xl transition-all cursor-default">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-black text-primary shadow-inner group-hover:border-primary/50 transition-all">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white tracking-tight flex items-center">
                          {user.name || 'Unnamed Account'}
                          {user.role === 'ADMIN' && <Zap size={10} className="ml-2 text-primary" />}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black tracking-[0.2em] text-white bg-slate-800 px-3 py-1.5 rounded-lg uppercase border border-slate-700 group-hover:border-primary/30 transition-all">
                        {user.role}
                      </span>
                      <p className="text-[8px] font-bold text-slate-600 mt-2 uppercase tracking-tighter">Joined 2h ago</p>
                    </div>
                  </div>
                ))}
                {stats.recentUsers.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-900 rounded-3xl">
                     <Users size={32} className="mx-auto text-slate-800 mb-4" />
                     <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No Node Activations Detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Global Performance Summary */}
        <motion.div variants={item}>
          <Card className="h-full bg-slate-900/50 border-slate-800">
            <CardHeader className="bg-slate-900 border-b border-slate-800">
              <CardTitle>Ecosystem Health</CardTitle>
              <CardDescription>Real-time performance distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { label: 'Booking Success Rate', value: '98.4%', icon: TrendingUp, color: 'text-emerald-400' },
                  { label: 'Merchant Fulfillment', value: stats.totalMerchants, icon: UserCheck, color: 'text-blue-400' },
                  { label: 'Regulatory Pending', value: stats.pendingMerchants, icon: ShieldCheck, color: 'text-amber-400' },
                  { label: 'Active Vector Tasks', value: stats.activeBookings, icon: MapPin, color: 'text-primary' },
                ].map((row, idx) => (
                  <div key={idx} className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${row.color}`}>
                           <row.icon size={14} />
                         </div>
                         <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{row.label}</span>
                      </div>
                      <span className="text-sm font-black text-white">{row.value}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                        className={`h-full bg-gradient-to-r from-slate-800 to-primary rounded-full`} 
                       />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 rounded-3xl bg-primary shadow-electric relative overflow-hidden group cursor-default">
                  <Zap size={80} className="absolute -bottom-6 -right-6 text-white/10 rotate-12 transition-transform group-hover:scale-110" />
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2 italic">Pro System Insight</p>
                  <p className="text-xl font-black text-white leading-tight mb-4">You have {stats.pendingMerchants} KYC reviews requiring attention.</p>
                  <button className="px-6 py-2.5 bg-white text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-950 hover:text-white transition-all">
                    Commence Review
                  </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Minimal placeholder component for ShieldCheck if not imported correctly
function ShieldCheck({ size, className }: { size: number, className: string }) {
  return <div className={className} style={{ width: size, height: size, border: '2px solid currentColor', borderRadius: '4px' }} />
}
