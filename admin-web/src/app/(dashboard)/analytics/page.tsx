'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Store, IndianRupee, MapPin, TrendingUp, UserCheck, Loader2, Zap, ArrowUpRight, Activity, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function AnalyticsPage() {
  const router = useRouter();
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
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading platform analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-destructive text-white flex items-center justify-center font-bold">!</div>
        <div>
          <p className="font-bold text-sm">Error Loading Stats</p>
          <p className="text-xs opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      trend: '+12.5%',
      sub: `${stats.totalAgents} active agents`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Merchants',
      value: stats.totalMerchants.toLocaleString(),
      icon: Store,
      trend: '+4.2%',
      sub: `${stats.pendingMerchants} pending reviews`,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Platform Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      trend: '+18.2%',
      sub: 'This month so far',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Active Bookings',
      value: stats.activeBookings.toString(),
      icon: Activity,
      trend: 'Live',
      sub: `${stats.totalBookings} total completed`,
      color: 'text-primary',
      bg: 'bg-primary/5',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-10"
    >
      <Breadcrumbs />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time platform performance and growth metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 gap-1.5 font-medium bg-emerald-50 text-emerald-700 border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Healthy
          </Badge>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Clock size={14} />
            <span className="text-xs">Last 24 Hours</span>
          </Button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} variants={item}>
              <Card className="hover:border-primary/20 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", card.bg, card.color)}>
                    <Icon size={20} />
                  </div>
                  <Badge variant={card.trend === 'Live' ? 'default' : 'success'} className="text-[10px] font-bold px-1.5 py-0">
                    {card.trend}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{card.value}</h3>
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium">{card.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Signup Active Directory */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Registrations</CardTitle>
                <CardDescription>Latest users added to the platform</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => router.push('/users')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-4 border-b border-border last:border-0 group hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-primary border border-border">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-none">
                          {user.name || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight">
                        {user.role}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1.5">New Signup</p>
                    </div>
                  </div>
                ))}
                {stats.recentUsers.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                    <Users size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-xs font-medium text-muted-foreground">No new registrations found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Global Performance Summary */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
              <CardDescription>Key performance and compliance status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Booking Success', value: '98.4%', icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'Merchant Fulfillment', value: stats.totalMerchants, icon: UserCheck, color: 'text-blue-500' },
                { label: 'Pending Compliance', value: stats.pendingMerchants, icon: ShieldCheck, color: 'text-amber-500' },
                { label: 'Active Service Tasks', value: stats.activeBookings, icon: MapPin, color: 'text-primary' },
              ].map((row, idx) => (
                <div key={idx} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <row.icon size={16} className={row.color} />
                      <span className="text-xs font-semibold text-muted-foreground">{row.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{row.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: idx === 0 ? '98%' : (idx === 1 ? '75%' : '45%') }}
                      transition={{ duration: 0.8, delay: 0.2 + (idx * 0.1) }}
                      className={cn("h-full rounded-full", idx === 2 ? "bg-amber-500" : "bg-primary")}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-8 p-6 rounded-xl bg-primary text-white relative overflow-hidden group shadow-lg shadow-primary/20">
                <Zap size={60} className="absolute -bottom-4 -right-4 text-white/10 rotate-12 transition-transform group-hover:scale-110" />
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Action Required</p>
                <p className="text-base font-bold leading-tight mb-4">You have {stats.pendingMerchants} merchant KYC reviews pending.</p>
                <Button
                  variant="link"
                  className="h-auto p-0 text-white font-bold text-xs uppercase tracking-wider hover:no-underline group/btn"
                  onClick={() => router.push('/merchants')}
                >
                  Start Review <ArrowUpRight size={12} className="ml-1 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
