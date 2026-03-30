import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <div className="text-center max-w-md">
                <p className="text-7xl font-black text-slate-200 mb-4">404</p>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Page not found</h2>
                <p className="text-sm text-slate-500 mb-6">
                    The page you're looking for doesn't exist.
                </p>
                <Link
                    href="/analytics"
                    className="inline-block px-6 py-2.5 bg-[#FF6B00] text-white text-sm font-bold rounded-xl hover:bg-[#e56000] transition-colors"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
