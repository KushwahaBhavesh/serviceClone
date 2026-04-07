'use client';

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function Breadcrumbs() {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(segment => segment !== '');

    return (
        <nav className="flex items-center space-x-1 text-xs font-medium text-muted-foreground mb-6">
            <Link
                href="/analytics"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
                <Home size={12} />
                <span>Home</span>
            </Link>

            {pathSegments.map((segment, index) => {
                const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

                return (
                    <React.Fragment key={href}>
                        <ChevronRight size={12} className="text-muted-foreground/50" />
                        {isLast ? (
                            <span className="text-foreground font-semibold">{label}</span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-foreground transition-colors"
                            >
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
