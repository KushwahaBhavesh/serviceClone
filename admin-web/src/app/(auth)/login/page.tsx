'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Mail, Lock, Loader2, ShieldCheck, ArrowRight, Zap, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-6 relative overflow-hidden">
      {/* Professional Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Zap size={24} className="text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ServiceClone Admin</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Enterprise Management Portal</p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
          <div className="h-1.5 w-full bg-primary" />

          <form onSubmit={handleLogin}>
            <CardHeader className="pt-8 pb-4 px-8 border-none text-center">
              <CardTitle className="text-xl font-bold text-slate-900">Welcome Back</CardTitle>
              <CardDescription className="text-slate-500">Sign in to your administrator account</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 px-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex gap-3 items-center"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Mail size={16} />
                  </div>
                  <Input
                    type="email"
                    placeholder="admin@serviceclone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
                  <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot password?</button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock size={16} />
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary text-sm transition-all"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-8 pb-8 pt-6 border-none">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-[#e56000] text-sm font-bold shadow-lg shadow-primary/20 group transition-all"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full relative">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    <span>Secure Sign In</span>
                    <ArrowRight className="w-4 h-4 absolute right-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Professional Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            &copy; 2024 ServiceClone &bull; Secure Enterprise Portal
          </p>
        </div>
      </motion.div>
    </div>
  );
}
