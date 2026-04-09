'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getImageUrl } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
    ArrowLeft, Store, Mail, Phone, MapPin, Shield, ShieldCheck,
    FileText, Eye, Check, X, Loader2, Calendar, Users, Settings,
    Building2, CreditCard, ExternalLink, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface VerificationDoc {
    id: string;
    type: string;
    fileUrl: string;
    status: string;
    reviewNote: string | null;
    createdAt: string;
}

interface MerchantDetail {
    id: string;
    userId: string;
    businessName: string;
    businessCategory: string | null;
    description: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    serviceRadius: number;
    rating: number;
    totalReviews: number;
    isVerified: boolean;
    verificationStatus: string;
    panNumber: string | null;
    gstNumber: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        status: string;
        createdAt: string;
        avatarUrl: string | null;
    };
    verificationDocs: VerificationDoc[];
    subscription: { tier: string; status: string } | null;
    _count: {
        agents: number;
        merchantServices: number;
        promos: number;
    };
}

const DOC_TYPE_LABELS: Record<string, string> = {
    PAN_CARD: 'PAN Card',
    AADHAAR: 'Aadhaar Card',
    GST_CERTIFICATE: 'GST Certificate',
    BUSINESS_LICENSE: 'Business License',
    BANK_PROOF: 'Bank Proof',
    OTHER: 'Other Document',
};

const getVerificationBadge = (status: string) => {
    switch (status) {
        case 'APPROVED': return { variant: 'success' as const, label: 'Approved' };
        case 'REJECTED': return { variant: 'destructive' as const, label: 'Rejected' };
        case 'PENDING_REVIEW': return { variant: 'warning' as const, label: 'Pending Review' };
        default: return { variant: 'secondary' as const, label: status.replace(/_/g, ' ') };
    }
};

