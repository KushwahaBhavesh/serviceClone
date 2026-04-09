'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CalendarDays, Loader2, ChevronLeft, ChevronRight, Eye, MapPin, Package, User, Store, XCircle, Shield, Zap, Activity, Hash, ArrowUpRight, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  total: number;
  scheduledAt: string;
  createdAt: string;
  customer: { id: string; name: string | null; email: string | null };
  merchant: { id: string; name: string | null } | null;
  items: Array<{ service: { name: string; basePrice: number } }>;
  address: { line1: string; city: string } | null;
  agent: { user: { name: string | null } } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_TABS = [
  { id: 'ALL', label: 'All Vectors' },
  { id: 'PENDING', label: 'Queued' },
  { id: 'ACCEPTED', label: 'Confirmed' },
  { id: 'IN_PROGRESS', label: 'Active' },
  { id: 'AGENT_ASSIGNED', label: 'Deployed' },
  { id: 'COMPLETED', label: 'Finalized' },
  { id: 'CANCELLED', label: 'Aborted' },
];

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    city: ''
  });

  const fetchBookings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.city) params.city = filters.city;

      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.bookings);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchBookings(), 300);
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'IN_PROGRESS': case 'EN_ROUTE': case 'ARRIVED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CANCELLED': case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'AGENT_ASSIGNED': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="pb-10">
      <Breadcrumbs />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Booking Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage service orders across the platform.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-background border border-border rounded-xl px-4 py-2 flex items-center space-x-3 w-72 group focus-within:border-primary/50 transition-all shadow-sm">
            <Search size={16} className="text-muted-foreground group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search booking numbers..."
              className="bg-transparent border-none text-sm font-medium text-foreground focus:ring-0 placeholder:text-muted-foreground/60 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={cn("h-10 w-10 border-border transition-all", Object.values(filters).some(v => v) && "border-primary bg-primary/5 text-primary")}
            onClick={() => setShowFilters(true)}
          >
            <Filter size={16} />
          </Button>
        </div>
      </div>

      {/* Filters/Tabs */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-muted/50 border border-border rounded-xl overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
                statusFilter === s.id
                  ? "bg-white text-primary shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              )}
            >
              {s.label === 'All Vectors' ? 'All Bookings' : s.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 px-2">
          <span className="text-xs font-semibold text-muted-foreground">Total: {pagination.total}</span>
        </div>
      </div>

      {/* Main Content Table */}
      <Card className="shadow-sm border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/5">
            <TableRow>
              <TableHead className="w-[180px]">Booking ID</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Customer & Merchant</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-8 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-40 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-32 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 rounded-lg" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <EmptyState
                    icon={CalendarDays}
                    title="No bookings found"
                    description="We couldn't find any service bookings matching your current status or search filters."
                    action={{
                      label: "Clear Search & Filters",
                      onClick: () => {
                        setSearch('');
                        setStatusFilter('ALL');
                        setFilters({ dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', city: '' });
                        fetchBookings(1);
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id} className="group transition-colors">
                  <TableCell>
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-[11px] font-bold text-foreground bg-muted/50 border border-border px-2 py-1 rounded-md group-hover:border-primary/30 transition-all tracking-tight">
                        #{booking.bookingNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-[200px]">
                      <p className="text-sm font-bold text-foreground truncate">
                        {booking.items[0]?.service.name || 'N/A'}
                      </p>
                      {booking.items.length > 1 && (
                        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                          + {booking.items.length - 1} more items
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {booking.customer.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-bold text-foreground truncate leading-none">{booking.customer.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                          M
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground truncate leading-none">
                          {booking.merchant?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                        <CalendarDays size={12} className="text-muted-foreground" />
                        {new Date(booking.scheduledAt).toLocaleDateString()}
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-1 ml-5">
                        {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <span>₹{booking.total.toLocaleString()}</span>
                      <Zap size={10} className="text-primary/30" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Badge variant={
                        booking.status === 'COMPLETED' ? 'success' :
                          booking.status === 'CANCELLED' ? 'destructive' :
                            booking.status === 'PENDING' ? 'warning' : 'outline'
                      } className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        {booking.status.replace(/_/g, ' ')}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-all shadow-sm"
                        onClick={() => router.push(`/bookings/${booking.id}`)}
                      >
                        <Eye size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/5">
            <p className="text-xs font-semibold text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 shadow-sm" disabled={pagination.page <= 1} onClick={() => fetchBookings(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" className="h-8 shadow-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchBookings(pagination.page + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showDetails && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowDetails(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="h-1.5 bg-primary w-full" />

              <div className="flex flex-col h-[80vh] md:h-auto max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-border bg-muted/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                      <Hash size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-1.5">Booking Details</Badge>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">#{selectedBooking.bookingNumber}</span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Transaction Overview</h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDetails(false)}
                    className="h-9 w-9 rounded-full"
                  >
                    <XCircle size={20} className="text-muted-foreground" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Key Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Amount', value: `₹${selectedBooking.total.toLocaleString()}`, icon: Zap, sub: 'Gross Value', active: true },
                      { label: 'Scheduled For', value: new Date(selectedBooking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: CalendarDays, sub: new Date(selectedBooking.scheduledAt).toLocaleDateString() },
                      { label: 'Items Count', value: selectedBooking.items.length, icon: Package, sub: 'Service Units' },
                      { label: 'Verification', value: selectedBooking.merchant ? 'Verified' : 'Pending', icon: Shield, sub: 'Provider Status' },
                    ].map((info, idx) => (
                      <div key={idx} className={cn(
                        "bg-card border border-border rounded-xl p-5 shadow-sm transition-all relative overflow-hidden",
                        info.active && "border-primary/20 bg-primary/5"
                      )}>
                        {info.active && <div className="absolute top-0 right-0 p-2 opacity-10"><info.icon size={48} /></div>}
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{info.label}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-foreground">{info.value}</span>
                          <info.icon size={16} className={cn(info.active ? "text-primary" : "text-muted-foreground/30")} />
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground/60 mt-1">{info.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Entity Details */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                        <User size={14} className="text-primary" />
                        Stakeholder Info
                      </h4>

                      <div className="space-y-3">
                        <div className="bg-muted/10 border border-border rounded-xl p-4 flex items-center gap-4">
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">C</div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{selectedBooking.customer.name || 'Anonymous'}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground">{selectedBooking.customer.email}</p>
                          </div>
                        </div>

                        <div className="bg-muted/10 border border-border rounded-xl p-4 flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">M</div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{selectedBooking.merchant?.name || 'Pending assignment'}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground">Assigned Service Provider</p>
                          </div>
                        </div>

                        {selectedBooking.agent && (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold">A</div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{selectedBooking.agent.user.name}</p>
                              <p className="text-[10px] font-semibold text-emerald-600">Assigned Field Agent</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Order Breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                        <Package size={14} className="text-primary" />
                        Services & Location
                      </h4>

                      <div className="bg-muted/20 border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 space-y-3">
                          {selectedBooking.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span className="text-xs font-bold text-foreground">{item.service.name}</span>
                              </div>
                              <span className="text-xs font-mono font-bold text-muted-foreground">₹{item.service.basePrice.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-muted/40 px-4 py-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Payable</span>
                          <span className="text-base font-bold text-primary">₹{selectedBooking.total.toLocaleString()}</span>
                        </div>
                      </div>

                      {selectedBooking.address && (
                        <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl flex items-start gap-4">
                          <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-foreground leading-snug">{selectedBooking.address.line1}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{selectedBooking.address.city}, Service Area</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-border bg-muted/5 flex gap-3">
                  <Button
                    className="flex-1 h-11 rounded-xl"
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                  >
                    Close Overview
                  </Button>
                  {['PENDING', 'ACCEPTED', 'AGENT_ASSIGNED'].includes(selectedBooking.status) && (
                    <Button
                      variant="destructive"
                      className="flex-1 h-11 rounded-xl shadow-destructive/10"
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Service Dynamics"
        description="Narrow down booking records by date, location, or value."
      >
        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Operation Period</label>
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" className="h-11 border-border font-medium" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} />
              <Input type="date" className="h-11 border-border font-medium" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Service Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by city..."
                  className="pl-10 h-11 border-border font-medium"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={() => {
                setFilters({ dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', city: '' });
                setShowFilters(false);
                fetchBookings(1);
              }}
            >
              Reset All
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl shadow-lg shadow-primary/20"
              onClick={() => {
                setShowFilters(false);
                fetchBookings(1);
              }}
            >
              Filter Results
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
