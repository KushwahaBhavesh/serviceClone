'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <div className="text-center max-w-md">
                <div className="h-12 w-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-rose-600 font-black text-xl">!</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                <p className="text-sm text-slate-500 mb-6">
                    {error.message || 'An unexpected error occurred.'}
                </p>
                <button
                    onClick={reset}
                    className="px-6 py-2.5 bg-[#FF6B00] text-white text-sm font-bold rounded-xl hover:bg-[#e56000] transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
