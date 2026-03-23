'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!token || user?.role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [token, user, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
      </div>
    );
  }

  if (!token || user?.role !== 'ADMIN') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex selection:bg-[#FF6B00] selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-200/20 blur-[100px] rounded-full -mr-64 -mt-64 pointer-events-none z-0" />

        <Header />
        <main className="flex-1 overflow-y-auto px-8 py-10 relative z-10 scroll-smooth custom-scrollbar">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
    ;
}
