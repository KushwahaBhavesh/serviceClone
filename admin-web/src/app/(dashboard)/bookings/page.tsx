'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, MapPin, CalendarDays } from 'lucide-react';

const mockBookings = [
  { id: 'BKG-001', service: 'Deep Home Cleaning', customer: 'John Doe', merchant: 'Elite Cleaners', date: '2025-03-20', status: 'IN_PROGRESS', amount: 2499 },
  { id: 'BKG-002', service: 'AC Repair', customer: 'Sarah Smith', merchant: 'CoolPro HVAC', date: '2025-03-19', status: 'COMPLETED', amount: 899 },
  { id: 'BKG-003', service: 'Plumbing Inspection', customer: 'Mike Johnson', merchant: 'QuickFix Plumbers', date: '2025-03-22', status: 'PENDING', amount: 499 },
];

export default function BookingsPage() {
  const [search, setSearch] = useState('');

  const filtered = mockBookings.filter(b => 
    b.id.toLowerCase().includes(search.toLowerCase()) || 
    b.merchant.toLowerCase().includes(search.toLowerCase()) ||
    b.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Global Bookings</h1>
        <p className="text-[#64748b]">Monitor all platform jobs and their current statuses.</p>
      </div>

      <Card className="border-[#e2e8f0]">
        <CardHeader className="pb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <Input 
              placeholder="Search by ID, customer, or merchant..." 
              className="pl-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Customer / Merchant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs font-semibold text-[#64748b]">{booking.id}</TableCell>
                  <TableCell className="font-medium text-[#0f172a]">{booking.service}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#0f172a]">{booking.customer}</span>
                      <span className="text-xs text-[#64748b]">via {booking.merchant}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#64748b] whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarDays size={14} className="mr-1.5" />
                      {new Date(booking.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">₹{booking.amount}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      booking.status === 'COMPLETED' ? 'bg-[#ecfdf5] text-[#059669]' :
                      booking.status === 'IN_PROGRESS' ? 'bg-[#eff6ff] text-[#2563eb]' :
                      'bg-[#fef3c7] text-[#d97706]'
                    }`}>
                      {booking.status.replace('_', ' ')}
                    </span>
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
