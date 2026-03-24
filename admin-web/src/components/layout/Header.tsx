'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/analytics': 'Platform Analytics',
  '/merchants': 'Merchants & KYC',
  '/users': 'User Management',
  '/bookings': 'Global Bookings',
  '/catalog': 'Service Catalog',
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] || 'Dashboard';

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
      <div className="flex items-center md:hidden">
        <button
          onClick={onMenuClick}
          className="text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Menu size={22} />
        </button>
        <span className="font-bold text-slate-900 ml-3 tracking-tight">ServiceClone</span>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{pageTitle}</h2>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-[0.15em] mt-0.5">Control Center</p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="h-8 w-[1px] bg-slate-200 mx-2" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none tracking-tight">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-widest">Active Session</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-black shadow-lg shadow-orange-100 border border-orange-400/20">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
