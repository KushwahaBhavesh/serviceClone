'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Tag, Loader2, Check, X, Edit2, Trash2, Power } from 'lucide-react';
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

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
  const [editSvcData, setEditSvcData] = useState({ name: '', basePrice: '', duration: '', description: '' });

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

  const handleUpdateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      await api.put(`/admin/categories/${id}`, { name: editCatName.trim() });
      setEditingCatId(null);
      await fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      await fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleCategory = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/categories/${id}`, { isActive: !current });
      await fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleUpdateService = async (id: string) => {
    try {
      await api.put(`/admin/services/${id}`, {
        name: editSvcData.name.trim(),
        basePrice: Number(editSvcData.basePrice),
        duration: Number(editSvcData.duration),
        description: editSvcData.description,
      });
      setEditingSvcId(null);
      fetchServices(selectedCategoryId!);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      fetchServices(selectedCategoryId!);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleService = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/services/${id}`, { isActive: !current });
      fetchServices(selectedCategoryId!);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name || 'Select a category';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-[#1a1a1a]">Global Service Catalog</h1>
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
                    "cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 flex justify-between items-center group relative overflow-hidden",
                    selectedCategoryId === c.id
                      ? "border-[#FF6B00] bg-[#FF6B00] text-white shadow-xl shadow-orange-100/50"
                      : "border-slate-100 bg-white hover:border-[#FF6B00]/30 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Layers size={18} className={cn(
                      "flex-shrink-0 mr-3 transition-transform duration-200 group-hover:scale-110",
                      selectedCategoryId === c.id ? "text-white" : "text-slate-400 group-hover:text-[#FF6B00]"
                    )} />
                    <div className="flex-1 min-w-0">
                      {editingCatId === c.id ? (
                        <div className="flex items-center gap-1 -ml-1 pr-2" onClick={e => e.stopPropagation()}>
                          <Input
                            size={10}
                            className="h-8 py-0 px-2 text-xs text-slate-900"
                            value={editCatName}
                            autoFocus
                            onChange={e => setEditCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(c.id)}
                          />
                          <Button size="sm" className="h-7 w-7 p-0 rounded-lg min-h-0" onClick={() => handleUpdateCategory(c.id)}>
                            <Check size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg min-h-0" onClick={() => setEditingCatId(null)}>
                            <X size={12} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight truncate">{c.name}</span>
                          {!c.isActive && <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Inactive</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2" onClick={e => e.stopPropagation()}>
                    {selectedCategoryId === c.id && !editingCatId && (
                      <div className="flex items-center gap-1 absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingCatId(c.id); setEditCatName(c.name); }}
                          className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-white transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleToggleCategory(c.id, c.isActive)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            c.isActive ? "bg-black/10 hover:bg-black/20 text-white" : "bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
                          )}
                        >
                          <Power size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border flex-shrink-0 transition-all",
                      selectedCategoryId === c.id ? "bg-white/10 border-white/20 text-white group-hover:opacity-0" : "bg-slate-50 border-slate-100 text-slate-500"
                    )}>
                      {c._count.services}
                    </span>
                  </div>
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
                        <TableRow key={svc.id} className="group">
                          <TableCell className="font-medium">
                            {editingSvcId === svc.id ? (
                              <div className="space-y-2">
                                <Input
                                  className="h-8 text-xs font-semibold"
                                  value={editSvcData.name}
                                  onChange={e => setEditSvcData({ ...editSvcData, name: e.target.value })}
                                />
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="Description..."
                                  value={editSvcData.description}
                                  onChange={e => setEditSvcData({ ...editSvcData, description: e.target.value })}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="bg-[#f1f5f9] p-1.5 rounded mr-3">
                                  <Tag size={14} className="text-[#64748b]" />
                                </div>
                                <div>
                                  <p className="text-[#1a1a1a] font-bold">{svc.name}</p>
                                  {svc.description && (
                                    <p className="text-[11px] font-medium text-[#666666] truncate max-w-[200px]">{svc.description}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-[#1a1a1a] font-black">
                            {editingSvcId === svc.id ? (
                              <Input
                                className="h-8 w-24 text-xs font-bold"
                                type="number"
                                value={editSvcData.basePrice}
                                onChange={e => setEditSvcData({ ...editSvcData, basePrice: e.target.value })}
                              />
                            ) : (
                              `₹${svc.basePrice.toLocaleString()}`
                            )}
                          </TableCell>
                          <TableCell className="text-[#666666] font-semibold">
                            {editingSvcId === svc.id ? (
                              <Input
                                className="h-8 w-20 text-xs"
                                type="number"
                                value={editSvcData.duration}
                                onChange={e => setEditSvcData({ ...editSvcData, duration: e.target.value })}
                              />
                            ) : (
                              `${svc.duration} min`
                            )}
                          </TableCell>
                          <TableCell className="text-[#666666] font-bold">{svc._count.merchantServices}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span
                                onClick={() => handleToggleService(svc.id, svc.isActive)}
                                className={cn(
                                  "cursor-pointer inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95",
                                  svc.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                )}
                              >
                                {svc.isActive ? 'Active' : 'Inactive'}
                              </span>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {editingSvcId === svc.id ? (
                                  <>
                                    <button onClick={() => handleUpdateService(svc.id)} className="p-1.5 rounded-lg bg-orange-100 text-[#FF6B00] hover:bg-orange-200 shadow-sm border border-orange-200/50">
                                      <Check size={14} />
                                    </button>
                                    <button onClick={() => setEditingSvcId(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingSvcId(svc.id);
                                        setEditSvcData({
                                          name: svc.name,
                                          basePrice: svc.basePrice.toString(),
                                          duration: svc.duration.toString(),
                                          description: svc.description || '',
                                        });
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-[#FF6B00] hover:bg-orange-50 transition-colors"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteService(svc.id)}
                                      className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
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
