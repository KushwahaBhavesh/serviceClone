import { LucideIcon, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon: Icon = PackageOpen,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300",
            className
        )}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4 ring-8 ring-muted/20">
                <Icon className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-[280px] mb-6 font-medium">
                    {description}
                </p>
            )}
            {action && (
                <Button
                    variant="default"
                    onClick={action.onClick}
                    className="shadow-md hover:shadow-lg transition-all"
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}
