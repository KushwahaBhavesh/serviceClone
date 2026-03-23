'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BadgeCheck, XCircle, Clock, Loader2, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Merchant {
  id: string;
  businessName: string;
  businessCategory: string | null;
  verificationStatus: string;
  isVerified: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; phone: string | null; status: string };
  verificationDocs: Array<{ id: string; type: string; fileUrl: string; status: string }>;
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
      await api.put(`/admin/merchants/${merchantId}/verify`, { status: newStatus });
      setMerchants(prev =>
        prev.map(m => m.id === merchantId
          ? { ...m, verificationStatus: newStatus, isVerified: newStatus === 'APPROVED' }
          : m
        )
      );
    } catch (err) {
      console.error('Failed to update verification:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusLabel = (status: string) => status.replace(/_/g, ' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Merchants & KYC</h1>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Service Provider Verification Queue</p>
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
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-white"
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
                    <TableHead>Services / Agents</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-[#64748b]">
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
                          className="text-[#059669]"
                          onClick={() => handleVerification(merchant.id, 'APPROVED')}
                          disabled={merchant.verificationStatus === 'APPROVED' || updatingId === merchant.id}
                        >
                          {updatingId === merchant.id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="text-[#dc2626]"
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
    </div>
  );
}
