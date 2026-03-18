import { useAuthStore } from '@/store/useAuthStore';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-[#f1f5f9] sticky top-0 z-20">
      <div className="flex items-center md:hidden">
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-[#0f172a] p-2 -ml-2 rounded-md hover:bg-[#f8fafc]"
        >
          <Menu size={20} />
        </button>
        <span className="font-bold text-[#0f172a] ml-2">Admin Portal</span>
      </div>
      
      <div className="hidden md:flex flex-1 items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0f172a] tracking-tight">Dashboard Overview</h2>
        
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[#0f172a] leading-none">{user?.name || 'Administrator'}</p>
            <p className="text-xs text-[#64748b] mt-1">Global Access</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center font-bold shadow-sm">
            {user?.name?.charAt(0) || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
