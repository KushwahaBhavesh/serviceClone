'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, Loader2, ChevronLeft, ChevronRight, Trash2, Edit2, Check, X, Users, UserPlus, Zap, Filter, MoreVertical, Mail, Phone, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 as Spinner } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  avatarUrl: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLES = [
  { id: 'ALL', label: 'All Users' },
  { id: 'CUSTOMER', label: 'Customers' },
  { id: 'MERCHANT', label: 'Merchants' },
  { id: 'AGENT', label: 'Agents' },
  { id: 'ADMIN', label: 'Admins' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  // Alert Dialog State
  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    setUpdatingId(userId);
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error('Failed to update user status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleUpdate = async (userId: string) => {
    setUpdatingId(userId);
    try {
      await api.put(`/admin/users/${userId}`, { role: selectedRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: selectedRole } : u));
      setEditingRoleId(null);
    } catch (err) {
      console.error('Failed to update user role:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setPendingDeleteId(userId);
    setAlertOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/users/${pendingDeleteId}`);
      setUsers(prev => prev.filter(u => u.id !== pendingDeleteId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      setAlertOpen(false);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="pb-10">
      <Breadcrumbs />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform users, roles, and access permissions.</p>
        </div>

        <Button size="sm" className="h-10 gap-2 shadow-lg shadow-primary/20">
          <UserPlus size={16} />
          <span>Add New User</span>
        </Button>
      </div>

      {/* Filter & Search Strip */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search by name, email or phone..."
              className="pl-10 h-10 bg-muted/50 border-transparent focus:bg-background transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg w-full md:w-auto overflow-x-auto">
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setRoleFilter(role.id)}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                  roleFilter === role.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {role.label}
              </button>
            ))}
          </div>

          <div className="ml-auto hidden md:flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent h-7">
              {pagination.total} Total Records
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[300px]">User Profile</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-20 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-32 rounded-lg" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-12 w-24 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12">
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    description="No user records match your current filter or search criteria. Try adjusting your filters."
                    action={{
                      label: "Clear Search",
                      onClick: () => setSearch('')
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="group hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center font-bold text-primary border border-border group-hover:border-primary/30 transition-all">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-foreground truncate">{user.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail size={10} /> {user.email || 'No email'}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="flex items-center gap-1"><Phone size={10} /> {user.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingRoleId === user.id ? (
                      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
                        <select
                          className="text-xs font-semibold bg-transparent border-none text-foreground focus:ring-0 py-0.5"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                        >
                          {ROLES.filter(r => r.id !== 'ALL').map(r => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                        <button onClick={() => handleRoleUpdate(user.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-all">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingRoleId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded transition-all">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-transparent cursor-pointer hover:border-primary/30 hover:bg-background transition-all group/role"
                        onClick={() => { setEditingRoleId(user.id); setSelectedRole(user.role); }}
                      >
                        <span className="text-[10px] font-bold text-foreground/80 uppercase">{user.role}</span>
                        <Edit2 size={10} className="text-muted-foreground group-hover/role:text-primary transition-colors opacity-0 group-hover/role:opacity-100" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      user.status === 'ACTIVE' ? 'success' :
                        user.status === 'SUSPENDED' ? 'destructive' :
                          'warning'
                    } className="text-[10px] font-bold border-transparent">
                      {user.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status !== 'ACTIVE' && (
                        <Button
                          variant="outline" size="sm"
                          className="h-8 text-[10px] border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
                          disabled={updatingId === user.id}
                          onClick={() => handleStatusUpdate(user.id, 'ACTIVE')}
                        >
                          Reactivate
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        disabled={updatingId === user.id || user.role === 'ADMIN'}
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                      >
                        <MoreVertical size={14} />
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
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page <= 1} onClick={() => fetchUsers(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchUsers(pagination.page + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User Account"
        description="Are you sure you want to delete this user? This will permanently remove their account and all associated data. This action cannot be undone."
        confirmLabel="Permanent Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
