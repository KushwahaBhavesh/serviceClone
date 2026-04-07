import React from "react";

export const Footer = () => {
    return (
        <footer className="py-20 border-t border-secondary px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-2 space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                        <span className="font-bold text-xl tracking-tight">ServeIQ</span>
                    </div>
                    <p className="text-text-secondary max-w-xs leading-relaxed">Redefining modern home services for a premium lifestyle. Trusted expertise at your convenience.</p>
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 rounded-full border border-secondary flex items-center justify-center hover:bg-secondary cursor-pointer transition-colors" />)}
                    </div>
                </div>
                <div>
                    <h5 className="font-bold mb-6">Company</h5>
                    <ul className="space-y-4 text-text-secondary text-sm">
                        <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Partner with Us</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Trust & Safety</a></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold mb-6">Support</h5>
                    <ul className="space-y-4 text-text-secondary text-sm">
                        <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto pt-10 border-t border-secondary flex flex-col md:row items-center justify-between gap-4 text-xs text-text-secondary font-medium uppercase tracking-widest">
                <p>© 2026 ServeIQ Inc. All rights reserved.</p>
                <div className="flex gap-8">
                    <span>Premium Home Care</span>
                    <span>Lifestyle Integrated</span>
                    <span>Safety First</span>
                </div>
            </div>
        </footer>
    );
};
