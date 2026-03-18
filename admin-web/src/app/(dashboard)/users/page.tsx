'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MoreVertical, Shield } from 'lucide-react';

const mockUsers = [
  { id: 'usr_1', name: 'John Doe', email: 'john@example.com', role: 'CUSTOMER', joined: '2025-01-15', status: 'ACTIVE' },
  { id: 'usr_2', name: 'Elite Cleaners', email: 'info@elite.com', role: 'MERCHANT', joined: '2025-02-21', status: 'ACTIVE' },
  { id: 'usr_3', name: 'Admin Master', email: 'admin@ondemand.com', role: 'ADMIN', joined: '2024-11-05', status: 'ACTIVE' },
  { id: 'usr_4', name: 'Sarah Smith', email: 'sarah.s@example.com', role: 'CUSTOMER', joined: '2025-03-01', status: 'SUSPENDED' },
];

export default function UsersPage() {
  const [search, setSearch] = useState('');

  const filtered = mockUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">User Management</h1>
          <p className="text-[#64748b]">View and manage all registered accounts across roles.</p>
        </div>
        <Button size="sm">Add User</Button>
      </div>

      <Card className="border-[#e2e8f0]">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#0f172a]">{user.name}</span>
                      <span className="text-xs text-[#64748b]">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {user.role === 'ADMIN' && <Shield size={12} className="mr-1 text-[#0ea5e9]" />}
                      <span className="text-xs font-semibold tracking-wider text-[#475569]">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      user.status === 'ACTIVE' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'
                    }`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#64748b]">{new Date(user.joined).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#64748b]"><MoreVertical size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
