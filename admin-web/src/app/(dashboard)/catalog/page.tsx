'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Tag, Loader2, Check, X, Edit2, Trash2, Power, Zap, Box, Database, Filter, ChevronRight, Hash, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';

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

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  const [showAddService, setShowAddService] = useState(false);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [addingSvc, setAddingSvc] = useState(false);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
  const [editSvcData, setEditSvcData] = useState({ name: '', basePrice: '', duration: '', description: '' });

  // Alert Dialog State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<'category' | 'service' | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoadingCat(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCat(false);
    }
  }, [selectedCategoryId]);

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
      await fetchCategories();
    } catch (err: any) {
      console.error('Failed to add service:', err);
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
      console.error('Update failed:', err);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setPendingDeleteId(id);
    setAlertType('category');
    setAlertOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/categories/${pendingDeleteId}`);
      if (selectedCategoryId === pendingDeleteId) setSelectedCategoryId(null);
      await fetchCategories();
      setAlertOpen(false);
    } catch (err: any) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const handleToggleCategory = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/categories/${id}`, { isActive: !current });
      await fetchCategories();
    } catch (err: any) {
      console.error('Toggle failed:', err);
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
      console.error('Update failed:', err);
    }
  };

  const handleDeleteService = (id: string) => {
    setPendingDeleteId(id);
    setAlertType('service');
    setAlertOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/services/${pendingDeleteId}`);
      fetchServices(selectedCategoryId!);
      fetchCategories();
      setAlertOpen(false);
    } catch (err: any) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const handleToggleService = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/services/${id}`, { isActive: !current });
      fetchServices(selectedCategoryId!);
    } catch (err: any) {
      console.error('Toggle failed:', err);
    }
  };

  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name || 'Select a section';

  return (
    <div className="pb-10">
      <Breadcrumbs />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Service Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage global service categories and unit definitions.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setShowAddCategory(true)}>
            <Layers size={14} className="text-muted-foreground" />
            New Category
          </Button>
          <Button size="sm" className="h-9 gap-2 shadow-primary/20" onClick={() => setShowAddService(true)} disabled={!selectedCategoryId}>
            <Plus size={16} />
            Add Service
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</h3>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{categories.length}</Badge>
          </div>

          {loadingCat ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 w-full bg-muted/40 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {categories.map(c => (
                <motion.div
                  layout
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={cn(
                    "cursor-pointer px-4 py-3 rounded-xl border transition-all duration-200 flex justify-between items-center group overflow-hidden",
                    selectedCategoryId === c.id
                      ? "border-primary/20 bg-primary/5 text-primary"
                      : "border-transparent bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Layers size={14} className={cn(
                      "mr-3 flex-shrink-0 transition-colors",
                      selectedCategoryId === c.id ? "text-primary" : "text-muted-foreground"
                    )} />

                    <div className="flex-1 min-w-0">
                      {editingCatId === c.id ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input
                            className="bg-background border border-primary/20 h-7 w-full rounded-md text-xs font-medium px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                            value={editCatName}
                            autoFocus
                            onChange={e => setEditCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(c.id)}
                          />
                          <button onClick={() => handleUpdateCategory(c.id)} className="h-6 w-6 bg-primary text-white rounded-md flex items-center justify-center shrink-0 shadow-sm"><Check size={12} /></button>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm truncate">{c.name}</span>
                          {!c.isActive && <span className="text-[10px] font-medium opacity-60">Disabled</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2" onClick={e => e.stopPropagation()}>
                    {selectedCategoryId === c.id && !editingCatId ? (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingCatId(c.id); setEditCatName(c.name); }} className="p-1.5 hover:bg-primary/10 rounded-md text-primary"><Edit2 size={12} /></button>
                        <button onClick={() => handleToggleCategory(c.id, c.isActive)} className="p-1.5 hover:bg-primary/10 rounded-md text-primary"><Power size={12} /></button>
                        <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-destructive"><Trash2 size={12} /></button>
                      </div>
                    ) : (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-opacity",
                        selectedCategoryId === c.id ? "bg-primary/10 border-primary/20 group-hover:opacity-0" : "bg-muted border-border"
                      )}>
                        {c._count.services}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {showAddCategory && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-muted/30 border border-dashed border-primary/30 rounded-xl space-y-3"
                >
                  <Input
                    placeholder="Category name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}>
                      {addingCat ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setShowAddCategory(false)}>
                      <X size={14} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Services Main Workspace */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-sm border-border overflow-hidden min-h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Box size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">{selectedCategoryName}</CardTitle>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{services.length} Defined Services</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Filter size={14} />
                </Button>
              </div>
            </CardHeader>

            {loadingSvc ? (
              <div className="h-[400px] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                <p className="text-xs font-medium text-muted-foreground tracking-tight">Loading service blueprints...</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <Table>
                  <TableHeader className="bg-muted/5">
                    <TableRow>
                      <TableHead className="w-[30%]">Service Base</TableHead>
                      <TableHead>Base Rate</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Providers</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12">
                          <EmptyState
                            icon={Layers}
                            title="No services found"
                            description="There are no services defined in this category yet. Start by defining your first service blueprint."
                            action={{
                              label: "Define Your First Service",
                              onClick: () => setShowAddService(true)
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      services.map((svc) => (
                        <TableRow key={svc.id} className="group transition-colors">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-muted/50 border border-border rounded-lg flex items-center justify-center transition-all group-hover:border-primary/30">
                                <Tag size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div className="min-w-0">
                                {editingSvcId === svc.id ? (
                                  <div className="space-y-1.5 py-2">
                                    <input
                                      className="bg-background border border-primary/20 rounded-md h-7 px-2 text-sm font-semibold w-full focus:outline-none focus:ring-1 focus:ring-primary"
                                      value={editSvcData.name}
                                      onChange={e => setEditSvcData({ ...editSvcData, name: e.target.value })}
                                    />
                                    <input
                                      className="bg-background border border-border rounded-md h-6 px-2 text-[10px] text-muted-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary"
                                      placeholder="Brief description..."
                                      value={editSvcData.description}
                                      onChange={e => setEditSvcData({ ...editSvcData, description: e.target.value })}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm font-bold text-foreground truncate">{svc.name}</p>
                                    {svc.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{svc.description}</p>}
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingSvcId === svc.id ? (
                              <div className="flex items-center bg-background border border-primary/20 rounded-md px-2 h-8 w-28 focus-within:ring-1 focus-within:ring-primary">
                                <span className="text-primary font-bold text-xs mr-1">₹</span>
                                <input
                                  type="number"
                                  className="bg-transparent border-none p-0 text-sm font-bold w-full focus:outline-none"
                                  value={editSvcData.basePrice}
                                  onChange={e => setEditSvcData({ ...editSvcData, basePrice: e.target.value })}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-foreground">₹{svc.basePrice.toLocaleString()}</span>
                                <Zap size={10} className="text-primary/40 fill-primary/10" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingSvcId === svc.id ? (
                              <div className="flex items-center bg-background border border-primary/20 rounded-md px-2 h-8 w-20 focus-within:ring-1 focus-within:ring-primary">
                                <input
                                  type="number"
                                  className="bg-transparent border-none p-0 text-xs font-bold w-full focus:outline-none"
                                  value={editSvcData.duration}
                                  onChange={e => setEditSvcData({ ...editSvcData, duration: e.target.value })}
                                />
                                <span className="text-muted-foreground font-semibold text-[9px] ml-1">MIN</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Clock size={12} className="text-muted-foreground/50" />
                                <span className="text-xs font-bold text-foreground">{svc.duration}</span>
                                <span className="text-[9px] font-semibold text-muted-foreground">MIN</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold border-muted-foreground/10 text-muted-foreground">
                                {svc._count.merchantServices} NODES
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Badge
                                onClick={() => handleToggleService(svc.id, svc.isActive)}
                                className={cn(
                                  "cursor-pointer px-2 py-0.5 text-[9px] font-bold transition-all hover:scale-105 shadow-sm active:scale-95",
                                  svc.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"
                                )}>
                                {svc.isActive ? 'ACTIVE' : 'OFFLINE'}
                              </Badge>

                              <div className="flex items-center gap-0.5">
                                {editingSvcId === svc.id ? (
                                  <div className="flex gap-1">
                                    <button onClick={() => handleUpdateService(svc.id)} className="h-7 w-7 bg-primary text-white rounded-md flex items-center justify-center shadow-sm hover:bg-primary/90"><Check size={14} /></button>
                                    <button onClick={() => setEditingSvcId(null)} className="h-7 w-7 bg-muted text-muted-foreground rounded-md flex items-center justify-center hover:bg-muted/80"><X size={14} /></button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => {
                                      setEditingSvcId(svc.id);
                                      setEditSvcData({
                                        name: svc.name,
                                        basePrice: svc.basePrice.toString(),
                                        duration: svc.duration.toString(),
                                        description: svc.description || '',
                                      });
                                    }} className="h-7 w-7 hover:bg-primary/10 rounded-md text-slate-400 hover:text-primary transition-all"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDeleteService(svc.id)} className="h-7 w-7 hover:bg-destructive/10 rounded-md text-slate-400 hover:text-destructive transition-all"><Trash2 size={14} /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {showAddService && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-auto px-8 py-8 bg-muted/10 border-t border-border"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <Plus size={14} className="text-primary" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Defining Service for <span className="text-foreground">{selectedCategoryName}</span></p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Service Name</p>
                        <Input
                          placeholder="e.g. Professional Floor Cleaning"
                          className="h-10 text-sm font-medium"
                          value={newSvcName}
                          onChange={(e) => setNewSvcName(e.target.value)}
                        />
                      </div>
                      <div className="w-full md:w-48 space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Base Price (₹)</p>
                        <Input
                          placeholder="0.00"
                          type="number"
                          className="h-10 text-sm font-medium"
                          value={newSvcPrice}
                          onChange={(e) => setNewSvcPrice(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end gap-2 shrink-0">
                        <Button className="h-10 px-6 shadow-primary/20" onClick={handleAddService} disabled={addingSvc || !newSvcName.trim() || !newSvcPrice}>
                          {addingSvc ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Definition'}
                        </Button>
                        <Button variant="outline" className="h-10 px-3" onClick={() => setShowAddService(false)}>
                          <X size={18} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={alertType === 'category' ? confirmDeleteCategory : confirmDeleteService}
        title={alertType === 'category' ? "Delete Category" : "Delete Service"}
        description={
          alertType === 'category'
            ? "Are you sure you want to delete this category? All associated services will be affected. This action cannot be undone."
            : "Are you sure you want to delete this service? This action will remove it from the catalog and cannot be undone."
        }
        confirmLabel="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