export default function MerchantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const merchantId = params.id as string;

    const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Confirm modal states
    const [confirmAction, setConfirmAction] = useState<{
        type: 'approve' | 'reject' | 'suspend';
        target: 'merchant' | 'doc';
        docId?: string;
    } | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Preview modal
    const [previewDoc, setPreviewDoc] = useState<string | null>(null);

    useEffect(() => {
        const fetchMerchant = async () => {
            try {
                const res = await api.get(`/admin/merchants/${merchantId}`);
                setMerchant(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load merchant details');
            } finally {
                setLoading(false);
            }
        };
        fetchMerchant();
    }, [merchantId]);

    const handleVerificationAction = async () => {
        if (!confirmAction || !merchant) return;
        setActionLoading(true);

        try {
            if (confirmAction.target === 'doc' && confirmAction.docId) {
                const status = confirmAction.type === 'approve' ? 'APPROVED' : 'REJECTED';
                await api.put(`/admin/merchants/${merchantId}/docs`, {
                    docId: confirmAction.docId,
                    status,
                    reviewNote,
                });
                setMerchant(prev => prev ? {
                    ...prev,
                    verificationDocs: prev.verificationDocs.map(d =>
                        d.id === confirmAction.docId ? { ...d, status, reviewNote } : d
                    ),
                } : null);
            } else {
                const status = confirmAction.type === 'approve' ? 'APPROVED' : 'REJECTED';
                await api.put(`/admin/merchants/${merchantId}/verify`, {
                    status,
                    reviewNote,
                });
                setMerchant(prev => prev ? {
                    ...prev,
                    verificationStatus: status,
                    isVerified: status === 'APPROVED',
                } : null);
            }
        } catch (err: any) {
            console.error('Action failed:', err);
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
            setReviewNote('');
        }
    };

    if (loading) {
        return (
            <div className="pb-10">
                <Breadcrumbs />
                <Skeleton className="h-8 w-48 rounded-lg mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-xl lg:col-span-1" />
                    <Skeleton className="h-64 rounded-xl lg:col-span-2" />
                </div>
            </div>
        );
    }

    if (error || !merchant) {
        return (
            <div className="pb-10">
                <Breadcrumbs />
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-destructive text-white flex items-center justify-center font-bold">!</div>
                    <div>
                        <p className="font-bold text-sm">Error Loading Merchant</p>
                        <p className="text-xs opacity-90">{error || 'Merchant not found'}</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={() => router.push('/merchants')}>
                        Back to Merchants
                    </Button>
                </div>
            </div>
        );
    }

    const badge = getVerificationBadge(merchant.verificationStatus);

    return (
        <div className="pb-10">
            <Breadcrumbs />

            {/* Back + Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/merchants')}>
                        <ArrowLeft size={16} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {merchant.businessName}
                            </h1>
                            <Badge variant={badge.variant} className="text-[10px] font-bold uppercase tracking-wider">
                                {badge.label}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Merchant ID: {merchant.id}
                        </p>
                    </div>
                </div>

                {/* Overall KYC Actions */}
                {merchant.verificationStatus === 'PENDING_REVIEW' && (
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-10 gap-2 border-destructive/20 text-destructive hover:bg-destructive/5"
                            onClick={() => setConfirmAction({ type: 'reject', target: 'merchant' })}
                        >
                            <X size={14} />
                            Reject KYC
                        </Button>
                        <Button
                            className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                            onClick={() => setConfirmAction({ type: 'approve', target: 'merchant' })}
                        >
                            <Check size={14} />
                            Approve KYC
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Info */}
                <div className="space-y-6">
                    {/* Owner Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Owner Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                                    {merchant.user.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{merchant.user.name || 'Unknown'}</p>
                                    <Badge variant={merchant.user.status === 'ACTIVE' ? 'success' : 'warning'} className="text-[9px] font-bold mt-1">
                                        {merchant.user.status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {merchant.user.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail size={14} className="text-muted-foreground/50" />
                                        <span className="truncate">{merchant.user.email}</span>
                                    </div>
                                )}
                                {merchant.user.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone size={14} className="text-muted-foreground/50" />
                                        <span>{merchant.user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar size={14} className="text-muted-foreground/50" />
                                    <span>Joined {new Date(merchant.user.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <Link href={`/users/${merchant.user.id}`} className="block pt-2">
                                <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-2">
                                    <ExternalLink size={12} />
                                    View User Profile
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Business Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Business Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { label: 'Services', value: merchant._count.merchantServices, icon: Settings },
                                { label: 'Agents', value: merchant._count.agents, icon: Users },
                                { label: 'Promotions', value: merchant._count.promos, icon: Store },
                                { label: 'Rating', value: `${merchant.rating} / 5 (${merchant.totalReviews} reviews)`, icon: Shield },
                                { label: 'Service Radius', value: `${merchant.serviceRadius} km`, icon: MapPin },
                            ].map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <stat.icon size={14} />
                                        {stat.label}
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{stat.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Subscription */}
                    {merchant.subscription && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Subscription</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs font-bold uppercase">
                                        {merchant.subscription.tier}
                                    </Badge>
                                    <Badge variant={merchant.subscription.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[9px]">
                                        {merchant.subscription.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Business Details + Documents */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Business Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Details</CardTitle>
                            <CardDescription>Business identity and contact information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'Business Name', value: merchant.businessName, icon: Building2 },
                                    { label: 'Category', value: merchant.businessCategory || 'Not set', icon: Store },
                                    { label: 'Phone', value: merchant.phone || 'Not provided', icon: Phone },
                                    { label: 'Location', value: [merchant.city, merchant.state].filter(Boolean).join(', ') || 'Not set', icon: MapPin },
                                    { label: 'PAN Number', value: merchant.panNumber || 'Not provided', icon: CreditCard },
                                    { label: 'GST Number', value: merchant.gstNumber || 'Not provided', icon: FileText },
                                ].map((field) => (
                                    <div key={field.label} className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <field.icon size={11} />
                                            {field.label}
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">{field.value}</p>
                                    </div>
                                ))}
                            </div>

                            {merchant.description && (
                                <div className="mt-6 pt-4 border-t border-border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{merchant.description}</p>
                                </div>
                            )}

                            {/* Bank Details */}
                            {(merchant.bankAccountName || merchant.bankAccountNumber) && (
                                <div className="mt-6 pt-4 border-t border-border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Bank Details</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground">Account Name</p>
                                            <p className="text-sm font-semibold text-foreground">{merchant.bankAccountName || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground">Account Number</p>
                                            <p className="text-sm font-semibold text-foreground font-mono">{merchant.bankAccountNumber || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground">IFSC Code</p>
                                            <p className="text-sm font-semibold text-foreground font-mono">{merchant.bankIfscCode || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Verification Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Verification Documents</CardTitle>
                            <CardDescription>
                                {merchant.verificationDocs.length} documents submitted for KYC review
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {merchant.verificationDocs.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                    <FileText size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground">No documents submitted yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {merchant.verificationDocs.map((doc) => {
                                        const docBadge = getVerificationBadge(doc.status);
                                        return (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-primary/20 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                                                        <FileText size={18} className="text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">
                                                            {DOC_TYPE_LABELS[doc.type] || doc.type}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                                        </p>
                                                        {doc.reviewNote && (
                                                            <p className="text-[10px] text-amber-600 mt-1 font-medium">
                                                                Note: {doc.reviewNote}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Badge variant={docBadge.variant} className="text-[9px] font-bold uppercase">
                                                        {docBadge.label}
                                                    </Badge>

                                                    {doc.fileUrl && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                const url = getImageUrl(doc.fileUrl);
                                                                if (url) window.open(url, '_blank');
                                                            }}
                                                        >
                                                            <Eye size={14} />
                                                        </Button>
                                                    )}

                                                    {doc.status === 'PENDING_REVIEW' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-destructive/20 text-destructive hover:bg-destructive/5"
                                                                onClick={() => setConfirmAction({ type: 'reject', target: 'doc', docId: doc.id })}
                                                            >
                                                                <X size={14} />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                onClick={() => setConfirmAction({ type: 'approve', target: 'doc', docId: doc.id })}
                                                            >
                                                                <Check size={14} />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={!!confirmAction}
                onClose={() => { setConfirmAction(null); setReviewNote(''); }}
                onConfirm={handleVerificationAction}
                title={
                    confirmAction?.type === 'approve'
                        ? `Approve ${confirmAction.target === 'doc' ? 'Document' : 'Merchant KYC'}`
                        : `Reject ${confirmAction?.target === 'doc' ? 'Document' : 'Merchant KYC'}`
                }
                description={
                    confirmAction?.type === 'approve'
                        ? confirmAction.target === 'doc'
                            ? 'This will mark the document as verified and approved.'
                            : 'This will approve the merchant\'s KYC application and activate their account.'
                        : confirmAction?.target === 'doc'
                            ? 'The merchant will need to re-upload this document.'
                            : 'The merchant\'s application will be rejected. They can re-apply with updated documents.'
                }
                confirmLabel={confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
                variant={confirmAction?.type === 'approve' ? 'default' : 'danger'}
                isLoading={actionLoading}
                showReasonInput={confirmAction?.type === 'reject'}
                reasonLabel="Rejection Reason"
                onReasonChange={setReviewNote}
            />
        </div>
    );
}
