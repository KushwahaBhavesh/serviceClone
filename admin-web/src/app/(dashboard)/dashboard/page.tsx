'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users, Store, IndianRupee, Activity, ShieldCheck, UserCheck,
    Loader2, AlertTriangle, ArrowUpRight, CalendarDays, Zap,
    Clock, TrendingUp, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

interface RecentBooking {
    id: string;
    bookingNumber: string;
    status: string;
    total: number;
    scheduledAt: string;
    customer: { id: string; name: string | null };
    merchant: { id: string; name: string | null } | null;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'success' as const;
        case 'CANCELLED': case 'REJECTED': return 'destructive' as const;
        case 'PENDING': return 'warning' as const;
        default: return 'outline' as const;
    }
};

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, bookingsRes] = await Promise.all([
                    api.get('/admin/dashboard'),
                    api.get('/admin/bookings', { params: { limit: 5 } }),
                ]);
                setStats(statsRes.data);
                setRecentBookings(bookingsRes.data.bookings || []);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="pb-10">
                <Breadcrumbs />
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <Skeleton className="h-4 w-72 rounded-lg mt-2" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="pb-10">
                <Breadcrumbs />
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-destructive text-white flex items-center justify-center font-bold">!</div>
                    <div>
                        <p className="font-bold text-sm">Error Loading Dashboard</p>
                        <p className="text-xs opacity-90">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            trend: '+12.5%',
            trendType: 'success' as const,
            subtitle: 'Registered platform users',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Active Merchants',
            value: stats.totalMerchants.toLocaleString(),
            icon: Store,
            trend: '+4.2%',
            trendType: 'success' as const,
            subtitle: `${stats.pendingMerchants} pending reviews`,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            label: 'Active Bookings',
            value: stats.activeBookings.toString(),
            icon: Activity,
            trend: 'Live',
            trendType: 'live' as const,
            subtitle: `${stats.totalBookings} total all-time`,
            color: 'text-primary',
            bg: 'bg-primary/5',
        },
        {
            label: 'Pending KYC',
            value: stats.pendingMerchants.toString(),
            icon: ShieldCheck,
            trend: stats.pendingMerchants > 0 ? 'Action' : '✓',
            trendType: stats.pendingMerchants > 0 ? 'warning' as const : 'success' as const,
            subtitle: 'Merchants awaiting verification',
            color: 'text-violet-600',
            bg: 'bg-violet-50',
        },
        {
            label: 'Platform Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: IndianRupee,
            trend: '+18.2%',
            trendType: 'success' as const,
            subtitle: 'From paid bookings',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Total Agents',
            value: stats.totalAgents.toLocaleString(),
            icon: UserCheck,
            trend: '+8.1%',
            trendType: 'success' as const,
            subtitle: 'Service professionals',
            color: 'text-cyan-600',
            bg: 'bg-cyan-50',
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

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Platform overview and key performance indicators.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1 gap-1.5 font-medium bg-emerald-50 text-emerald-700 border-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        System Healthy
                    </Badge>
                    <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => router.push('/analytics')}>
                        <TrendingUp size={14} />
                        <span className="text-xs">Full Analytics</span>
                    </Button>
                </div>
            </div>

            {/* Pending KYC Alert Banner */}
            {stats.pendingMerchants > 0 && (
                <motion.div variants={item}>
                    <div className="mb-8 p-5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">
                                    {stats.pendingMerchants} merchant KYC {stats.pendingMerchants === 1 ? 'review' : 'reviews'} pending
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    These merchants are waiting for your verification to start accepting bookings.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="h-9 gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex-shrink-0"
                            onClick={() => router.push('/merchants')}
                        >
                            <span>Review Now</span>
                            <ArrowUpRight size={14} />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((card, i) => (
                    <motion.div key={i} variants={item}>
                        <StatCard
                            label={card.label}
                            value={card.value}
                            icon={card.icon}
                            trend={card.trend}
                            trendType={card.trendType}
                            subtitle={card.subtitle}
                            color={card.color}
                            bg={card.bg}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Recent Bookings Table */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Bookings</CardTitle>
                            <CardDescription>Latest 5 service bookings across the platform</CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary gap-1.5"
                            onClick={() => router.push('/bookings')}
                        >
                            View All
                            <ArrowUpRight size={12} />
                        </Button>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="pl-6">Booking ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Merchant</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Schedule</TableHead>
                                    <TableHead className="text-right pr-6">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentBookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <CalendarDays size={32} className="text-muted-foreground/30" />
                                                <p className="text-xs font-medium text-muted-foreground">No bookings yet</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recentBookings.map((booking) => (
                                        <TableRow key={booking.id} className="group hover:bg-muted/20">
                                            <TableCell className="pl-6">
                                                <Link href={`/bookings/${booking.id}`} className="hover:text-primary transition-colors">
                                                    <span className="font-mono text-[11px] font-bold text-foreground bg-muted/50 border border-border px-2 py-1 rounded-md group-hover:border-primary/30 transition-all tracking-tight">
                                                        #{booking.bookingNumber}
                                                    </span>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-semibold text-foreground">
                                                    {booking.customer?.name || 'Unknown'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {booking.merchant?.name || 'Unassigned'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-bold text-foreground">₹{booking.total?.toLocaleString()}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <CalendarDays size={12} />
                                                    {new Date(booking.scheduledAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Badge
                                                        variant={getStatusStyle(booking.status)}
                                                        className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                                    >
                                                        {booking.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <Link href={`/bookings/${booking.id}`}>
                                                        <Button variant="outline" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                                                            <Eye size={12} />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recent Registrations and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
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
                                    <Link key={user.id} href={`/users/${user.id}`} className="block">
                                        <div className="flex items-center justify-between py-4 border-b border-border last:border-0 group hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-all">
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
                                                <p className="text-[10px] text-muted-foreground mt-1.5">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
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

                {/* Quick Actions */}
                <motion.div variants={item}>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Frequently used admin tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { label: 'Review KYC Applications', href: '/merchants', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50', count: stats.pendingMerchants },
                                { label: 'Manage Users', href: '/users', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'View All Bookings', href: '/bookings', icon: CalendarDays, color: 'text-violet-600', bg: 'bg-violet-50' },
                                { label: 'Service Catalog', href: '/catalog', icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            ].map((action) => (
                                <Link key={action.href} href={action.href} className="block">
                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-muted/30 transition-all group cursor-pointer">
                                        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', action.bg, action.color)}>
                                            <action.icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{action.label}</p>
                                        </div>
                                        {action.count !== undefined && action.count > 0 && (
                                            <Badge variant="warning" className="text-[10px] font-bold border-transparent">
                                                {action.count}
                                            </Badge>
                                        )}
                                        <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
