'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    return (
        <nav className="flex items-center space-x-2 text-xs font-medium text-muted-foreground mb-6">
            <Link
                href="/analytics"
                className="flex items-center hover:text-primary transition-colors"
            >
                <Home size={14} className="mr-1.5" />
                Admin
            </Link>

            {segments.map((segment, index) => {
                const href = `/${segments.slice(0, index + 1).join('/')}`;
                const isLast = index === segments.length - 1;
                const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

                return (
                    <div key={href} className="flex items-center space-x-2">
                        <ChevronRight size={14} className="text-muted-foreground/40" />
                        {isLast ? (
                            <span className="text-foreground font-semibold">{label}</span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-primary transition-colors"
                            >
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
