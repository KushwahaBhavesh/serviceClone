'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!token || user?.role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [token, user, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
          <Zap size={20} className="absolute inset-0 m-auto text-primary" />
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Portal...</p>
      </div>
    );
  }

  if (!token || user?.role !== 'ADMIN') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background flex selection:bg-primary/20 selection:text-primary text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-[280px] z-[101] md:hidden bg-card border-r border-border shadow-2xl"
            >
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Professional subtle background variation */}
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/2 blur-[140px] rounded-full -mr-96 -mt-96 pointer-events-none z-0" />

        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-6 md:px-10 py-8 relative z-10 scroll-smooth custom-scrollbar bg-transparent">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
