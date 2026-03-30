'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Shield, Loader2, ChevronLeft, ChevronRight, Trash2, Edit2, Check, X, Users, UserPlus, Zap, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  { id: 'ALL', label: 'All Identities' },
  { id: 'CUSTOMER', label: 'Customers' },
  { id: 'MERCHANT', label: 'Merchants' },
  { id: 'AGENT', label: 'Agents' },
  { id: 'ADMIN', label: 'System Admins' },
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
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <Users size={14} className="text-primary fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Global user management</h1>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center space-x-3 w-72 group focus-within:border-primary/50 transition-all">
              <Search size={16} className="text-slate-500 group-focus-within:text-primary" />
              <input 
                type="text" 
                placeholder="Search profiles..." 
                className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 placeholder:text-slate-600" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <Button className="h-11">
              <UserPlus size={16} className="mr-2" />
              New Entry
           </Button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
        <div className="flex gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setRoleFilter(role.id)}
              className={cn(
                "px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                roleFilter === role.id
                  ? "bg-primary text-white shadow-electric"
                  : "text-slate-500 hover:text-white hover:bg-slate-900"
              )}
            >
              {role.label}
            </button>
          ))}
        </div>
        
        <div className="ml-auto flex items-center gap-6 px-4">
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Index Size: {pagination.total}</span>
           </div>
           <Button variant="ghost" size="sm" className="h-10">
              <Filter size={14} className="mr-2" />
              Filter Matrix
           </Button>
        </div>
      </div>

      {/* Main Content Table */}
      <Card className="border-slate-900 overflow-hidden bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">Entity Identity</TableHead>
              <TableHead>Authorization Role</TableHead>
              <TableHead>Operational Status</TableHead>
              <TableHead>Registration Timestamp</TableHead>
              <TableHead className="text-right">Action Vectors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Decrypting identity matrix...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
                    <Users size={40} className="text-slate-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No matching profiles detected</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center group-hover:border-primary/50 transition-all font-black text-primary text-xl">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-black text-white tracking-tight">{user.name || 'Unnamed Identity'}</p>
                           {user.role === 'ADMIN' && <Zap size={10} className="text-primary fill-primary" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-slate-400">{user.email || user.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {editingRoleId === user.id ? (
                        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                          <select
                            className="text-[10px] font-black uppercase tracking-widest bg-slate-950 border-none text-white focus:ring-0 py-1"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                          >
                            {ROLES.filter(r => r.id !== 'ALL').map(r => (
                              <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                          </select>
                          <button onClick={() => handleRoleUpdate(user.id)} className="h-8 w-8 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all flex items-center justify-center">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingRoleId(null)} className="h-8 w-8 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-all flex items-center justify-center">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-primary/50 transition-all group/role"
                          onClick={() => { setEditingRoleId(user.id); setSelectedRole(user.role); }}
                        >
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{user.role}</span>
                          <Edit2 size={10} className="text-slate-600 group-hover/role:text-primary transition-colors" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border",
                      user.status === 'ACTIVE' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      user.status === 'SUSPENDED' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      user.status === 'DEACTIVATED' && "bg-slate-900 text-slate-700 border-slate-800",
                      (user.status === 'PENDING_VERIFICATION' || user.status === 'ONBOARDING') && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    )}>
                      {user.status.replace(/_/g, ' ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <p className="text-xs font-bold text-white tracking-tight">{new Date(user.createdAt).toLocaleDateString()}</p>
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">System Registered</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                       {user.status !== 'ACTIVE' && (
                          <Button
                            variant="outline" size="sm"
                            className="h-10 min-w-[100px] border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                            disabled={updatingId === user.id}
                            onClick={() => handleStatusUpdate(user.id, 'ACTIVE')}
                          >
                            Reactivate
                          </Button>
                        )}
                        {user.status !== 'SUSPENDED' && user.role !== 'ADMIN' && (
                          <Button
                            variant="outline" size="sm"
                            className="h-10 min-w-[100px] border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white hover:border-amber-500"
                            disabled={updatingId === user.id}
                            onClick={() => handleStatusUpdate(user.id, 'SUSPENDED')}
                          >
                            Suspend
                          </Button>
                        )}
                        {user.role !== 'ADMIN' && (
                          <Button
                            variant="outline" size="sm"
                            className="h-10 w-10 p-0 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500"
                            disabled={updatingId === user.id}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
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
              Matrix Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 px-3" disabled={pagination.page <= 1} onClick={() => fetchUsers(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" className="h-10 px-3" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchUsers(pagination.page + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
