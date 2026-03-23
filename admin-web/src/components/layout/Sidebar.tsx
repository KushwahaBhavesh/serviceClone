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
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/merchants', label: 'Merchants (KYC)', icon: Store },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/catalog', label: 'Catalog', icon: Layers },
];

export function Sidebar() {
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

  if (!mounted) return <div className="w-64 border-r border-[#e2e8f0] bg-white hidden md:block" />;

  return (
    <aside className="w-68 border-r border-slate-200 bg-white hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 enterprise-shadow">
      {/* Brand */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-sm rotate-3 transform">
          <span className="text-white font-black text-lg tracking-tight">S</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-base leading-tight tracking-tight">ServiceClone</span>
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Admin Portal</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative block group"
            >
              <div className={cn(
                "flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative z-10",
                isActive
                  ? "text-white shadow-lg shadow-slate-200"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}>
                <Icon size={19} className={cn("mr-3.5 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                {item.label}
              </div>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-slate-950 rounded-xl z-0"
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Footer */}
      <div className="p-5 mt-auto border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm mb-4">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white shadow-inner">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{user?.name || 'Admin'}</p>
            <p className="text-[11px] font-medium text-slate-400 truncate uppercase tracking-widest leading-none mt-1">Super Admin</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-bold text-rose-500 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-500 hover:text-white transition-all duration-300 group"
        >
          <LogOut size={16} className="transition-transform group-hover:-translate-x-1" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
