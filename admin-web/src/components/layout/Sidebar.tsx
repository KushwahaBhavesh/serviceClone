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
    <aside className="w-64 border-r border-[#e2e8f0] bg-white hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-[#f1f5f9]">
        <div className="h-8 w-8 bg-[#0f172a] rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm tracking-tight">O</span>
        </div>
        <span className="font-bold text-[#0f172a] text-lg tracking-tight">Admin Portal</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative block"
            >
              <div className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative z-10",
                isActive ? "text-white" : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]"
              )}>
                <Icon size={18} className={cn("mr-3", isActive ? "text-white" : "text-[#94a3b8]")} />
                {item.label}
              </div>
              
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#0f172a] rounded-lg z-0"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="p-4 border-t border-[#f1f5f9]">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-[#f8fafc] mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0f172a] truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-[#64748b] truncate">{user?.email}</p>
          </div>
          <ShieldAlert size={16} className="text-[#0ea5e9]" />
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-[#ef4444] rounded-lg hover:bg-[#fef2f2] transition-colors"
        >
          <LogOut size={16} className="mr-3" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
