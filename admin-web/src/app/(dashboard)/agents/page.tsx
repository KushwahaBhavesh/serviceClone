'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Star,
    Check,
    X,
    Filter,
    ShieldAlert,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    ExternalLink,
    ClipboardCheck,
    Ban
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface Agent {
    id: string;
    name: string;
    email: string;
    phone: string;
    serviceType: string;
    rating: number;
    completedJobs: number;
    kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED';
    status: 'ONLINE' | 'OFFLINE' | 'SUSPENDED';
    location: string;
    joinedAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const AGENT_STATUSES = [
    { id: 'ALL', label: 'All Status' },
    { id: 'ONLINE', label: 'Online' },
    { id: 'OFFLINE', label: 'Offline' },
    { id: 'SUSPENDED', label: 'Suspended' },
];

const KYC_STATUS_COLORS = {
    VERIFIED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    PENDING: "bg-amber-50 text-amber-600 border-amber-100",
    REJECTED: "bg-rose-50 text-rose-600 border-rose-100",
    NOT_STARTED: "bg-slate-50 text-slate-400 border-slate-100",
};

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Alert Dialog State
    const [alertOpen, setAlertOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ id: string, action: 'delete' | 'suspend' | 'approve' } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Mock fetching agents (until API is ready)
    const fetchAgents = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            // simulate API call
            setTimeout(() => {
                const mockAgents: Agent[] = [
                    {
                        id: '1',
                        name: 'Rajesh Kumar',
                        email: 'rajesh.k@example.com',
                        phone: '+91 98765 43210',
                        serviceType: 'Electrician',
                        rating: 4.8,
                        completedJobs: 156,
                        kycStatus: 'VERIFIED',
                        status: 'ONLINE',
                        location: 'South Delhi',
                        joinedAt: '2023-11-15'
                    },
                    {
                        id: '2',
                        name: 'Sunita Sharma',
                        email: 'sunita.s@example.com',
                        phone: '+91 98765 54321',
                        serviceType: 'Home Cleaning',
                        rating: 4.5,
                        completedJobs: 89,
                        kycStatus: 'PENDING',
                        status: 'OFFLINE',
                        location: 'Indira Nagar, Bangalore',
                        joinedAt: '2024-01-20'
                    },
                    {
                        id: '3',
                        name: 'Amit Patel',
                        email: 'amit.p@example.com',
                        phone: '+91 98765 65432',
                        serviceType: 'Plumber',
                        rating: 3.9,
                        completedJobs: 42,
                        kycStatus: 'REJECTED',
                        status: 'SUSPENDED',
                        location: 'Andheri West, Mumbai',
                        joinedAt: '2023-09-05'
                    }
                ];

                setAgents(mockAgents.filter(a =>
                    (statusFilter === 'ALL' || a.status === statusFilter) &&
                    (a.name.toLowerCase().includes(search.toLowerCase()) || a.phone.includes(search))
                ));
                setPagination({ page: 1, limit: 10, total: 3, totalPages: 1 });
                setLoading(false);
            }, 800);
        } catch (err) {
            console.error('Failed to fetch agents:', err);
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => fetchAgents(), 300);
        return () => clearTimeout(timer);
    }, [fetchAgents]);

    const handleAction = (id: string, action: 'delete' | 'suspend' | 'approve') => {
        setPendingAction({ id, action });
        setAlertOpen(true);
    };

    const confirmAction = async () => {
        if (!pendingAction) return;
        setIsProcessing(true);

        // Simulate API logic
        setTimeout(() => {
            if (pendingAction.action === 'delete') {
                setAgents(prev => prev.filter(a => a.id !== pendingAction.id));
            } else if (pendingAction.action === 'suspend') {
                setAgents(prev => prev.map(a => a.id === pendingAction.id ? { ...a, status: 'SUSPENDED' } : a));
            } else if (pendingAction.action === 'approve') {
                setAgents(prev => prev.map(a => a.id === pendingAction.id ? { ...a, kycStatus: 'VERIFIED' } : a));
            }

            setIsProcessing(false);
            setAlertOpen(false);
            setPendingAction(null);
        }, 1000);
    };

    return (
        <div className="pb-10">
            <Breadcrumbs />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Service Agents</h1>
                    <p className="text-sm text-muted-foreground mt-1">Monitor provider performance, KYC verification, and availability.</p>
                </div>

                <Button size="sm" className="h-10 gap-2 shadow-lg shadow-primary/20">
                    <ShieldCheck size={16} />
                    <span>Agent Approvals</span>
                    <Badge className="ml-1 bg-white text-primary text-[10px] px-1.5 h-4 min-w-[1.25rem] flex items-center justify-center font-bold">5</Badge>
                </Button>
            </div>

            <Card className="mb-6 border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Search by agent name or phone..."
                            className="pl-10 h-10 bg-background border-border hover:border-primary/30 focus:border-primary transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg w-full md:w-auto">
                        {AGENT_STATUSES.map((status) => (
                            <button
                                key={status.id}
                                onClick={() => setStatusFilter(status.id)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                                    statusFilter === status.id
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-[300px]">Service Provider</TableHead>
                            <TableHead>Vertical</TableHead>
                            <TableHead>Performance</TableHead>
                            <TableHead>KYC Status</TableHead>
                            <TableHead>Availability</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-10 w-24 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-10 w-20 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-10 w-28 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-10 w-24 rounded-lg" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-10 w-12 ml-auto rounded-lg" /></TableCell>
                                </TableRow>
                            ))
                        ) : agents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12">
                                    <EmptyState
                                        icon={ShieldAlert}
                                        title="No agents match your criteria"
                                        description="We couldn't find any service providers that match your current search or filters."
                                        action={{
                                            label: "Clear All Filters",
                                            onClick: () => { setSearch(''); setStatusFilter('ALL'); }
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            agents.map((agent) => (
                                <TableRow key={agent.id} className="group hover:bg-muted/20 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-primary/5 rounded-lg flex items-center justify-center font-bold text-primary border border-primary/10">
                                                {agent.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{agent.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-medium">
                                                    <span className="flex items-center gap-1"><Phone size={10} /> {agent.phone}</span>
                                                    <span className="h-1 w-1 rounded-full bg-border" />
                                                    <span className="truncate max-w-[120px]">{agent.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={14} className="text-muted-foreground/50" />
                                            <span className="text-xs font-bold text-foreground">{agent.serviceType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-[10px] font-bold">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <span>{agent.rating}</span>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{agent.completedJobs} Jobs Done</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] font-bold border-transparent uppercase px-2 py-0.5",
                                            KYC_STATUS_COLORS[agent.kycStatus]
                                        )}>
                                            {agent.kycStatus.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                agent.status === 'ONLINE' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" :
                                                    agent.status === 'OFFLINE' ? "bg-slate-300" : "bg-rose-500"
                                            )} />
                                            <span className="text-xs font-bold text-foreground/80">{agent.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {agent.kycStatus === 'PENDING' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[10px] font-bold border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                    onClick={() => handleAction(agent.id, 'approve')}
                                                >
                                                    <ClipboardCheck size={14} className="mr-1" />
                                                    Approve
                                                </Button>
                                            )}

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-50"
                                                    onClick={() => handleAction(agent.id, 'suspend')}
                                                    disabled={agent.status === 'SUSPENDED'}
                                                >
                                                    <Ban size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-rose-50"
                                                    onClick={() => handleAction(agent.id, 'delete')}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                >
                                                    <ExternalLink size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {!loading && agents.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Reviewing Providers {pagination.page} / {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled>
                                <ChevronLeft size={16} />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled>
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Action Confirmation */}
            <AlertDialog
                isOpen={alertOpen}
                onClose={() => setAlertOpen(false)}
                onConfirm={confirmAction}
                title={
                    pendingAction?.action === 'delete' ? "Expel Service Agent" :
                        pendingAction?.action === 'suspend' ? "Suspend Provider Access" :
                            "Approve KYC Application"
                }
                description={
                    pendingAction?.action === 'delete' ? "Are you sure you want to remove this agent? This will terminate their contract and remove all associated service listings. This action is irreversible." :
                        pendingAction?.action === 'suspend' ? "Are you sure you want to suspend this agent? They will be unable to accept new bookings or go online until the suspension is lifted." :
                            "You are about to verify this provider's documents and background check. They will be authorized to start accepting customers on the platform."
                }
                confirmLabel={
                    pendingAction?.action === 'delete' ? "Confirm Expulsion" :
                        pendingAction?.action === 'suspend' ? "Confirm Suspension" :
                            "Verify & Approve"
                }
                isLoading={isProcessing}
                variant={pendingAction?.action === 'approve' ? 'info' : 'danger'}
            />
        </div>
    );
}
