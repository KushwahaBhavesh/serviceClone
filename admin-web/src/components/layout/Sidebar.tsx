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
  ShieldCheck,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/merchants', label: 'Merchants & KYC', icon: Store, badge: '12' },
  { href: '/agents', label: 'Service Agents', icon: ShieldCheck },
  { href: '/users', label: 'User Directory', icon: Users },
  { href: '/bookings', label: 'Global Bookings', icon: CalendarDays },
  { href: '/catalog', label: 'Service Catalog', icon: Layers },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!mounted) return <div className={cn("bg-card border-r border-border hidden md:block transition-all duration-300", isCollapsed ? "w-20" : "w-64")} />;

  return (
    <aside className={cn(
      "bg-card border-r border-border hidden md:flex flex-col h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Brand Section */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-foreground text-sm tracking-tight">ServiceClone</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Admin Portal</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {!isCollapsed && (
          <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Management</p>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block"
            >
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                <Icon size={isCollapsed ? 20 : 18} className={cn("flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
                {item.badge && !isCollapsed && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-muted group-hover:bg-background">
                    {item.badge}
                  </Badge>
                )}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-2 border-t border-border">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2 text-xs font-medium"><ChevronLeft size={16} /> <span>Collapse Sidebar</span></div>}
        </button>
      </div>

      {/* User / Logout Section */}
      <div className="p-3 border-t border-border bg-muted/20">
        {!isCollapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-primary">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Super Admin</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
            >
              <LogOut size={14} />
              <span className="text-xs font-medium">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-primary cursor-pointer hover:bg-primary/10 transition-all">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
