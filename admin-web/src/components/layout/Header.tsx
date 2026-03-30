'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { Menu, Search, Bell, Settings } from 'lucide-react';

const PAGE_DETAILS: Record<string, { title: string; subtitle: string }> = {
  '/analytics': { title: 'Platform Intelligence', subtitle: 'Real-time metrics & data analysis' },
  '/merchants': { title: 'Merchant Operations', subtitle: 'Onboarding, KYC & merchant management' },
  '/users': { title: 'User Directories', subtitle: 'Manage customers and global profiles' },
  '/bookings': { title: 'Order Management', subtitle: 'Global booking flow & lifecycle' },
  '/catalog': { title: 'Platform Catalog', subtitle: 'Categories, services & service inventory' },
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const details = Object.entries(PAGE_DETAILS).find(([path]) => pathname.startsWith(path))?.[1] || { 
    title: 'Dashboard Control', 
    subtitle: 'System-wide overview' 
  };

  return (
    <header className="h-24 flex items-center justify-between px-8 bg-slate-950 border-b border-slate-900 sticky top-0 z-20">
      {/* Mobile Toggle */}
      <div className="flex items-center md:hidden">
        <button
          onClick={onMenuClick}
          className="text-white p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop Info Area */}
      <div className="hidden md:flex flex-1 items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-black text-white tracking-tight uppercase italic">{details.title}</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 ml-4">{details.subtitle}</p>
        </div>

        {/* Action Area */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 w-72 transition-all hover:border-slate-700 group">
            <Search size={16} className="text-slate-500 group-hover:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Command search..." 
              className="bg-transparent border-none text-sm text-white focus:ring-0 ml-3 placeholder:text-slate-600 font-bold"
            />
          </div>

          <div className="h-10 w-[1px] bg-slate-800 mx-1" />

          <button className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all active:scale-95">
            <Bell size={18} />
          </button>
          
          <button className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all active:scale-95">
            <Settings size={18} />
          </button>

          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="text-right hidden xl:block">
              <p className="text-xs font-black text-white uppercase tracking-wider">{user?.name || 'Administrator'}</p>
              <p className="text-[9px] font-black text-primary mt-1 uppercase tracking-[0.2em]">Session: Live</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-500/20 shadow-inner border border-white/10">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
