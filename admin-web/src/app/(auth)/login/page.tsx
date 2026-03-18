'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

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
      
      // Enforce ADMIN role
      if (user.role !== 'ADMIN') {
        setError('Unauthorized: Admin access required.');
        setLoading(false);
        return;
      }
      
      setAuth(user, token);
      router.push('/'); // Dashboard
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-[420px]"
      >
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="h-12 w-12 bg-[#0f172a] rounded-xl flex items-center justify-center mb-4 shadow-xl">
            <span className="text-white font-bold text-xl tracking-tight">O</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Admin Portal</h1>
          <p className="text-sm text-[#64748b] mt-1">Sign in to manage the platform</p>
        </div>

        <Card className="border-[#e2e8f0] shadow-sm">
          <form onSubmit={handleLogin}>
            <CardHeader className="pb-6">
              <CardTitle className="text-lg">Welcome back</CardTitle>
              <CardDescription>Enter your admin credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-[#fef2f2] border border-[#fecaca] text-[#ef4444] px-4 py-3 rounded-md text-sm flex gap-3 items-start relative">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0f172a]">Email address</label>
                <Input
                  type="email"
                  placeholder="admin@ondemand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#0f172a]">Password</label>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading || !email || !password}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sign in to Dashboard
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
