'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { Menu, Search, Bell, Settings, Command, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CommandPalette } from '@/components/ui/command-palette';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const PAGE_DETAILS: Record<string, { title: string; subtitle: string }> = {
  '/analytics': { title: 'Analytics Dashboard', subtitle: 'Overview of platform performance and key metrics' },
  '/merchants': { title: 'Merchants & KYC', subtitle: 'Manage merchant accounts and verification requests' },
  '/users': { title: 'User Management', subtitle: 'Directory of all customers and platform participants' },
  '/bookings': { title: 'Global Bookings', subtitle: 'Real-time tracking of orders and service fulfillment' },
  '/catalog': { title: 'Service Catalog', subtitle: 'Manage categories, services, and platform offerings' },
  '/agents': { title: 'Service Agents', subtitle: 'Monitor provider performance, KYC, and availability' },
  '/settings': { title: 'System Settings', subtitle: 'Configure platform parameters and financials' },
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const details = Object.entries(PAGE_DETAILS).find(([path]) => pathname.startsWith(path))?.[1] || {
    title: 'Dashboard',
    subtitle: 'System-wide overview and controls'
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border sticky top-0 z-20 shadow-sm">
      {/* Mobile Toggle & Desktop Breadcrumb Area */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-foreground p-2 hover:bg-muted rounded-lg transition-all"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex flex-col">
          <h2 className="text-sm font-bold text-foreground">{details.title}</h2>
          <p className="text-[10px] text-muted-foreground font-medium hidden lg:block">{details.subtitle}</p>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div
          className="hidden sm:flex items-center relative group cursor-pointer"
          onClick={() => setIsSearchOpen(true)}
        >
          <div className="absolute left-3 text-muted-foreground group-hover:text-primary transition-colors">
            <Search size={14} />
          </div>
          <div className="pl-9 h-9 w-[240px] lg:w-[320px] bg-muted/50 border border-transparent rounded-full text-xs font-medium text-muted-foreground flex items-center">
            Search anything...
          </div>
          <div className="absolute right-3 flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-card text-[9px] text-muted-foreground font-medium">
            <Command size={8} /> K
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />

        <div className="flex items-center gap-1.5 relative">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 relative transition-all", isNotifOpen ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground")}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-card" />
          </Button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alert Center</p>
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold">4 NEW</Badge>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {[
                    { title: 'New Merchant KYC', desc: 'Cleaners Co. submitted documents', time: '2m ago', icon: ShieldCheck, color: 'text-primary' },
                    { title: 'Payment Failed', desc: 'Booking #BK-921 failed processing', time: '15m ago', icon: Zap, color: 'text-rose-500' },
                    { title: 'System Update', desc: 'v2.4.0 rollout successfully deployed', time: '1h ago', icon: Settings, color: 'text-blue-500' }
                  ].map((n, i) => (
                    <div key={i} className="p-4 border-b border-border/50 hover:bg-muted/30 transition-colors flex gap-3 cursor-pointer">
                      <div className={cn("h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0", n.color)}>
                        <n.icon size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-bold text-foreground truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{n.desc}</p>
                        <p className="text-[9px] font-medium text-muted-foreground/60 mt-1 uppercase tracking-tighter">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full p-3 text-[10px] font-bold text-primary hover:bg-primary/5 transition-all uppercase tracking-widest border-t border-border">
                  View All Notifications
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Settings size={18} />
          </Button>
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-border hidden xs:flex group relative cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right hidden xl:block">
            <p className="text-xs font-bold text-foreground leading-tight">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-primary font-medium">Super Admin</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shadow-sm">
            {user?.name?.charAt(0) || 'A'}
          </div>

          {/* Simple Profile Flyout Hidden by Default */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-2 border-b border-border mb-1">
              <p className="text-xs font-bold">{user?.email || 'admin@serveiq.com'}</p>
            </div>
            <button className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all">Profile Settings</button>
            <button className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50 rounded-md transition-all">Sign Out</button>
          </div>
        </div>
      </div>
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
