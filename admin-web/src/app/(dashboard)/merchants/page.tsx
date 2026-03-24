'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, getImageUrl } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  BadgeCheck, XCircle, Clock, Loader2, Store, ChevronLeft, ChevronRight,
  Eye, FileText, Download, MapPin, Phone, Mail, CheckCircle2, AlertCircle,
  X, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const STATUS_FILTERS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED'];

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
      // Update the doc status in local state
      if (selectedMerchant) {
        const updatedDocs = selectedMerchant.verificationDocs.map(d =>
          d.id === docId ? { ...d, status, reviewNote: note || null } : d
        );
        setSelectedMerchant({ ...selectedMerchant, verificationDocs: updatedDocs });
        // Also update the parent merchants list
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

  const statusCounts = {
    pending: merchants.filter(m => m.verificationStatus === 'PENDING_REVIEW').length,
    approved: merchants.filter(m => m.verificationStatus === 'APPROVED').length,
    rejected: merchants.filter(m => m.verificationStatus === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Merchants & KYC</h1>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Service Provider Verification Queue</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl">
            <Clock size={14} className="text-amber-500" />
            <span className="text-[11px] font-black text-amber-600">{statusCounts.pending} Pending</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
            <BadgeCheck size={14} className="text-emerald-500" />
            <span className="text-[11px] font-black text-emerald-600">{statusCounts.approved} Approved</span>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100/50 border border-slate-200/60 rounded-2xl self-start">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200",
              statusFilter === s
                ? "bg-[#FF6B00] text-white shadow-lg shadow-orange-100/50"
                : "text-slate-500 hover:text-[#FF6B00] hover:bg-white"
            )}
          >
            {s === 'ALL' ? 'All' : statusLabel(s)}
          </button>
        ))}
      </div>

      <Card className="border-[#e2e8f0]">
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>
            {pagination.total} merchant{pagination.total !== 1 ? 's' : ''} found
          </CardDescription>
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
                    <TableHead>Business</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Services / Agents</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-[#64748b]">
                        No merchants found.
                      </TableCell>
                    </TableRow>
                  )}
                  {merchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-[#f8fafc] border border-[#f1f5f9] rounded flex items-center justify-center">
                            <Store size={14} className="text-[#64748b]" />
                          </div>
                          <div>
                            <p className="text-[#0f172a]">{merchant.businessName}</p>
                            <p className="text-xs text-[#64748b] font-normal">{merchant.user.name || merchant.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#64748b]">{merchant.businessCategory || '—'}</TableCell>
                      <TableCell className="text-[#64748b]">
                        {merchant.city ? (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-[#FF6B00]" />
                            <span className="text-xs">{merchant.city}{merchant.state ? `, ${merchant.state}` : ''}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">No location</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[#64748b] text-xs">
                        {merchant._count.merchantServices} svcs · {merchant._count.agents} agents
                      </TableCell>
                      <TableCell className="text-[#64748b]">
                        {new Date(merchant.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                          merchant.verificationStatus === 'APPROVED' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                          merchant.verificationStatus === 'PENDING_REVIEW' && "bg-amber-50 text-amber-600 border-amber-100",
                          merchant.verificationStatus === 'REJECTED' && "bg-rose-50 text-rose-600 border-rose-100",
                          merchant.verificationStatus === 'NOT_SUBMITTED' && "bg-slate-50 text-slate-400 border-slate-100",
                        )}>
                          {merchant.verificationStatus === 'APPROVED' && <BadgeCheck size={12} className="mr-1.5" />}
                          {merchant.verificationStatus === 'PENDING_REVIEW' && <Clock size={12} className="mr-1.5" />}
                          {merchant.verificationStatus === 'REJECTED' && <XCircle size={12} className="mr-1.5" />}
                          {statusLabel(merchant.verificationStatus)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost" size="sm"
                          className="text-[#64748b] hover:text-[#FF6B00] hover:bg-orange-50"
                          onClick={() => { setSelectedMerchant(merchant); setShowDocs(true); }}
                        >
                          <Eye size={14} className="mr-1" /> Review
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="text-[#059669] hover:bg-emerald-50"
                          onClick={() => handleVerification(merchant.id, 'APPROVED')}
                          disabled={merchant.verificationStatus === 'APPROVED' || updatingId === merchant.id}
                        >
                          {updatingId === merchant.id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="text-[#dc2626] hover:bg-rose-50"
                          onClick={() => handleVerification(merchant.id, 'REJECTED')}
                          disabled={merchant.verificationStatus === 'REJECTED' || updatingId === merchant.id}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f1f5f9]">
                  <p className="text-xs text-[#64748b]">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchMerchants(pagination.page - 1)}>
                      <ChevronLeft size={14} />
                    </Button>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchMerchants(pagination.page + 1)}>
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* KYC Review Modal */}
      {showDocs && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF8533] p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black tracking-tight">{selectedMerchant.businessName}</h3>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-[0.2em] mt-1">KYC Verification Review</p>
                </div>
                <button
                  onClick={() => { setShowDocs(false); setReviewNote(''); }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-y-auto">
              {/* Merchant Info */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-600">{selectedMerchant.user.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-600">{selectedMerchant.phone || selectedMerchant.user.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#FF6B00]" />
                    <span className="text-xs text-slate-600">
                      {selectedMerchant.city || 'No location'}
                      {selectedMerchant.latitude ? ` (${selectedMerchant.latitude.toFixed(4)}, ${selectedMerchant.longitude?.toFixed(4)})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-600">
                      {selectedMerchant._count.merchantServices} services · {selectedMerchant._count.agents} agents
                    </span>
                  </div>
                </div>
                {selectedMerchant.description && (
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">{selectedMerchant.description}</p>
                )}
                {selectedMerchant.address && (
                  <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">
                    {selectedMerchant.address}, {selectedMerchant.city} {selectedMerchant.state} {selectedMerchant.serviceRadius}km radius
                  </p>
                )}
              </div>

              {/* Documents Section */}
              <div className="p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Submitted Documents</h4>

                {selectedMerchant.verificationDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMerchant.verificationDocs.map((doc) => (
                      <div key={doc.id} className="group bg-white border-2 border-slate-100 rounded-2xl p-4 transition-all hover:border-[#FF6B00]/20 hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <FileText className="text-[#FF6B00]" size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900">{doc.type.replace(/_/g, ' ')}</p>
                              <p className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                              doc.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              doc.status === 'REJECTED' ? "bg-rose-50 text-rose-600 border-rose-100" :
                              "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                              {doc.status === 'APPROVED' && <CheckCircle2 size={10} className="inline mr-1" />}
                              {doc.status === 'REJECTED' && <AlertCircle size={10} className="inline mr-1" />}
                              {doc.status.replace(/_/g, ' ')}
                            </span>

                            <a
                              href={getImageUrl(doc.fileUrl) || doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <Eye size={14} className="text-slate-500" />
                            </a>
                            <a
                              href={getImageUrl(doc.fileUrl) || doc.fileUrl}
                              download
                              className="p-2 bg-slate-50 border border-slate-100 rounded-lg hover:bg-orange-50 hover:text-[#FF6B00] hover:border-[#FF6B00]/20 transition-all"
                            >
                              <Download size={14} />
                            </a>

                            {/* Per-Doc Actions */}
                            {doc.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleDocUpdate(doc.id, 'APPROVED')}
                                disabled={docUpdatingId === doc.id}
                                className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              >
                                {docUpdatingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                              </button>
                            )}
                            {doc.status !== 'REJECTED' && (
                              <button
                                onClick={() => {
                                  const note = prompt('Reason for rejecting this document:');
                                  if (note !== null) handleDocUpdate(doc.id, 'REJECTED', note);
                                }}
                                disabled={docUpdatingId === doc.id}
                                className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {doc.reviewNote && (
                          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                            <MessageSquare size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">{doc.reviewNote}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Actions */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                {/* Review Note Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review Notes (optional, shown on reject)</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Add a reason for rejection or instructions for the merchant..."
                    className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm resize-none focus:border-[#FF6B00] focus:outline-none transition-colors"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-[#FF6B00] text-white hover:bg-[#FF8533]"
                    disabled={selectedMerchant.verificationStatus === 'APPROVED' || updatingId === selectedMerchant.id}
                    onClick={() => {
                      handleVerification(selectedMerchant.id, 'APPROVED');
                      setShowDocs(false);
                    }}
                  >
                    {updatingId === selectedMerchant.id ? <Loader2 size={14} className="animate-spin mr-2" /> : <BadgeCheck size={14} className="mr-2" />}
                    Approve Merchant
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    variant="outline"
                    disabled={selectedMerchant.verificationStatus === 'REJECTED' || updatingId === selectedMerchant.id}
                    onClick={() => {
                      handleVerification(selectedMerchant.id, 'REJECTED');
                      setShowDocs(false);
                    }}
                  >
                    <XCircle size={14} className="mr-2" />
                    Reject Application
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
