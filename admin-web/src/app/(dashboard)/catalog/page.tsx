'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Tag, Loader2, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { services: number };
  children: Array<{ id: string; name: string; slug: string }>;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  unit: string;
  duration: number;
  isActive: boolean;
  category: { id: string; name: string };
  _count: { merchantServices: number };
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loadingCat, setLoadingCat] = useState(true);
  const [loadingSvc, setLoadingSvc] = useState(false);

  // Add category form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  // Add service form
  const [showAddService, setShowAddService] = useState(false);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [addingSvc, setAddingSvc] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoadingCat(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
      // Auto-select first category
      if (res.data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCat(false);
    }
  }, []);

  const fetchServices = useCallback(async (categoryId: string) => {
    setLoadingSvc(true);
    try {
      const res = await api.get('/admin/services', { params: { categoryId } });
      setServices(res.data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoadingSvc(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchServices(selectedCategoryId);
    }
  }, [selectedCategoryId, fetchServices]);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const slug = newCatName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await api.post('/admin/categories', { name: newCatName.trim(), slug });
      setNewCatName('');
      setShowAddCategory(false);
      await fetchCategories();
    } catch (err: any) {
      console.error('Failed to add category:', err);
      alert(err.response?.data?.message || 'Failed to add category');
    } finally {
      setAddingCat(false);
    }
  };

  const handleAddService = async () => {
    if (!newSvcName.trim() || !newSvcPrice || !selectedCategoryId) return;
    setAddingSvc(true);
    try {
      const slug = newSvcName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await api.post('/admin/services', {
        name: newSvcName.trim(),
        slug,
        basePrice: Number(newSvcPrice),
        categoryId: selectedCategoryId,
      });
      setNewSvcName('');
      setNewSvcPrice('');
      setShowAddService(false);
      await fetchServices(selectedCategoryId);
      await fetchCategories(); // refresh counts
    } catch (err: any) {
      console.error('Failed to add service:', err);
      alert(err.response?.data?.message || 'Failed to add service');
    } finally {
      setAddingSvc(false);
    }
  };

  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name || 'Select a category';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Global Service Catalog</h1>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Platform Core Definitions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowAddCategory(true)} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-5">
            <Plus size={14} className="mr-2" /> Add Category
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddService(true)} disabled={!selectedCategoryId} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-5">
            <Plus size={14} className="mr-2" /> Add Service
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Column */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-[#0f172a]">Categories</h3>

          {loadingCat ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#64748b]" />
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={cn(
                    "cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 flex justify-between items-center group",
                    selectedCategoryId === c.id
                      ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-200"
                      : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center">
                    <Layers size={18} className={cn(
                      "mr-3 transition-transform duration-200 group-hover:scale-110",
                      selectedCategoryId === c.id ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                    )} />
                    <div>
                      <span className="font-bold text-sm tracking-tight">{c.name}</span>
                      {!c.isActive && <span className="ml-2 text-[10px] font-black uppercase tracking-widest opacity-60">(Inactive)</span>}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                    selectedCategoryId === c.id ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-100 text-slate-500"
                  )}>
                    {c._count.services}
                  </span>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-[#94a3b8] text-center py-4">No categories yet</p>
              )}
            </div>
          )}

          {/* Add Category Form */}
          {showAddCategory && (
            <div className="p-3 border border-[#e2e8f0] rounded-md bg-white space-y-2">
              <Input
                placeholder="Category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-9"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}>
                  {addingCat ? <Loader2 size={14} className="animate-spin mr-1" /> : <Check size={14} className="mr-1" />}
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowAddCategory(false); setNewCatName(''); }}>
                  <X size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Services Column */}
        <div className="lg:col-span-2">
          <Card className="border-[#e2e8f0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Services in: {selectedCategoryName}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSvc ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#64748b]" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Merchants</TableHead>
                        <TableHead>Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-20 text-[#94a3b8]">
                            No services in this category
                          </TableCell>
                        </TableRow>
                      )}
                      {services.map((svc) => (
                        <TableRow key={svc.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="bg-[#f1f5f9] p-1.5 rounded mr-3">
                                <Tag size={14} className="text-[#64748b]" />
                              </div>
                              <div>
                                <p className="text-[#0f172a]">{svc.name}</p>
                                {svc.description && (
                                  <p className="text-xs text-[#94a3b8] truncate max-w-[200px]">{svc.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-[#0f172a] font-medium">₹{svc.basePrice.toLocaleString()}</TableCell>
                          <TableCell className="text-[#64748b]">{svc.duration} min</TableCell>
                          <TableCell className="text-[#64748b]">{svc._count.merchantServices}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                              svc.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                            )}>
                              {svc.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Add Service Form */}
                  {showAddService && selectedCategoryId && (
                    <div className="mt-4 p-4 border border-[#e2e8f0] rounded-md bg-[#fafafa] space-y-3">
                      <p className="font-medium text-sm text-[#0f172a]">Add Service to "{selectedCategoryName}"</p>
                      <div className="flex gap-3">
                        <Input
                          placeholder="Service name..."
                          value={newSvcName}
                          onChange={(e) => setNewSvcName(e.target.value)}
                          className="h-9 flex-1"
                        />
                        <Input
                          placeholder="Base price (₹)"
                          type="number"
                          value={newSvcPrice}
                          onChange={(e) => setNewSvcPrice(e.target.value)}
                          className="h-9 w-32"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddService} disabled={addingSvc || !newSvcName.trim() || !newSvcPrice}>
                          {addingSvc ? <Loader2 size={14} className="animate-spin mr-1" /> : <Check size={14} className="mr-1" />}
                          Add Service
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setShowAddService(false); setNewSvcName(''); setNewSvcPrice(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
