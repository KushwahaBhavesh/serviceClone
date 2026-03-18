'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Tag } from 'lucide-react';

const mockCatalog = [
  { id: 'cat_1', name: 'Cleaning Services', type: 'CATEGORY', parentId: null, count: 12 },
  { id: 'svc_1', name: 'Deep Home Cleaning', type: 'SERVICE', parentId: 'cat_1', basePrice: 2499 },
  { id: 'svc_2', name: 'Bathroom Cleaning', type: 'SERVICE', parentId: 'cat_1', basePrice: 899 },
  { id: 'cat_2', name: 'Appliance Repair', type: 'CATEGORY', parentId: null, count: 8 },
  { id: 'svc_3', name: 'AC Service & Repair', type: 'SERVICE', parentId: 'cat_2', basePrice: 599 },
];

export default function CatalogPage() {
  const categories = mockCatalog.filter(c => c.type === 'CATEGORY');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Global Service Catalog</h1>
          <p className="text-[#64748b]">Manage platform service categories and standardized pricing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Add Category</Button>
          <Button size="sm">
            <Plus size={16} className="mr-1" /> Add Service
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border-r border-[#e2e8f0] pr-6 space-y-4">
          <h3 className="font-semibold text-[#0f172a]">Categories</h3>
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.id} className="cursor-pointer p-3 rounded-md bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#0ea5e9] transition-colors flex justify-between items-center group">
                <div className="flex items-center">
                  <Layers size={16} className="text-[#64748b] mr-2 group-hover:text-[#0ea5e9]" />
                  <span className="font-medium text-[#0f172a]">{c.name}</span>
                </div>
                <span className="text-xs bg-white px-2 py-0.5 rounded border border-[#e2e8f0] text-[#64748b]">
                  {c.count} svcs
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg">Services in Category</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="border border-[#e2e8f0] rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCatalog.filter(c => c.type === 'SERVICE').map((svc) => (
                      <TableRow key={svc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="bg-[#f1f5f9] p-1.5 rounded mr-3">
                              <Tag size={14} className="text-[#64748b]" />
                            </div>
                            {svc.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-[#64748b]">₹{svc.basePrice?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-[#0ea5e9]">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
