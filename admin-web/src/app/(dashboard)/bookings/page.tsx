'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CalendarDays, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

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

const STATUS_TABS = ['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'AGENT_ASSIGNED', 'EN_ROUTE', 'COMPLETED', 'CANCELLED'];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchBookings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
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

  const statusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_PROGRESS': case 'EN_ROUTE': case 'ARRIVED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'CANCELLED': case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'AGENT_ASSIGNED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Global Bookings</h1>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Platform Job Monitor</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 p-1 bg-slate-100/50 border border-slate-200/60 rounded-2xl self-start mb-2 overflow-x-auto max-w-full no-scrollbar">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200",
              statusFilter === s
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-white"
            )}
          >
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <Card className="border-[#e2e8f0]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <Input
                placeholder="Search by booking # or customer..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-[#64748b]">{pagination.total} bookings</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#64748b]" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer / Merchant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-[#64748b]">
                        No bookings found.
                      </TableCell>
                    </TableRow>
                  )}
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs font-semibold text-[#64748b]">{booking.bookingNumber}</TableCell>
                      <TableCell className="font-medium text-[#0f172a]">
                        {booking.items[0]?.service.name || '—'}
                        {booking.items.length > 1 && (
                          <span className="text-xs text-[#64748b] ml-1">+{booking.items.length - 1} more</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#0f172a]">{booking.customer.name || 'Unknown'}</span>
                          <span className="text-xs text-[#64748b]">
                            {booking.merchant ? `via ${booking.merchant.name}` : 'No merchant'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#64748b] whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarDays size={14} className="mr-1.5" />
                          {new Date(booking.scheduledAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹{booking.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                          statusColor(booking.status)
                        )}>
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f1f5f9]">
                  <p className="text-xs text-[#64748b]">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} results)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchBookings(pagination.page - 1)}>
                      <ChevronLeft size={14} />
                    </Button>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchBookings(pagination.page + 1)}>
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
