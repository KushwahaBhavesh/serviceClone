'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BadgeCheck, XCircle, Clock, Loader2, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      // In a real app, hit: await api.get('/admin/merchants');
      // For MVP, we simulate
      setTimeout(() => {
        setMerchants([
          { id: '1', name: 'Elite Cleaners', owner: 'Rahul K.', status: 'PENDING', submitted: '2025-10-12', category: 'Cleaning' },
          { id: '2', name: 'QuickFix Plumbers', owner: 'Amit S.', status: 'APPROVED', submitted: '2025-09-28', category: 'Plumbing' },
          { id: '3', name: 'Urban Spark', owner: 'Neha J.', status: 'REJECTED', submitted: '2025-10-10', category: 'Electrician' },
        ]);
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    // await api.put(`/admin/merchants/${id}/status`, { status: newStatus });
    setMerchants(prev => 
      prev.map(m => m.id === id ? { ...m, status: newStatus } : m)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Merchants & KYC</h1>
        <p className="text-[#64748b]">Review and manage service providers on the platform.</p>
      </div>

      <Card className="border-[#e2e8f0]">
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>Review pending KYC applications before they go live.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#64748b]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-[#64748b]">
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
                          <p className="text-[#0f172a]">{merchant.name}</p>
                          <p className="text-xs text-[#64748b] font-normal">{merchant.owner}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{merchant.category}</TableCell>
                    <TableCell className="text-[#64748b]">
                      {new Date(merchant.submitted).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        merchant.status === 'APPROVED' && "bg-[#ecfdf5] text-[#059669]",
                        merchant.status === 'PENDING' && "bg-[#fef3c7] text-[#d97706]",
                        merchant.status === 'REJECTED' && "bg-[#fef2f2] text-[#dc2626]"
                      )}>
                        {merchant.status === 'APPROVED' && <BadgeCheck size={12} className="mr-1" />}
                        {merchant.status === 'PENDING' && <Clock size={12} className="mr-1" />}
                        {merchant.status === 'REJECTED' && <XCircle size={12} className="mr-1" />}
                        {merchant.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-[#059669]"
                        onClick={() => handleStatusUpdate(merchant.id, 'APPROVED')}
                        disabled={merchant.status === 'APPROVED'}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-[#dc2626]"
                        onClick={() => handleStatusUpdate(merchant.id, 'REJECTED')}
                        disabled={merchant.status === 'REJECTED'}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
