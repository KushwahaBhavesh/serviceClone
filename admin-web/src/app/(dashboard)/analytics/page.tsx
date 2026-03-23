'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Store, IndianRupee, MapPin, TrendingUp, UserCheck, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#fef2f2] border border-[#fecaca] text-[#ef4444] px-6 py-4 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      iconBg: 'bg-[#f1f5f9]',
      iconColor: 'text-[#0f172a]',
      sub: `${stats.totalAgents} agents active`,
    },
    {
      label: 'Active Merchants',
      value: stats.totalMerchants.toLocaleString(),
      icon: Store,
      iconBg: 'bg-[#fef3c7]',
      iconColor: 'text-[#d97706]',
      sub: `${stats.pendingMerchants} pending KYC`,
    },
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      iconBg: 'bg-[#ecfdf5]',
      iconColor: 'text-[#059669]',
      sub: 'Platform gross volume',
    },
    {
      label: 'Active Bookings',
      value: stats.activeBookings.toString(),
      icon: MapPin,
      iconBg: 'bg-[#eff6ff]',
      iconColor: 'text-[#2563eb]',
      sub: `${stats.totalBookings} total bookings`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Platform Analytics</h1>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Real-time Ecosystem Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.label}</CardTitle>
                <div className={`h-10 w-10 ${card.iconBg} rounded-xl flex items-center justify-center shadow-inner border border-white/10`}>
                  <Icon size={20} className={card.iconColor} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{card.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card className="border-[#e2e8f0]">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Latest users who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-[#FF6B00] flex items-center justify-center text-sm font-black text-white shadow-lg shadow-orange-100">
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{user.name || 'Unnamed'}</p>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-[0.1em] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase">
                    {user.role}
                  </span>
                </div>
              ))}
              {stats.recentUsers.length === 0 && (
                <p className="text-sm text-[#94a3b8] text-center py-4">No recent signups</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-[#e2e8f0]">
          <CardHeader>
            <CardTitle>Platform Summary</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[#f1f5f9]">
                <div className="flex items-center space-x-3">
                  <TrendingUp size={16} className="text-[#10b981]" />
                  <span className="text-sm text-[#0f172a]">Total Bookings</span>
                </div>
                <span className="font-bold text-[#0f172a]">{stats.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[#f1f5f9]">
                <div className="flex items-center space-x-3">
                  <UserCheck size={16} className="text-[#0ea5e9]" />
                  <span className="text-sm text-[#0f172a]">Total Agents</span>
                </div>
                <span className="font-bold text-[#0f172a]">{stats.totalAgents}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[#f1f5f9]">
                <div className="flex items-center space-x-3">
                  <Store size={16} className="text-[#d97706]" />
                  <span className="text-sm text-[#0f172a]">Pending KYC</span>
                </div>
                <span className="font-bold text-[#d97706]">{stats.pendingMerchants}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <MapPin size={16} className="text-[#2563eb]" />
                  <span className="text-sm text-[#0f172a]">Active Orders</span>
                </div>
                <span className="font-bold text-[#2563eb]">{stats.activeBookings}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
