'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldAlert, Zap, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data;

      if (user.role !== 'ADMIN') {
        setError('CRITICAL: Access Denied. Elevated privileges required.');
        setLoading(false);
        return;
      }

      setAuth(user, token);
      router.push('/analytics');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication Failed: Invalid Credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 overflow-hidden relative">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/5 blur-[150px] rounded-full -mr-96 -mt-96 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full -ml-64 -mb-64 pointer-events-none" />
      
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Brand Header */}
        <div className="mb-10 flex flex-col items-center">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="h-20 w-20 bg-primary rounded-[2rem] flex items-center justify-center mb-6 shadow-electric shadow-orange-500/20 border-4 border-white/10"
          >
            <Zap size={40} className="text-white fill-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Command Center</h1>
          <div className="flex items-center mt-3 gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Secure Access Required</p>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/40 border-2 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-primary" />
          
          <form onSubmit={handleLogin} className="p-2">
            <CardHeader className="pt-10 pb-6 px-10 border-none">
              <CardTitle className="text-2xl font-black italic tracking-tight">Operator Authentication</CardTitle>
              <CardDescription className="text-slate-500">Provide clearance credentials to initialize session</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 px-10">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex gap-3 items-center"
                  >
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center mb-1 px-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-focus-within:text-primary transition-colors">Neural Address</label>
                   <Mail size={12} className="text-slate-700" />
                </div>
                <Input
                  type="email"
                  placeholder="admin.terminal@serviceclone.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-slate-950/50 h-14 rounded-2xl border-slate-800 focus-visible:ring-primary/50 text-base"
                />
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center mb-1 px-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-focus-within:text-primary transition-colors">Access Keypack</label>
                   <Lock size={12} className="text-slate-700" />
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-slate-950/50 h-14 rounded-2xl border-slate-800 focus-visible:ring-primary/50 text-base"
                />
              </div>
            </CardContent>

            <CardFooter className="px-10 pb-10 pt-4 border-none">
              <Button 
                type="submit" 
                className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-[#e56000] text-sm group" 
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    <span className="animate-pulse">Authorizing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    <span>Initiate Clearance</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Cinematic Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-6 px-8 py-3 bg-slate-950 rounded-full border border-slate-900 shadow-lg">
             <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol:</p>
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">AES-256-GCM</p>
             </div>
             <div className="h-4 w-px bg-slate-800" />
             <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Build:</p>
                <p className="text-[9px] font-black text-white uppercase tracking-widest italic">v.4.2.0-PRO</p>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Mail({ size, className }: { size: number, className: string }) {
  return <div className={className} style={{ width: size, height: size, border: '2px solid currentColor', borderRadius: '4px' }} />
}
