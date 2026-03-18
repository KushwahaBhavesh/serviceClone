'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Store, IndianRupee, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    users: 0,
    merchants: 0,
    revenue: 0,
    activeBookings: 0
  });

  useEffect(() => {
    // In a real app, we'd fetch from an admin analytics endpoint
    // For now, we simulate loading the data
    const loadStats = async () => {
      // Mock data for the MVP
      setStats({
        users: 1245,
        merchants: 142,
        revenue: 845000,
        activeBookings: 38
      });
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Platform Analytics</h1>
        <p className="text-[#64748b]">Real-time overview of the Ondemand Service ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#e2e8f0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-transparent border-0">
            <CardTitle className="text-sm font-medium text-[#64748b]">Total Users</CardTitle>
            <div className="h-8 w-8 bg-[#f1f5f9] rounded-lg flex items-center justify-center">
              <Users size={18} className="text-[#0f172a]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0f172a]">{stats.users.toLocaleString()}</div>
            <p className="text-xs text-[#10b981] font-medium mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8f0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-transparent border-0">
            <CardTitle className="text-sm font-medium text-[#64748b]">Active Merchants</CardTitle>
            <div className="h-8 w-8 bg-[#fef3c7] rounded-lg flex items-center justify-center">
              <Store size={18} className="text-[#d97706]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0f172a]">{stats.merchants.toLocaleString()}</div>
            <p className="text-xs text-[#10b981] font-medium mt-1">+4 new this week</p>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8f0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-transparent border-0">
            <CardTitle className="text-sm font-medium text-[#64748b]">Total Revenue</CardTitle>
            <div className="h-8 w-8 bg-[#ecfdf5] rounded-lg flex items-center justify-center">
              <IndianRupee size={18} className="text-[#059669]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0f172a]">₹{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-[#64748b] font-medium mt-1">Platform gross volume</p>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8f0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-transparent border-0">
            <CardTitle className="text-sm font-medium text-[#64748b]">Active Bookings</CardTitle>
            <div className="h-8 w-8 bg-[#eff6ff] rounded-lg flex items-center justify-center">
              <MapPin size={18} className="text-[#2563eb]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0f172a]">{stats.activeBookings}</div>
            <p className="text-xs text-[#64748b] font-medium mt-1">Currently in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#e2e8f0]">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Latest merchants requesting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-[#94a3b8] text-sm border border-dashed border-[#e2e8f0] rounded-lg bg-[#f8fafc]">
              Chart placeholder: Line chart of signups over 30 days
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8f0]">
          <CardHeader>
            <CardTitle>Popular Services</CardTitle>
            <CardDescription>Top booked categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-[#94a3b8] text-sm border border-dashed border-[#e2e8f0] rounded-lg bg-[#f8fafc]">
              Chart placeholder: Bar chart of bookings by category
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
