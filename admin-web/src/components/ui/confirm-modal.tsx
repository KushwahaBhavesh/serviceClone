'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    isLoading?: boolean;
    /** If set, user must type this string to enable confirm */
    typedConfirmation?: string;
    /** Optional textarea for a note/reason */
    showReasonInput?: boolean;
    reasonLabel?: string;
    onReasonChange?: (reason: string) => void;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    isLoading = false,
    typedConfirmation,
    showReasonInput = false,
    reasonLabel = 'Reason',
    onReasonChange,
}: ConfirmModalProps) {
    const [typedValue, setTypedValue] = useState('');
    const [reason, setReason] = useState('');

    const isConfirmEnabled = typedConfirmation
        ? typedValue === typedConfirmation
        : true;

    const handleClose = () => {
        if (isLoading) return;
        setTypedValue('');
        setReason('');
        onClose();
    };

    const handleConfirm = () => {
        onConfirm();
    };

    const variantStyles = {
        danger: {
            icon: 'bg-destructive/10 text-destructive',
            button: 'bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20',
        },
        warning: {
            icon: 'bg-amber-50 text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20',
        },
        default: {
            icon: 'bg-primary/10 text-primary',
            button: 'shadow-lg shadow-primary/20',
        },
    };

    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10"
                    >
                        <div className="p-6 space-y-5">
                            {/* Icon + Title */}
                            <div className="flex items-start gap-4">
                                <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0', styles.icon)}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-foreground">{title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 text-muted-foreground flex-shrink-0">
                                    <X size={16} />
                                </Button>
                            </div>

                            {/* Typed confirmation */}
                            {typedConfirmation && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        Type <span className="text-destructive font-bold">{typedConfirmation}</span> to confirm:
                                    </p>
                                    <Input
                                        value={typedValue}
                                        onChange={(e) => setTypedValue(e.target.value)}
                                        placeholder={typedConfirmation}
                                        className="h-10 font-mono text-sm"
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Optional reason input */}
                            {showReasonInput && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {reasonLabel}
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => {
                                            setReason(e.target.value);
                                            onReasonChange?.(e.target.value);
                                        }}
                                        placeholder={`Enter ${reasonLabel.toLowerCase()}...`}
                                        className="w-full bg-muted/30 border border-border rounded-xl p-3 text-sm font-medium text-foreground focus:border-primary/50 focus:ring-0 placeholder:text-muted-foreground transition-all min-h-[80px] resize-none"
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-11 rounded-xl"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    className={cn('flex-1 h-11 rounded-xl', styles.button)}
                                    onClick={handleConfirm}
                                    disabled={!isConfirmEnabled || isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                    ) : null}
                                    {confirmLabel}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
