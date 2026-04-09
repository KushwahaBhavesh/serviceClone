'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft, CalendarDays, MapPin, Package, User, Store,
    Shield, Zap, Hash, CreditCard, Clock, CheckCircle2,
    XCircle, Truck, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BookingDetail {
    id: string;
    bookingNumber: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    tax: number;
    total: number;
    scheduledAt: string;
    completedAt: string | null;
    cancelledAt: string | null;
    notes: string | null;
    cancellationReason: string | null;
    createdAt: string;
    customer: { id: string; name: string | null; email: string | null; phone: string | null };
    merchant: { id: string; name: string | null } | null;
    items: Array<{ id: string; quantity: number; price: number; notes: string | null; service: { name: string; basePrice: number } }>;
    address: { id: string; label: string; line1: string; line2: string | null; city: string; state: string; zipCode: string } | null;
    agent: { id: string; user: { name: string | null; phone: string | null } } | null;
}

const getStatusConfig = (status: string) => {
    const map: Record<string, { variant: any; icon: any; color: string }> = {
        COMPLETED: { variant: 'success', icon: CheckCircle2, color: 'text-emerald-500' },
        CANCELLED: { variant: 'destructive', icon: XCircle, color: 'text-rose-500' },
        REJECTED: { variant: 'destructive', icon: XCircle, color: 'text-rose-500' },
        IN_PROGRESS: { variant: 'default', icon: Truck, color: 'text-blue-500' },
        EN_ROUTE: { variant: 'default', icon: Truck, color: 'text-blue-500' },
        ARRIVED: { variant: 'default', icon: MapPin, color: 'text-blue-500' },
        AGENT_ASSIGNED: { variant: 'outline', icon: User, color: 'text-indigo-500' },
        PENDING: { variant: 'warning', icon: Clock, color: 'text-amber-500' },
        ACCEPTED: { variant: 'outline', icon: CheckCircle2, color: 'text-emerald-500' },
    };
    return map[status] || { variant: 'secondary', icon: Clock, color: 'text-muted-foreground' };
};

const getPaymentBadge = (s: string) => {
    if (s === 'PAID') return 'success' as const;
    if (s === 'REFUNDED' || s === 'PARTIALLY_REFUNDED') return 'warning' as const;
    return 'secondary' as const;
};

