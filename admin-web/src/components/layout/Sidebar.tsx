'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Users,
  Store,
  CalendarDays,
  Layers,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/analytics', label: 'Platform Analytics', icon: BarChart3 },
  { href: '/merchants', label: 'Merchants & KYC', icon: Store },
  { href: '/users', label: 'User Management', icon: Users },
  { href: '/bookings', label: 'Global Bookings', icon: CalendarDays },
  { href: '/catalog', label: 'Service Catalog', icon: Layers },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!mounted) return <div className="w-72 bg-slate-950 border-r border-slate-800 hidden md:block" />;

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-30 overflow-hidden">
      {/* Brand Section */}
      <div className="h-24 flex items-center px-8 bg-slate-900/50 border-b border-slate-800/50">
        <div className="flex items-center group cursor-default">
          <div className="h-11 w-11 bg-primary rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-orange-500/20 transform transition-transform group-hover:scale-105 duration-300">
            <span className="text-white font-black text-xl italic">S</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-white text-lg tracking-tight leading-none">ServiceClone</span>
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mt-1">Admin Pro</span>
          </div>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Main Navigation</p>
        
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="relative block group"
            >
              <div className={cn(
                "flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 relative z-10",
                isActive
                  ? "bg-slate-900 text-primary border border-slate-800"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40"
              )}>
                <div className={cn(
                  "mr-4 p-2 rounded-lg transition-all duration-300",
                  isActive ? "bg-primary text-white shadow-electric" : "bg-slate-900 text-slate-500 group-hover:text-white"
                )}>
                  <Icon size={18} />
                </div>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <motion.div layoutId="activeArrow">
                    <ChevronRight size={14} className="text-primary" />
                  </motion.div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900/30">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-4 transition-all hover:border-slate-700">
          <div className="flex items-center space-x-3">
             <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-primary text-lg">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-sm" />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate tracking-wide">{user?.name || 'Administrator'}</p>
                <div className="flex items-center mt-1">
                  <ShieldCheck size={10} className="text-primary mr-1" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Super Admin</p>
                </div>
             </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-4 text-xs font-black text-slate-400 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all duration-300 active:scale-[0.98]"
        >
          <LogOut size={16} />
          <span className="uppercase tracking-widest">Sign out of portal</span>
        </button>
      </div>
    </aside>
  );
}
