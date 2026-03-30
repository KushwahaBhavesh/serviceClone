'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CalendarDays, Loader2, ChevronLeft, ChevronRight, Eye, MapPin, Package, User, Store, XCircle, Shield, Zap, Activity, Hash, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <Activity size={14} className="text-primary fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Traffic Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Global Order flow</h1>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center space-x-3 w-72 group focus-within:border-primary/50 transition-all">
              <Search size={16} className="text-slate-500 group-focus-within:text-primary" />
              <input 
                type="text" 
                placeholder="Search job numbers..." 
                className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 placeholder:text-slate-600" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="flex gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={cn(
                "whitespace-nowrap px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                statusFilter === s.id
                  ? "bg-primary text-white shadow-electric"
                  : "text-slate-500 hover:text-white hover:bg-slate-900"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        
        <div className="ml-auto flex items-center gap-6 px-4">
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Volume: {pagination.total}</span>
           </div>
        </div>
      </div>

      {/* Main Content Table */}
      <Card className="border-slate-900 overflow-hidden bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Vector ID</TableHead>
              <TableHead>Service Payload</TableHead>
              <TableHead>Identity Matrix (C/M)</TableHead>
              <TableHead>Deployment Date</TableHead>
              <TableHead>Net Value</TableHead>
              <TableHead className="text-right">Lifecycle Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scanning traffic network...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
                    <Activity size={40} className="text-slate-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No active signal found in directory</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id} className="group">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                       <Hash size={14} className="text-primary opacity-50" />
                       <span className="font-black text-xs text-white uppercase tracking-tighter bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg group-hover:border-primary transition-all font-mono">
                         {booking.bookingNumber}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-black text-white italic uppercase tracking-tight">
                        {booking.items[0]?.service.name || 'Undefined Payload'}
                      </p>
                      {booking.items.length > 1 && (
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                          + {booking.items.length - 1} Multiple Service Units
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <User size={10} className="text-slate-600" />
                         <span className="text-sm font-black text-white tracking-tight leading-none">{booking.customer.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                         <Store size={10} className="text-primary" />
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                            {booking.merchant?.name || 'Awaiting Assignment'}
                         </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2 text-white font-bold text-xs">
                          <CalendarDays size={12} className="text-primary" />
                          {new Date(booking.scheduledAt).toLocaleDateString()}
                       </div>
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1 ml-4.5">T- {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-black text-white tracking-tighter italic">₹{booking.total.toLocaleString()}</p>
                       <Zap size={10} className="text-primary" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-4">
                       <div className={cn(
                        "inline-flex px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border",
                        getStatusStyle(booking.status)
                      )}>
                        {booking.status.replace(/_/g, ' ')}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 border-slate-800 hover:border-primary transition-all group/btn"
                        onClick={() => { setSelectedBooking(booking); setShowDetails(true); }}
                      >
                        <Eye size={16} className="text-slate-500 group-hover/btn:text-primary transition-colors" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-slate-900 bg-slate-950/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Matrix Frame {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 px-3" disabled={pagination.page <= 1} onClick={() => fetchBookings(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" className="h-10 px-3" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchBookings(pagination.page + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Booking Details Modal - The Transaction Intel Terminal */}
      <AnimatePresence>
        {showDetails && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => setShowDetails(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-950 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-[0_0_100px_-20px_rgba(255,107,0,0.15)] relative z-10"
            >
              <div className="h-2 bg-primary w-full" />
              
              <div className="flex flex-col h-[85vh]">
                {/* Modal Header */}
                <div className="px-10 py-8 border-b border-slate-900 bg-slate-900/30 flex justify-between items-center">
                  <div className="flex items-center space-x-6">
                    <div className="h-20 w-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center text-primary shadow-electric">
                      <Hash size={40} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <Activity size={14} className="text-primary fill-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Transaction Intel Dossier</span>
                      </div>
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tight leading-none">{selectedBooking.bookingNumber}</h3>
                      <div className="flex items-center mt-3 gap-4">
                         <div className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border",
                            getStatusStyle(selectedBooking.status)
                          )}>
                            Status: {selectedBooking.status.replace(/_/g, ' ')}
                         </div>
                         <div className="h-1 w-1 rounded-full bg-slate-800" />
                         <div className="flex items-center gap-1.5 text-slate-500 uppercase font-black text-[9px] tracking-widest">
                           Logged: {new Date(selectedBooking.createdAt).toLocaleString()}
                         </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="h-12 w-12 flex items-center justify-center hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all group"
                  >
                    <XCircle size={24} className="group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                   {/* Main Stats */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { label: 'Total Transaction', value: `₹${selectedBooking.total.toLocaleString()}`, icon: Zap, sub: 'Gross Payload Value', active: true },
                        { label: 'Deployment Time', value: new Date(selectedBooking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: CalendarDays, sub: new Date(selectedBooking.scheduledAt).toLocaleDateString() },
                        { label: 'Service Units', value: selectedBooking.items.length, icon: Package, sub: 'Total SKU Units' },
                        { label: 'Fulfillment Factor', value: selectedBooking.merchant ? 'Verified' : 'Unassigned', icon: Shield, sub: 'Operational State' },
                      ].map((intel, idx) => (
                        <div key={idx} className={cn(
                          "bg-slate-900/50 border border-border rounded-2xl p-6 group transition-all",
                          intel.active && "border-primary/30 bg-primary/5 shadow-electric"
                        )}>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{intel.label}</p>
                           <div className="flex items-center justify-between">
                              <span className="text-xl font-black text-white italic tracking-tighter uppercase">{intel.value}</span>
                              <intel.icon size={18} className="text-primary" />
                           </div>
                           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">{intel.sub}</p>
                        </div>
                      ))}
                   </div>

                   {/* Grid Segments */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* Entity Intel */}
                      <div className="space-y-6">
                         <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center">
                            <User size={18} className="mr-3 text-primary" />
                            Identity Data
                         </h4>
                         
                         <div className="space-y-4">
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Customer Node</p>
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-primary font-black text-[10px]">C</div>
                                  <div>
                                     <p className="text-sm font-black text-white uppercase tracking-tight">{selectedBooking.customer.name || 'Anonymous'}</p>
                                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{selectedBooking.customer.email}</p>
                                  </div>
                               </div>
                            </div>

                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Merchant Provider</p>
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-primary font-black text-[10px]">M</div>
                                  <div>
                                     <p className="text-sm font-black text-white uppercase tracking-tight">{selectedBooking.merchant?.name || 'QUEUED FOR DISPATCH'}</p>
                                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Primary Node Vector</p>
                                  </div>
                               </div>
                            </div>

                            {selectedBooking.agent && (
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                                 <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 italic">Deployed Specialist</p>
                                 <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black text-[10px]">S</div>
                                    <div>
                                       <p className="text-sm font-black text-white uppercase tracking-tight">{selectedBooking.agent.user.name}</p>
                                       <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">Field Operation Unit</p>
                                    </div>
                                 </div>
                              </div>
                            )}
                         </div>
                      </div>

                      {/* Transaction Payload Intel */}
                      <div className="space-y-6">
                         <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center">
                            <Package size={18} className="mr-3 text-primary" />
                            Payload Breakdown
                         </h4>

                         <div className="space-y-3 bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem]">
                            {selectedBooking.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-4 border-b border-slate-800 last:border-0 group">
                                <div className="flex items-center gap-3">
                                   <div className="h-2 w-2 rounded-full bg-primary" />
                                   <span className="text-xs font-black text-white uppercase tracking-tight group-hover:text-primary transition-all underline underline-offset-4 decoration-slate-800">{item.service.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-400 font-mono">₹{item.service.basePrice.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="pt-4 flex justify-between items-center text-white">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Sub-total Aggregate</span>
                               <span className="text-lg font-black italic tracking-tighter uppercase">₹{selectedBooking.total.toLocaleString()}</span>
                            </div>
                         </div>

                         {selectedBooking.address && (
                            <div className="space-y-3">
                               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Vector (Location)</h4>
                               <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl flex items-start gap-4">
                                  <MapPin size={20} className="text-primary mt-1" />
                                  <div>
                                     <p className="text-sm font-black text-white uppercase italic tracking-tight">{selectedBooking.address.line1}</p>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedBooking.address.city} Intelligence Hub</p>
                                  </div>
                               </div>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Terminal Actions */}
                   <div className="mt-auto pt-10 border-t border-slate-900">
                      <div className="flex flex-col gap-6">
                         <div className="flex gap-4">
                            <Button
                              className="flex-1 h-16 rounded-[1.5rem] bg-slate-900 border border-slate-800 hover:border-primary text-slate-400 hover:text-white"
                              onClick={() => setShowDetails(false)}
                            >
                              Exit Intelligence Module
                            </Button>
                            {['PENDING', 'ACCEPTED', 'AGENT_ASSIGNED'].includes(selectedBooking.status) && (
                              <Button
                                variant="outline"
                                className="flex-1 h-16 rounded-[1.5rem] border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-lg"
                              >
                                <XCircle size={24} className="mr-3" />
                                Abort Transaction Vector
                              </Button>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
