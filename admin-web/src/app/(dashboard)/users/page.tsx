'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Shield, Loader2, ChevronLeft, ChevronRight, Trash2, Edit2, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

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

const ROLES = ['ALL', 'CUSTOMER', 'MERCHANT', 'AGENT', 'ADMIN'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setUpdatingId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user. They might have active dependencies.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">User Management</h1>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Platform Account Control</p>
        </div>
        <div className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
          {pagination.total} total accounts
        </div>
      </div>

      <Card className="border-[#e2e8f0]">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <Input
                placeholder="Search by name, email, phone..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 p-1 bg-slate-50 border border-slate-100 rounded-2xl">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200",
                    roleFilter === role
                      ? "bg-[#FF6B00] text-white shadow-lg shadow-orange-100/50"
                      : "text-slate-400 hover:text-[#FF6B00] hover:bg-white"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
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
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-[#64748b]">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-sm font-semibold text-[#0f172a]">
                            {user.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-[#0f172a]">{user.name || 'Unnamed'}</span>
                            <span className="text-xs text-[#64748b]">{user.email || user.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {editingRoleId === user.id ? (
                            <div className="flex items-center gap-1">
                              <select
                                className="text-[10px] font-bold border rounded p-1 bg-white outline-none"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                              >
                                {ROLES.filter(r => r !== 'ALL').map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <button onClick={() => handleRoleUpdate(user.id)} className="p-1 text-[#059669] hover:bg-emerald-50 rounded">
                                <Check size={12} />
                              </button>
                              <button onClick={() => setEditingRoleId(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center group/role relative h-8 px-2 -ml-2 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => { setEditingRoleId(user.id); setSelectedRole(user.role); }}>
                              {user.role === 'ADMIN' && <Shield size={12} className="mr-1 text-[#FF6B00]" />}
                              <span className="text-[11px] font-bold tracking-wider text-slate-700">{user.role}</span>
                              <Edit2 size={10} className="ml-2 text-slate-300 opacity-0 group-hover/role:opacity-100" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest",
                          user.status === 'ACTIVE' && 'bg-emerald-50 text-emerald-600 border border-emerald-100',
                          user.status === 'SUSPENDED' && 'bg-rose-50 text-rose-600 border border-rose-100',
                          user.status === 'DEACTIVATED' && 'bg-slate-50 text-slate-400 border border-slate-100',
                          (user.status === 'PENDING_VERIFICATION' || user.status === 'ONBOARDING') && 'bg-amber-50 text-amber-600 border border-amber-100',
                        )}>
                          {user.status.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#64748b]">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {user.status !== 'ACTIVE' && (
                          <Button
                            variant="ghost" size="sm"
                            className="text-[#059669] text-[10px] font-black uppercase tracking-widest h-8"
                            disabled={updatingId === user.id}
                            onClick={() => handleStatusUpdate(user.id, 'ACTIVE')}
                          >
                            Activate
                          </Button>
                        )}
                        {user.status !== 'SUSPENDED' && user.role !== 'ADMIN' && (
                          <Button
                            variant="ghost" size="sm"
                            className="text-amber-600 text-[10px] font-black uppercase tracking-widest h-8"
                            disabled={updatingId === user.id}
                            onClick={() => handleStatusUpdate(user.id, 'SUSPENDED')}
                          >
                            Suspend
                          </Button>
                        )}
                        {user.role !== 'ADMIN' && (
                          <Button
                            variant="ghost" size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg p-2 h-8 w-8"
                            disabled={updatingId === user.id}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f1f5f9]">
                  <p className="text-xs text-[#64748b]">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} results)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchUsers(pagination.page - 1)}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchUsers(pagination.page + 1)}
                    >
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
