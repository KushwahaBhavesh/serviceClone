'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, getImageUrl } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  BadgeCheck, XCircle, Clock, Loader2, Store, ChevronLeft, ChevronRight,
  Eye, FileText, Download, MapPin, Phone, Mail, CheckCircle2, AlertCircle,
  X, MessageSquare, ShieldCheck, Zap, Filter, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VerificationDoc {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
}

interface Merchant {
  id: string;
  businessName: string;
  businessCategory: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadius: number;
  rating: number;
  totalReviews: number;
  verificationStatus: string;
  isVerified: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; phone: string | null; status: string };
  verificationDocs: VerificationDoc[];
  _count: { agents: number; merchantServices: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Nodes' },
  { id: 'PENDING_REVIEW', label: 'Awaiting Clearance' },
  { id: 'APPROVED', label: 'Verified' },
  { id: 'REJECTED', label: 'Quarantined' },
  { id: 'NOT_SUBMITTED', label: 'Inactive' },
];

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [docUpdatingId, setDocUpdatingId] = useState<string | null>(null);

  const fetchMerchants = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/admin/merchants', { params });
      setMerchants(res.data.merchants);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch merchants:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const handleVerification = async (merchantId: string, newStatus: string) => {
    setUpdatingId(merchantId);
    try {
      await api.put(`/admin/merchants/${merchantId}/verify`, {
        status: newStatus,
        reviewNote: newStatus === 'REJECTED' ? reviewNote : undefined,
      });
      setMerchants(prev =>
        prev.map(m => m.id === merchantId
          ? { ...m, verificationStatus: newStatus, isVerified: newStatus === 'APPROVED' }
          : m
        )
      );
      setReviewNote('');
    } catch (err) {
      console.error('Failed to update verification:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDocUpdate = async (docId: string, status: string, note?: string) => {
    setDocUpdatingId(docId);
    try {
      await api.put(`/admin/merchants/${selectedMerchant?.id}/docs`, {
        id: docId,
        status,
        reviewNote: note,
      });
      if (selectedMerchant) {
        const updatedDocs = selectedMerchant.verificationDocs.map(d =>
          d.id === docId ? { ...d, status, reviewNote: note || null } : d
        );
        setSelectedMerchant({ ...selectedMerchant, verificationDocs: updatedDocs });
        setMerchants(prev =>
          prev.map(m => m.id === selectedMerchant.id
            ? { ...m, verificationDocs: updatedDocs }
            : m
          )
        );
      }
    } catch (err) {
      console.error('Failed to update doc:', err);
    } finally {
      setDocUpdatingId(null);
    }
  };

  const statusLabel = (status: string) => status.replace(/_/g, ' ');

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <ShieldCheck size={14} className="text-primary fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Compliance Portal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Merchant Directories</h1>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center space-x-3 w-64 group focus-within:border-primary/50 transition-all">
              <Search size={16} className="text-slate-500 group-focus-within:text-primary" />
              <input type="text" placeholder="Filter merchants..." className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 placeholder:text-slate-600" />
           </div>
           <Button variant="outline" className="h-11">
              <Filter size={16} className="mr-2" />
              Advanced
           </Button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
        <div className="flex gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={cn(
                "px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
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
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting: {pagination.total}</span>
           </div>
        </div>
      </div>

      {/* Main Content Table */}
      <Card className="border-slate-900 overflow-hidden bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Node Identity</TableHead>
              <TableHead>Protocol / Category</TableHead>
              <TableHead>Operational Geofence</TableHead>
              <TableHead>Scale (Agents/Service)</TableHead>
              <TableHead>Status Code</TableHead>
              <TableHead className="text-right">Action Vectors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Retrieving node data...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : merchants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
                    <Store size={40} className="text-slate-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No matching nodes found in directory</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              merchants.map((merchant) => (
                <TableRow key={merchant.id} className="group">
                  <TableCell>
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center group-hover:border-primary/50 transition-all">
                        <Store size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white tracking-tight">{merchant.businessName}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-slate-400">{merchant.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {merchant.businessCategory || 'GENERAL'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {merchant.city ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-tight">
                          <MapPin size={12} className="text-primary" />
                          {merchant.city}
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mt-1 ml-4.5 tracking-widest">{merchant.state || 'Region Unspecified'}</p>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">No Geo Data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest">
                       <span className="text-primary">{merchant._count.merchantServices} Services</span>
                       <span className="text-slate-700">/</span>
                       <span className="text-white">{merchant._count.agents} Agents</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border",
                      merchant.verificationStatus === 'APPROVED' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      merchant.verificationStatus === 'PENDING_REVIEW' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      merchant.verificationStatus === 'REJECTED' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      merchant.verificationStatus === 'NOT_SUBMITTED' && "bg-slate-900 text-slate-500 border-slate-800",
                    )}>
                      {merchant.verificationStatus === 'APPROVED' && <BadgeCheck size={12} className="mr-2" />}
                      {merchant.verificationStatus === 'PENDING_REVIEW' && <Clock size={12} className="mr-2" />}
                      {merchant.verificationStatus === 'REJECTED' && <XCircle size={12} className="mr-2" />}
                      {statusLabel(merchant.verificationStatus)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 group/btn"
                        onClick={() => { setSelectedMerchant(merchant); setShowDocs(true); }}
                      >
                        <Eye size={14} className="mr-2 group-hover/btn:text-primary transition-colors" />
                        Intelligence
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-10 px-4"
                        onClick={() => handleVerification(merchant.id, 'APPROVED')}
                        disabled={merchant.verificationStatus === 'APPROVED' || updatingId === merchant.id}
                      >
                        {updatingId === merchant.id ? <Loader2 size={14} className="animate-spin" /> : 'Authorize'}
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
              Directory Frame {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 px-3" disabled={pagination.page <= 1} onClick={() => fetchMerchants(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" className="h-10 px-3" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchMerchants(pagination.page + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* KYC Review Modal - The Verification Terminal */}
      <AnimatePresence>
        {showDocs && selectedMerchant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => { setShowDocs(false); setReviewNote(''); }}
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
                      <Store size={40} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <Zap size={14} className="text-primary fill-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Intelligence Dossier</span>
                      </div>
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tight leading-none">{selectedMerchant.businessName}</h3>
                      <div className="flex items-center mt-3 gap-4">
                         <div className="flex items-center gap-1.5 text-slate-500 uppercase font-black text-[9px] tracking-widest">
                           <ShieldCheck size={12} className="text-slate-600" />
                           ID: {selectedMerchant.id.slice(-8).toUpperCase()}
                         </div>
                         <div className="h-1 w-1 rounded-full bg-slate-800" />
                         <div className="flex items-center gap-1.5 text-slate-500 uppercase font-black text-[9px] tracking-widest">
                           <Clock size={12} className="text-slate-600" />
                           Node Age: 124 Days
                         </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowDocs(false); setReviewNote(''); }}
                    className="h-12 w-12 flex items-center justify-center hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all group"
                  >
                    <X size={24} className="group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                   {/* Intel Segments */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { label: 'Primary Terminal', value: selectedMerchant.user.email, icon: Mail },
                        { label: 'Secure Line', value: selectedMerchant.phone || 'N/A', icon: Phone },
                        { label: 'Operational Hub', value: selectedMerchant.city || 'Remote', icon: MapPin },
                      ].map((intel, idx) => (
                        <div key={idx} className="bg-slate-900/50 border border-border rounded-2xl p-5 group hover:border-primary/30 transition-all">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{intel.label}</p>
                           <div className="flex items-center space-x-3">
                              <intel.icon size={18} className="text-primary" />
                              <span className="text-sm font-bold text-white truncate">{intel.value}</span>
                           </div>
                        </div>
                      ))}
                   </div>

                   {/* Document Verification Terminal */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center">
                            <FileText size={18} className="mr-3 text-primary" />
                            Security Clearance Documents
                         </h4>
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                           Total Payloads: {selectedMerchant.verificationDocs.length}
                         </span>
                      </div>

                      {selectedMerchant.verificationDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-900 rounded-[2rem]">
                          <AlertCircle size={48} className="text-slate-800 mb-4" />
                          <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-600">No cryptographic proof submitted</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {selectedMerchant.verificationDocs.map((doc) => (
                            <div key={doc.id} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 transition-all hover:bg-slate-900 group">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 group-hover:border-primary/50 transition-all">
                                    <FileText className="text-primary" size={24} />
                                  </div>
                                  <div>
                                    <p className="font-black text-lg text-white uppercase italic tracking-tight">{doc.type.replace(/_/g, ' ')}</p>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Payload Hash: {doc.id.slice(0, 12).toUpperCase()}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border mr-4",
                                    doc.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                    doc.status === 'REJECTED' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  )}>
                                    {doc.status.replace(/_/g, ' ')}
                                  </div>

                                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                                    <a
                                      href={getImageUrl(doc.fileUrl) || doc.fileUrl}
                                      target="_blank" rel="noopener noreferrer"
                                      className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-all"
                                    >
                                      <Eye size={18} />
                                    </a>
                                    <a
                                      href={getImageUrl(doc.fileUrl) || doc.fileUrl}
                                      download
                                      className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-all"
                                    >
                                      <Download size={18} />
                                    </a>
                                  </div>

                                  <div className="h-10 w-px bg-slate-800 mx-2" />

                                  <div className="flex items-center gap-1.5">
                                     <button
                                      onClick={() => handleDocUpdate(doc.id, 'APPROVED')}
                                      disabled={docUpdatingId === doc.id}
                                      className="h-10 px-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50"
                                    >
                                      {docUpdatingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : 'Validate'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        const note = prompt('Enter violation details:');
                                        if (note !== null) handleDocUpdate(doc.id, 'REJECTED', note);
                                      }}
                                      disabled={docUpdatingId === doc.id}
                                      className="h-10 px-4 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all"
                                    >
                                      Flag
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {doc.reviewNote && (
                                <div className="mt-4 flex items-start gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                  <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Violation Log:</p>
                                     <p className="text-xs text-rose-400 font-medium">{doc.reviewNote}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                   </div>

                   {/* Terminal Controls */}
                   <div className="mt-auto pt-10 border-t border-slate-900">
                      <div className="flex flex-col gap-6">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Global Clearance Directive</label>
                            <textarea
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="Enter final system notes for this node clearance..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] p-6 text-sm font-bold text-white focus:border-primary/50 focus:ring-0 placeholder:text-slate-700 transition-all min-h-[100px]"
                            />
                         </div>

                         <div className="flex gap-4">
                            <Button
                              className="flex-1 h-16 rounded-[1.5rem] bg-primary hover:bg-[#e56000] text-lg"
                              disabled={selectedMerchant.verificationStatus === 'APPROVED' || updatingId === selectedMerchant.id}
                              onClick={() => {
                                handleVerification(selectedMerchant.id, 'APPROVED');
                                setShowDocs(false);
                              }}
                            >
                              {updatingId === selectedMerchant.id ? <Loader2 size={24} className="animate-spin mr-3" /> : <BadgeCheck size={24} className="mr-3" />}
                              Authorize Full Clearance
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 h-16 rounded-[1.5rem] border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-lg"
                              disabled={selectedMerchant.verificationStatus === 'REJECTED' || updatingId === selectedMerchant.id}
                              onClick={() => {
                                handleVerification(selectedMerchant.id, 'REJECTED');
                                setShowDocs(false);
                              }}
                            >
                              <XCircle size={24} className="mr-3" />
                              Quarantine Node
                            </Button>
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