export default function BookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/admin/bookings/${bookingId}`)
            .then(res => setBooking(res.data))
            .catch((err: any) => setError(err.response?.data?.message || 'Failed to load booking'))
            .finally(() => setLoading(false));
    }, [bookingId]);

    if (loading) return (
        <div className="pb-10"><Breadcrumbs /><Skeleton className="h-8 w-48 rounded-lg mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64 rounded-xl lg:col-span-2" /><Skeleton className="h-64 rounded-xl" />
            </div></div>
    );

    if (error || !booking) return (
        <div className="pb-10"><Breadcrumbs />
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-destructive text-white flex items-center justify-center font-bold">!</div>
                <div><p className="font-bold text-sm">Error</p><p className="text-xs opacity-90">{error || 'Booking not found'}</p></div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => router.push('/bookings')}>Back</Button>
            </div></div>
    );

    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="pb-10">
            <Breadcrumbs />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/bookings')}><ArrowLeft size={16} /></Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Booking #{booking.bookingNumber}</h1>
                            <Badge variant={statusConfig.variant} className="text-[10px] font-bold uppercase tracking-wider gap-1">
                                <StatusIcon size={12} />{booking.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Created {new Date(booking.createdAt).toLocaleString()}</p>
                    </div>
                </div>
                <Badge variant={getPaymentBadge(booking.paymentStatus)} className="text-xs font-bold px-3 py-1 gap-1.5">
                    <CreditCard size={12} />{booking.paymentStatus.replace(/_/g, ' ')}
                </Badge>
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Amount', value: `₹${booking.total.toLocaleString()}`, icon: Zap, active: true, sub: 'Gross value' },
                    { label: 'Scheduled For', value: new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: CalendarDays, sub: new Date(booking.scheduledAt).toLocaleDateString() },
                    { label: 'Items Count', value: booking.items.length.toString(), icon: Package, sub: 'Service units' },
                    { label: 'Agent', value: booking.agent?.user.name || 'Unassigned', icon: Shield, sub: booking.agent ? 'Assigned' : 'Pending' },
                ].map((info, idx) => (
                    <div key={idx} className={cn('bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden', info.active && 'border-primary/20 bg-primary/5')}>
                        {info.active && <div className="absolute top-0 right-0 p-2 opacity-10"><info.icon size={48} /></div>}
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{info.label}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-foreground">{info.value}</span>
                            <info.icon size={16} className={cn(info.active ? 'text-primary' : 'text-muted-foreground/30')} />
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground/60 mt-1">{info.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Stakeholders */}
                <div className="space-y-6">
                    <Card><CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">{booking.customer.name?.charAt(0) || 'U'}</div>
                                <div><p className="text-sm font-bold">{booking.customer.name || 'Unknown'}</p>
                                    <p className="text-[10px] text-muted-foreground">{booking.customer.email}</p></div>
                            </div>
                            {booking.customer.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3"><User size={12} />{booking.customer.phone}</p>}
                            <Link href={`/users/${booking.customer.id}`}><Button variant="outline" size="sm" className="w-full h-8 text-[10px]">View Profile</Button></Link>
                        </CardContent></Card>

                    {booking.merchant && (
                        <Card><CardHeader><CardTitle className="text-sm">Merchant</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">M</div>
                                    <p className="text-sm font-bold">{booking.merchant.name || 'Unknown'}</p>
                                </div>
                            </CardContent></Card>
                    )}

                    {booking.agent && (
                        <Card><CardHeader><CardTitle className="text-sm">Agent</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold">A</div>
                                    <div><p className="text-sm font-bold">{booking.agent.user.name || 'Unknown'}</p>
                                        {booking.agent.user.phone && <p className="text-[10px] text-muted-foreground">{booking.agent.user.phone}</p>}</div>
                                </div>
                            </CardContent></Card>
                    )}

                    {booking.address && (
                        <Card><CardHeader><CardTitle className="text-sm">Service Location</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                                    <div><p className="text-sm font-bold">{booking.address.line1}</p>
                                        {booking.address.line2 && <p className="text-xs text-muted-foreground">{booking.address.line2}</p>}
                                        <p className="text-xs text-muted-foreground mt-1">{booking.address.city}, {booking.address.state} - {booking.address.zipCode}</p></div>
                                </div>
                            </CardContent></Card>
                    )}
                </div>

                {/* Right: Order + Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card><CardHeader><CardTitle>Order Summary</CardTitle><CardDescription>{booking.items.length} service items</CardDescription></CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 space-y-3">
                                {booking.items.map((item, idx) => (
                                    <div key={item.id || idx} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <div><p className="text-sm font-bold">{item.service.name}</p>
                                                <p className="text-[10px] text-muted-foreground">Qty: {item.quantity} × ₹{item.service.basePrice.toLocaleString()}</p>
                                                {item.notes && <p className="text-[10px] text-amber-600 mt-0.5">Note: {item.notes}</p>}</div>
                                        </div>
                                        <span className="text-sm font-mono font-bold">₹{item.price.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-muted/30 px-4 py-3 space-y-1.5 border-t border-border">
                                <div className="flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span>₹{booking.subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-xs text-muted-foreground"><span>Tax</span><span>₹{booking.tax.toLocaleString()}</span></div>
                                <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border"><span>Total</span><span className="text-primary">₹{booking.total.toLocaleString()}</span></div>
                            </div>
                        </CardContent></Card>

                    {/* Timeline */}
                    <Card><CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { label: 'Booking Created', time: booking.createdAt, icon: Hash, done: true },
                                    { label: 'Scheduled', time: booking.scheduledAt, icon: CalendarDays, done: true },
                                    ...(booking.agent ? [{ label: 'Agent Assigned', time: booking.createdAt, icon: User, done: true }] : []),
                                    ...(booking.completedAt ? [{ label: 'Completed', time: booking.completedAt, icon: CheckCircle2, done: true }] : []),
                                    ...(booking.cancelledAt ? [{ label: 'Cancelled', time: booking.cancelledAt, icon: XCircle, done: true }] : []),
                                ].map((event, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0', event.done ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                                            <event.icon size={14} />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p className="text-sm font-semibold">{event.label}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(event.time).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent></Card>

                    {/* Notes */}
                    {(booking.notes || booking.cancellationReason) && (
                        <Card><CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {booking.notes && <div className="p-3 bg-muted/30 rounded-lg"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Customer Notes</p><p className="text-sm">{booking.notes}</p></div>}
                                {booking.cancellationReason && <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg"><p className="text-[10px] font-bold text-destructive uppercase mb-1">Cancellation Reason</p><p className="text-sm text-destructive/80">{booking.cancellationReason}</p></div>}
                            </CardContent></Card>
                    )}
                </div>
            </div>
        </div>
    );
}
