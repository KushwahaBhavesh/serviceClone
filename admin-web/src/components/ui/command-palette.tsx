'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    User,
    Store,
    Calendar,
    Settings,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    Zap,
    Command as CommandIcon,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    type: 'user' | 'merchant' | 'booking' | 'page';
    title: string;
    subtitle: string;
    link: string;
}

const QUICK_LINKS: SearchResult[] = [
    { id: '1', type: 'page' as const, title: 'Analytics', subtitle: 'View system performance', link: '/analytics' },
    { id: '2', type: 'page' as const, title: 'Merchants', subtitle: 'Manage business partners', link: '/merchants' },
    { id: '3', type: 'page' as const, title: 'Settings', subtitle: 'Configure platform', link: '/settings' },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (isOpen) onClose();
                else onClose(); // This is handled by parent usually, but good for safety
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, onClose]);

    const handleSearch = (q: string) => {
        setQuery(q);
        if (q.length < 2) {
            setResults([]);
            return;
        }

        // Mock results for now
        const mockResults: SearchResult[] = [
            { id: 'm1', type: 'merchant' as const, title: 'Cleaners Co.', subtitle: 'Pending Review • New York', link: '/merchants' },
            { id: 'u1', type: 'user' as const, title: 'John Doe', subtitle: 'Premium Member • john@example.com', link: '/users' },
            { id: 'b1', type: 'booking' as const, title: 'BK-9921', subtitle: 'In Progress • ₹1,200', link: '/bookings' },
        ].filter(r => r.title.toLowerCase().includes(q.toLowerCase()));

        setResults(mockResults);
    };

    const navigateTo = (link: string) => {
        router.push(link);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
                >
                    <div className="p-4 border-b border-border flex items-center gap-3">
                        <Search size={20} className="text-muted-foreground" />
                        <input
                            autoFocus
                            placeholder="Search users, merchants, bookings or settings..."
                            className="flex-1 bg-transparent border-none text-base font-medium focus:ring-0 placeholder:text-muted-foreground/60"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                            Esc
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {query.length === 0 ? (
                            <div className="space-y-4 p-4">
                                <div>
                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-2">Quick Navigation</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {QUICK_LINKS.map(link => (
                                            <button
                                                key={link.id}
                                                onClick={() => navigateTo(link.link)}
                                                className="flex flex-col items-start p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                            >
                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary mb-2">
                                                    {link.id === '1' ? <TrendingUp size={16} /> : link.id === '2' ? <Store size={16} /> : <Settings size={16} />}
                                                </div>
                                                <span className="text-xs font-bold">{link.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map(result => (
                                    <button
                                        key={result.id}
                                        onClick={() => navigateTo(result.link)}
                                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 group transition-all"
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            result.type === 'merchant' ? "bg-primary/10 text-primary" :
                                                result.type === 'user' ? "bg-blue-100 text-blue-600" :
                                                    "bg-emerald-100 text-emerald-600"
                                        )}>
                                            {result.type === 'merchant' ? <Store size={18} /> :
                                                result.type === 'user' ? <User size={18} /> :
                                                    <Calendar size={18} />}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-bold text-foreground">{result.title}</p>
                                            <p className="text-[11px] font-medium text-muted-foreground">{result.subtitle}</p>
                                        </div>
                                        <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center opacity-50">
                                <Search size={32} className="mx-auto mb-4 text-muted-foreground" />
                                <p className="text-sm font-bold">No results found for "{query}"</p>
                                <p className="text-xs mt-1">Try searching for a different keyword</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5"><ArrowRight size={10} /> Select</span>
                            <span className="flex items-center gap-1.5"><CommandIcon size={10} /> K close</span>
                        </div>
                        <span>v2.4.0-SLATE</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
