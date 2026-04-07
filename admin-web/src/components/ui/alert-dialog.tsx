'use client';

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function AlertDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = 'danger',
    isLoading = false,
}: AlertDialogProps) {

    // Prevent scroll when open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const variantStyles = {
        danger: {
            icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
            bg: "bg-destructive/10",
            button: "destructive" as const
        },
        warning: {
            icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
            bg: "bg-amber-500/10",
            button: "default" as const
        },
        info: {
            icon: <AlertTriangle className="h-6 w-6 text-blue-500" />,
            bg: "bg-blue-500/10",
            button: "default" as const
        }
    };

    const currentVariant = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl overflow-hidden p-6"
                    >
                        <div className="flex items-start gap-4">
                            <div className={cn("flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center", currentVariant.bg)}>
                                {currentVariant.icon}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-foreground leading-none mb-2">{title}</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={isLoading}
                                className="font-semibold"
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                variant={currentVariant.button}
                                onClick={onConfirm}
                                isLoading={isLoading}
                                disabled={isLoading}
                                className="px-6 font-bold shadow-lg shadow-destructive/20"
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
