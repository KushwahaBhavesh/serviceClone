'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Tag, Loader2, Check, X, Edit2, Trash2, Power, Zap, Box, Database, Filter, ChevronRight, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      await fetchCategories();
    } catch (err: any) {
      console.error('Delete failed:', err);
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

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      fetchServices(selectedCategoryId!);
      fetchCategories();
    } catch (err: any) {
      console.error('Delete failed:', err);
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
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <Database size={14} className="text-primary fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Core Definitions</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic text-glow">Global Catalog Map</h1>
        </div>

        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-12 px-6 border-slate-800 hover:border-primary group" onClick={() => setShowAddCategory(true)}>
              <Layers size={16} className="mr-3 text-slate-500 group-hover:text-primary transition-colors" />
              New Category
           </Button>
           <Button className="h-12 px-6" onClick={() => setShowAddService(true)} disabled={!selectedCategoryId}>
              <Plus size={18} className="mr-2" />
              Define Service
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Sections [{categories.length}]</h3>
             <Filter size={12} className="text-slate-700" />
          </div>

          {loadingCat ? (
            <div className="flex h-40 items-center justify-center bg-slate-900/50 rounded-3xl border border-slate-800">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(c => (
                <motion.div
                  layout
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={cn(
                    "cursor-pointer p-5 rounded-[1.5rem] border-2 transition-all duration-300 flex justify-between items-center group relative overflow-hidden",
                    selectedCategoryId === c.id
                      ? "border-primary bg-primary text-white shadow-electric"
                      : "border-slate-900 bg-slate-950 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0 z-10">
                    <div className={cn(
                       "h-8 w-8 rounded-xl flex items-center justify-center mr-4 transition-colors",
                       selectedCategoryId === c.id ? "bg-white/20" : "bg-slate-900 group-hover:bg-primary/10"
                    )}>
                       <Layers size={16} className={cn(
                        "transition-transform duration-300 group-hover:scale-110",
                        selectedCategoryId === c.id ? "text-white" : "text-slate-400 group-hover:text-primary"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {editingCatId === c.id ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input
                            className="bg-white/10 border-none h-8 w-full rounded-lg text-xs font-black uppercase text-white placeholder:text-white/50 px-3 transition-all focus:ring-0"
                            value={editCatName}
                            autoFocus
                            onChange={e => setEditCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(c.id)}
                          />
                          <button onClick={() => handleUpdateCategory(c.id)} className="h-8 w-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center"><Check size={14}/></button>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase tracking-tight truncate italic">{c.name}</span>
                          {!c.isActive && <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mt-1">Status: Disabled</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
                    {selectedCategoryId === c.id && !editingCatId ? (
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingCatId(c.id); setEditCatName(c.name); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><Edit2 size={12}/></button>
                          <button onClick={() => handleToggleCategory(c.id, c.isActive)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><Power size={12}/></button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="p-2 bg-rose-500/20 hover:bg-rose-500/40 rounded-lg"><Trash2 size={12}/></button>
                       </div>
                    ) : (
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border flex-shrink-0 transition-opacity",
                        selectedCategoryId === c.id ? "bg-white/10 border-white/20 text-white group-hover:opacity-0" : "bg-slate-900 border-slate-800 text-slate-500"
                      )}>
                        {c._count.services} units
                      </span>
                    )}
                  </div>
                  
                  {selectedCategoryId === c.id && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute inset-x-0 bottom-0 h-1 bg-white opacity-40" 
                    />
                  )}
                </motion.div>
              ))}
              
              {showAddCategory && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="p-4 bg-slate-900 border-2 border-primary border-dashed rounded-[1.5rem] space-y-4"
                >
                   <Input
                      placeholder="Section Identifier..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="h-10 bg-slate-950 border-slate-800 text-xs font-black uppercase tracking-widest"
                   />
                   <div className="flex gap-2">
                       <Button size="sm" className="flex-1 h-10" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}>
                          {addingCat ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Section'}
                       </Button>
                       <Button variant="outline" className="h-10 px-3 border-slate-800" onClick={() => setShowAddCategory(false)}>
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
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Payload Matrix: <span className="text-white italic">{selectedCategoryName}</span></h3>
             <div className="flex items-center gap-2">
                <Box size={12} className="text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{services.length} ACTIVE UNITS</span>
             </div>
          </div>

          <Card className="border-slate-900 bg-slate-950 overflow-hidden min-h-[500px]">
             {loadingSvc ? (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-4">
                   <Loader2 className="h-12 w-12 animate-spin text-primary" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Syncing definitions...</p>
                </div>
             ) : (
                <div className="flex flex-col h-full">
                   <Table>
                      <TableHeader>
                         <TableRow>
                            <TableHead className="w-[300px]">Service Unit Blueprint</TableHead>
                            <TableHead>Evaluation Price</TableHead>
                            <TableHead>Op Duration</TableHead>
                            <TableHead>Merchant Nodes</TableHead>
                            <TableHead className="text-right">Lifecycle Status</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {services.length === 0 ? (
                            <TableRow>
                               <TableCell colSpan={5} className="h-64 text-center">
                                  <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                                     <Layers size={48} className="text-slate-700" />
                                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Workspace Empty: No services defined in this section</p>
                                  </div>
                               </TableCell>
                            </TableRow>
                         ) : (
                            services.map((svc) => (
                               <TableRow key={svc.id} className="group transition-colors hover:bg-slate-900/30">
                                  <TableCell>
                                     <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center group-hover:border-primary/50 transition-all font-black text-primary">
                                           <Tag size={18} />
                                        </div>
                                        <div>
                                           {editingSvcId === svc.id ? (
                                              <div className="space-y-2">
                                                 <input 
                                                   className="bg-slate-900 border border-slate-800 rounded-lg h-8 px-3 text-xs font-black uppercase tracking-tight text-white w-full focus:ring-primary focus:border-primary"
                                                   value={editSvcData.name}
                                                   onChange={e => setEditSvcData({ ...editSvcData, name: e.target.value })}
                                                 />
                                                 <input 
                                                   className="bg-slate-900 border border-slate-800 rounded-lg h-7 px-3 text-[10px] font-bold text-slate-500 w-full focus:ring-primary focus:border-primary"
                                                   placeholder="Op Description..."
                                                   value={editSvcData.description}
                                                   onChange={e => setEditSvcData({ ...editSvcData, description: e.target.value })}
                                                 />
                                              </div>
                                           ) : (
                                              <>
                                                 <p className="text-sm font-black text-white italic uppercase tracking-tight">{svc.name}</p>
                                                 {svc.description && <p className="text-[10px] font-bold text-slate-600 group-hover:text-slate-400 mt-1 line-clamp-1">{svc.description}</p>}
                                              </>
                                           )}
                                        </div>
                                     </div>
                                  </TableCell>
                                  <TableCell>
                                     {editingSvcId === svc.id ? (
                                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 h-10 w-32 focus-within:border-primary">
                                           <span className="text-primary font-black text-xs mr-2">₹</span>
                                           <input 
                                             type="number" 
                                             className="bg-transparent border-none p-0 text-sm font-black text-white w-full focus:ring-0"
                                             value={editSvcData.basePrice}
                                             onChange={e => setEditSvcData({ ...editSvcData, basePrice: e.target.value })}
                                           />
                                        </div>
                                     ) : (
                                        <div className="flex items-center gap-2">
                                           <span className="text-base font-black text-white italic tracking-tighter uppercase">₹{svc.basePrice.toLocaleString()}</span>
                                           <Zap size={10} className="text-primary fill-primary opacity-30" />
                                        </div>
                                     )}
                                  </TableCell>
                                  <TableCell>
                                     {editingSvcId === svc.id ? (
                                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 h-10 w-24 focus-within:border-primary">
                                           <input 
                                             type="number" 
                                             className="bg-transparent border-none p-0 text-sm font-black text-white w-full focus:ring-0"
                                             value={editSvcData.duration}
                                             onChange={e => setEditSvcData({ ...editSvcData, duration: e.target.value })}
                                           />
                                           <span className="text-slate-500 font-bold text-[9px] uppercase ml-1">MIN</span>
                                        </div>
                                     ) : (
                                        <div className="flex items-center gap-2">
                                           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{svc.duration}</span>
                                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">MINS</span>
                                        </div>
                                     )}
                                  </TableCell>
                                  <TableCell>
                                     <div className="flex items-center gap-2 text-white font-black text-xs">
                                        <Hash size={12} className="text-primary" />
                                        {svc._count.merchantServices}
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                     <div className="flex items-center justify-end space-x-4">
                                        <div 
                                          onClick={() => handleToggleService(svc.id, svc.isActive)}
                                          className={cn(
                                          "cursor-pointer px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all hover:scale-105 active:scale-95 shadow-lg",
                                          svc.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-900 text-slate-700 border-slate-800"
                                        )}>
                                          {svc.isActive ? 'ACTIVE' : 'OFFLINE'}
                                        </div>

                                        <div className="flex items-center space-x-1">
                                           {editingSvcId === svc.id ? (
                                              <>
                                                 <button onClick={() => handleUpdateService(svc.id)} className="h-10 w-10 bg-primary/20 text-primary border border-primary/30 rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all"><Check size={18}/></button>
                                                 <button onClick={() => setEditingSvcId(null)} className="h-10 w-10 bg-slate-900 text-slate-500 border border-slate-800 rounded-xl flex items-center justify-center hover:text-white transition-all"><X size={18}/></button>
                                              </>
                                           ) : (
                                              <>
                                                 <button onClick={() => {
                                                    setEditingSvcId(svc.id);
                                                    setEditSvcData({
                                                      name: svc.name,
                                                      basePrice: svc.basePrice.toString(),
                                                      duration: svc.duration.toString(),
                                                      description: svc.description || '',
                                                    });
                                                 }} className="h-10 w-10 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary/50 transition-all opacity-0 group-hover:opacity-100"><Edit2 size={14}/></button>
                                                 <button onClick={() => handleDeleteService(svc.id)} className="h-10 w-10 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-500 hover:border-rose-500/50 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                                              </>
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
                      <div className="mt-auto px-10 py-8 bg-slate-900/30 border-t border-slate-900">
                         <div className="flex items-center gap-3 mb-6">
                            <Plus size={16} className="text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Appending Service Blueprint to <span className="text-white italic">"{selectedCategoryName}"</span></p>
                         </div>
                         <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Service Identifier</p>
                               <Input 
                                  placeholder="E.G. DEEP CLEANING MATRIX" 
                                  className="h-12 bg-slate-950 border-slate-800 text-xs font-black uppercase tracking-widest placeholder:text-slate-800"
                                  value={newSvcName}
                                  onChange={(e) => setNewSvcName(e.target.value)}
                               />
                            </div>
                            <div className="w-48 space-y-2">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Payload Valuation (₹)</p>
                               <Input 
                                  placeholder="0.00" 
                                  type="number"
                                  className="h-12 bg-slate-950 border-slate-800 text-xs font-black uppercase tracking-widest placeholder:text-slate-800"
                                  value={newSvcPrice}
                                  onChange={(e) => setNewSvcPrice(e.target.value)}
                               />
                            </div>
                            <div className="flex flex-col justify-end gap-2 pb-0.5">
                               <div className="flex gap-2">
                                  <Button className="h-12 px-8" onClick={handleAddService} disabled={addingSvc || !newSvcName.trim() || !newSvcPrice}>
                                     {addingSvc ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Blueprint'}
                                  </Button>
                                  <Button variant="outline" className="h-12 px-4 border-slate-800" onClick={() => setShowAddService(false)}>
                                     <X size={18} />
                                  </Button>
                               </div>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
}
