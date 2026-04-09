'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, getImageUrl } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BadgeCheck, XCircle, Clock, Loader2, Store, ChevronLeft, ChevronRight,
  Eye, FileText, Download, MapPin, Phone, Mail, CheckCircle2, AlertCircle,
  X, MessageSquare, ShieldCheck, Zap, Filter, Search, MoreVertical, Calendar,
  Building2, Shield, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

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
  { id: 'ALL', label: 'All Merchants' },
  { id: 'PENDING_REVIEW', label: 'Pending Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
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

  // Advanced Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchMerchants = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      if (filters.city) params.city = filters.city;
      if (filters.category) params.category = filters.category;

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

  return (
    <div className="pb-10">
      <Breadcrumbs />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Merchants & KYC</h1>
          <p className="text-sm text-muted-foreground mt-1">Review business applications and verify merchant credentials.</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="h-10 px-4 bg-muted border-transparent text-muted-foreground gap-2">
            <Clock size={14} />
            <span>{pagination.total} Applications</span>
          </Badge>
        </div>
      </div>

      {/* Control Strip */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Filter by business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMerchants(1)}
              className="pl-10 h-10 bg-muted/50 border-transparent focus:bg-background transition-all font-medium text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg w-full md:w-auto overflow-x-auto">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                  statusFilter === s.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden md:flex h-9 gap-2 border-border hover:bg-muted hover:text-foreground transition-all"
            onClick={() => setShowFilters(true)}
          >
            <Filter size={14} className={cn(Object.values(filters).some(v => v) ? "text-primary" : "text-muted-foreground")} />
            <span>Advanced Filters</span>
            {Object.values(filters).some(v => v) && (
              <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-white text-[10px]">
                {Object.values(filters).filter(v => v).length}
              </Badge>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Main Content Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[300px]">Merchant Profile</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Operations</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-32 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-28 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-24 rounded-lg" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-10 w-12 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : merchants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <EmptyState
                    icon={Store}
                    title="No merchants found"
                    description="We couldn't find any merchant applications matching your current filters or search query."
                    action={{
                      label: "Clear All Filters",
                      onClick: () => {
                        setStatusFilter('ALL');
                        setFilters({ city: '', category: '', dateFrom: '', dateTo: '' });
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              merchants.map((merchant) => (
                <TableRow key={merchant.id} className="group hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-primary border border-border group-hover:border-primary/30 transition-all">
                        <Building2 size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-foreground truncate">{merchant.businessName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{merchant.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] bg-muted/50 border-transparent text-muted-foreground font-bold h-6">
                      {merchant.businessCategory || 'General'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                        <MapPin size={12} className="text-muted-foreground" />
                        {merchant.city || 'Remote'}
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-4.5">{merchant.state || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-[11px] font-bold">
                      <span className="text-primary">{merchant._count.merchantServices} Services</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-foreground">{merchant._count.agents} Agents</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      merchant.verificationStatus === 'APPROVED' ? 'success' :
                        merchant.verificationStatus === 'REJECTED' ? 'destructive' :
                          'warning'
                    } className="text-[10px] font-bold border-transparent">
                      {merchant.verificationStatus === 'APPROVED' && <CheckCircle2 size={10} className="mr-1" />}
                      {merchant.verificationStatus === 'PENDING_REVIEW' && <Clock size={10} className="mr-1" />}
                      {merchant.verificationStatus.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline" size="sm"
                        className="h-8 gap-2"
                        onClick={() => { setSelectedMerchant(merchant); setShowDocs(true); }}
                      >
                        <Eye size={14} />
                        <span>Review</span>
                      </Button>
                      <Link href={`/merchants/${merchant.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                          <Info size={12} />
                          Details
                        </Button>
                      </Link>
                      <Button
                        variant="default" size="sm"
                        className="h-8"
                        onClick={() => handleVerification(merchant.id, 'APPROVED')}
                        disabled={merchant.verificationStatus === 'APPROVED' || updatingId === merchant.id}
                      >
                        {updatingId === merchant.id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
            <p className="text-xs font-medium text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page <= 1} onClick={() => fetchMerchants(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchMerchants(pagination.page + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* KYC Review Modal */}
      <AnimatePresence>
        {showDocs && selectedMerchant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => { setShowDocs(false); setReviewNote(''); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="flex flex-col h-[85vh]">
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-border bg-muted/30 flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                      <Store size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground leading-tight">{selectedMerchant.businessName}</h3>
                      <div className="flex items-center mt-1.5 gap-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[10px] uppercase">
                          <Shield size={12} />
                          ID: {selectedMerchant.id.slice(-8).toUpperCase()}
                        </div>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <Badge variant="secondary" className="h-5 text-[9px] font-bold py-0">{selectedMerchant.verificationStatus}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => { setShowDocs(false); setReviewNote(''); }}
                    className="h-10 w-10 text-muted-foreground"
                  >
                    <X size={20} />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Business Intel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Admin Contact', value: selectedMerchant.user.email, icon: Mail },
                      { label: 'Business Line', value: selectedMerchant.phone || 'N/A', icon: Phone },
                      { label: 'Headquarters', value: selectedMerchant.city || 'Remote', icon: MapPin },
                    ].map((intel, idx) => (
                      <div key={idx} className="bg-muted/30 border border-border rounded-xl p-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">{intel.label}</p>
                        <div className="flex items-center gap-2">
                          <intel.icon size={14} className="text-primary" />
                          <span className="text-xs font-semibold text-foreground truncate">{intel.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verification Documents */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        Submitted Documents
                      </h4>
                    </div>

                    {selectedMerchant.verificationDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 bg-muted/20 border border-dashed border-border rounded-xl">
                        <Info size={32} className="text-muted-foreground/30 mb-3" />
                        <p className="font-semibold text-xs text-muted-foreground italic">No verification documents have been submitted yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {selectedMerchant.verificationDocs.map((doc) => (
                          <div key={doc.id} className="bg-background border border-border rounded-xl p-5 hover:border-primary/20 transition-all group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="bg-muted p-2.5 rounded-lg border border-border group-hover:border-primary/20 transition-all">
                                  <FileText className="text-primary" size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-foreground uppercase">{doc.type.replace(/_/g, ' ')}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">Reference: {doc.id.slice(0, 12).toUpperCase()}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Badge variant={
                                  doc.status === 'APPROVED' ? 'success' :
                                    doc.status === 'REJECTED' ? 'destructive' :
                                      'warning'
                                } className="h-6 text-[9px] font-bold border-transparent">
                                  {doc.status.replace(/_/g, ' ')}
                                </Badge>

                                <div className="h-8 w-px bg-border mx-1" />

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                    onClick={() => window.open(getImageUrl(doc.fileUrl) || doc.fileUrl, '_blank')}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <Button
                                    variant="outline" size="sm"
                                    className="h-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200"
                                    onClick={() => handleDocUpdate(doc.id, 'APPROVED')}
                                    disabled={docUpdatingId === doc.id}
                                  >
                                    {docUpdatingId === doc.id ? <Loader2 size={12} className="animate-spin" /> : 'Verify'}
                                  </Button>
                                  <Button
                                    variant="outline" size="sm"
                                    className="h-8 text-destructive bg-destructive/5 hover:bg-destructive/10 border-destructive/20"
                                    onClick={() => {
                                      const note = prompt('Enter rejection reason:');
                                      if (note !== null) handleDocUpdate(doc.id, 'REJECTED', note);
                                    }}
                                    disabled={docUpdatingId === doc.id}
                                  >
                                    Flag
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {doc.reviewNote && (
                              <div className="mt-4 p-3 bg-destructive/5 border border-destructive/10 rounded-lg flex items-start gap-3">
                                <AlertCircle size={14} className="text-destructive mt-0.5" />
                                <p className="text-[11px] text-destructive-foreground italic">{doc.reviewNote}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Approval Note */}
                  <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Internal Review Notes</label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add final review notes before approval/rejection..."
                      className="w-full bg-muted/30 border border-border rounded-xl p-4 text-sm font-medium text-foreground focus:border-primary/50 focus:ring-0 placeholder:text-muted-foreground transition-all min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-6 border-t border-border bg-muted/30 flex gap-4">
                  <Button
                    variant="default"
                    className="flex-1 h-12 shadow-lg shadow-primary/20"
                    disabled={selectedMerchant.verificationStatus === 'APPROVED' || updatingId === selectedMerchant.id}
                    onClick={() => {
                      handleVerification(selectedMerchant.id, 'APPROVED');
                      setShowDocs(false);
                    }}
                  >
                    {updatingId === selectedMerchant.id ? <Loader2 size={18} className="animate-spin mr-2" /> : <BadgeCheck size={18} className="mr-2" />}
                    Confirm Business Verification
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-destructive/20 text-destructive hover:bg-destructive/5"
                    disabled={selectedMerchant.verificationStatus === 'REJECTED' || updatingId === selectedMerchant.id}
                    onClick={() => {
                      handleVerification(selectedMerchant.id, 'REJECTED');
                      setShowDocs(false);
                    }}
                  >
                    <XCircle size={18} className="mr-2" />
                    Reject Application
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Advanced Merchant Filters"
        description="Narrow down business applications by specific criteria."
      >
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Business Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-11 bg-muted/50 border border-border rounded-xl px-4 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none appearance-none"
              >
                <option value="">All Categories</option>
                <option value="Home Services">Home Services</option>
                <option value="Beauty & Wellness">Beauty & Wellness</option>
                <option value="Electronics">Electronics</option>
                <option value="Automotive">Automotive</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target City</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="e.g. New York"
                  className="pl-10 h-11 border-border font-medium"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Registration Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" className="h-11 border-border font-medium" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} />
              <Input type="date" className="h-11 border-border font-medium" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={() => {
                setFilters({ city: '', category: '', dateFrom: '', dateTo: '' });
                setShowFilters(false);
                fetchMerchants(1);
              }}
            >
              Reset Filters
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl shadow-lg shadow-primary/20"
              onClick={() => {
                setShowFilters(false);
                fetchMerchants(1);
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
