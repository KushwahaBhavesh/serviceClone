'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendType?: 'success' | 'warning' | 'default' | 'live';
    subtitle?: string;
    color?: string;
    bg?: string;
    onClick?: () => void;
}

export function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    trendType = 'success',
    subtitle,
    color = 'text-primary',
    bg = 'bg-primary/5',
    onClick,
}: StatCardProps) {
    return (
        <Card
            className={cn(
                'hover:border-primary/20 transition-all',
                onClick && 'cursor-pointer hover:shadow-md'
            )}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', bg, color)}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <Badge
                        variant={trendType === 'live' ? 'default' : trendType === 'warning' ? 'warning' : 'success'}
                        className="text-[10px] font-bold px-1.5 py-0"
                    >
                        {trend}
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
                {subtitle && (
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}
