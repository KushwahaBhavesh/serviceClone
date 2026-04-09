'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog } from '@/components/ui/alert-dialog';
import {
    ArrowLeft, Mail, Phone, Calendar, Shield,
    Loader2, Edit2, Check, Trash2, ExternalLink, BookOpen, Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UserDetail {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    createdAt: string;
    avatarUrl: string | null;
    onboardingCompleted: boolean;
    merchantProfile: {
        id: string;
        businessName: string;
        verificationStatus: string;
    } | null;
    _count: { bookings: number };
}

const ROLES = ['CUSTOMER', 'MERCHANT', 'AGENT', 'ADMIN'];
const STATUSES = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'PENDING_VERIFICATION'];

const getStatusBadge = (s: string) => {
    if (s === 'ACTIVE') return 'success' as const;
    if (s === 'SUSPENDED') return 'destructive' as const;
    if (s === 'DEACTIVATED') return 'secondary' as const;
    return 'warning' as const;
};

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingRole, setEditingRole] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [updatingRole, setUpdatingRole] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        api.get(`/admin/users/${userId}`)
            .then(res => setUser(res.data))
            .catch((err: any) => setError(err.response?.data?.message || 'Failed to load user'))
            .finally(() => setLoading(false));
    }, [userId]);

    const handleRoleUpdate = async () => {
        if (!user || !selectedRole) return;
        setUpdatingRole(true);
        try {
            await api.put(`/admin/users/${userId}`, { role: selectedRole });
            setUser(prev => prev ? { ...prev, role: selectedRole } : null);
            setEditingRole(false);
        } catch (err) { console.error(err); }
        finally { setUpdatingRole(false); }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!user) return;
        setUpdatingStatus(true);
        try {
            await api.put(`/admin/users/${userId}/status`, { status: newStatus });
            setUser(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (err) { console.error(err); }
        finally { setUpdatingStatus(false); }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try { await api.delete(`/admin/users/${userId}`); router.push('/users'); }
        catch (err) { console.error(err); }
        finally { setIsDeleting(false); }
    };

    if (loading) return (
        <div className="pb-10"><Breadcrumbs /><Skeleton className="h-8 w-48 rounded-lg mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl lg:col-span-2" />
            </div></div>
    );

    if (error || !user) return (
        <div className="pb-10"><Breadcrumbs />
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-destructive text-white flex items-center justify-center font-bold">!</div>
                <div><p className="font-bold text-sm">Error</p><p className="text-xs opacity-90">{error || 'User not found'}</p></div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => router.push('/users')}>Back</Button>
            </div></div>
    );

    return (
        <div className="pb-10">
            <Breadcrumbs />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/users')}><ArrowLeft size={16} /></Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">{user.name || 'Unnamed User'}</h1>
                            <Badge variant={getStatusBadge(user.status)} className="text-[10px] font-bold uppercase tracking-wider">{user.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">User ID: {user.id}</p>
                    </div>
                </div>
                {user.role !== 'ADMIN' && (
                    <Button variant="outline" className="h-10 gap-2 border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => setDeleteOpen(true)}>
                        <Trash2 size={14} />Delete User
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card><CardHeader><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20">{user.name?.charAt(0) || '?'}</div>
                                <div><p className="text-base font-bold text-foreground">{user.name || 'Anonymous'}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Onboarding {user.onboardingCompleted ? 'Complete' : 'Incomplete'}</p></div>
                            </div>
                            <div className="space-y-3 pt-2">
                                {user.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail size={14} className="text-muted-foreground/50" /><span className="truncate">{user.email}</span></div>}
                                {user.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone size={14} className="text-muted-foreground/50" /><span>{user.phone}</span></div>}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar size={14} className="text-muted-foreground/50" /><span>Joined {new Date(user.createdAt).toLocaleDateString()}</span></div>
                            </div>
                        </CardContent></Card>

                    <Card><CardHeader><CardTitle className="text-sm">Stats</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-border"><div className="flex items-center gap-2 text-xs text-muted-foreground"><BookOpen size={14} />Bookings</div><span className="text-sm font-bold text-foreground">{user._count.bookings}</span></div>
                            <div className="flex items-center justify-between py-2 border-b border-border"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Shield size={14} />Role</div><Badge variant="outline" className="text-[10px] uppercase font-bold">{user.role}</Badge></div>
                            {user.merchantProfile && <div className="flex items-center justify-between py-2"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Store size={14} />Merchant</div>
                                <Link href={`/merchants/${user.merchantProfile.id}`}><Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><ExternalLink size={10} />View</Button></Link></div>}
                        </CardContent></Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card><CardHeader><CardTitle>Role Management</CardTitle><CardDescription>Change role</CardDescription></CardHeader>
                        <CardContent>{editingRole ? (
                            <div className="flex items-center gap-4">
                                <select className="flex-1 h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm font-semibold" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
                                <Button size="sm" className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={updatingRole || selectedRole === user.role} onClick={handleRoleUpdate}>
                                    {updatingRole ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Save</Button>
                                <Button variant="outline" size="sm" className="h-10" onClick={() => setEditingRole(false)}>Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3"><div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center"><Shield size={18} className="text-muted-foreground" /></div>
                                    <div><p className="text-sm font-bold">{user.role}</p><p className="text-[10px] text-muted-foreground">Current role</p></div></div>
                                <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => { setEditingRole(true); setSelectedRole(user.role); }} disabled={user.role === 'ADMIN'}><Edit2 size={12} />Change</Button>
                            </div>
                        )}</CardContent></Card>

                    <Card><CardHeader><CardTitle>Account Status</CardTitle><CardDescription>Manage access state</CardDescription></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {STATUSES.map(status => (
                                    <Button key={status} variant={user.status === status ? 'default' : 'outline'} className={cn('h-12 text-xs font-bold uppercase tracking-wider', user.status === status && 'pointer-events-none')} disabled={updatingStatus || user.role === 'ADMIN'} onClick={() => handleStatusUpdate(status)}>
                                        {updatingStatus ? <Loader2 size={14} className="animate-spin mr-2" /> : null}{status.replace(/_/g, ' ')}
                                    </Button>))}
                            </div>
                        </CardContent></Card>

                    {user.merchantProfile && (
                        <Card className="border-amber-200 bg-amber-50/30"><CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600"><Store size={24} /></div>
                                    <div><p className="text-sm font-bold">{user.merchantProfile.businessName}</p>
                                        <Badge variant={user.merchantProfile.verificationStatus === 'APPROVED' ? 'success' : user.merchantProfile.verificationStatus === 'REJECTED' ? 'destructive' : 'warning'} className="text-[9px] font-bold mt-1">{user.merchantProfile.verificationStatus.replace(/_/g, ' ')}</Badge></div></div>
                                <Link href={`/merchants/${user.merchantProfile.id}`}><Button size="sm" className="h-9 gap-2"><ExternalLink size={12} />View Merchant</Button></Link>
                            </div></CardContent></Card>)}
                </div>
            </div>

            <AlertDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
                title="Delete User Account" description="This will permanently remove their account and all data. Cannot be undone."
                confirmLabel="Permanent Delete" isLoading={isDeleting} variant="danger" />
        </div>
    );
}
