import React from "react";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="bg-secondary/30 pt-20 pb-10 border-t border-secondary px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">S</div>
                        <span className="font-bold text-2xl tracking-tight">ServeIQ</span>
                    </div>
                    <p className="text-text-secondary max-w-sm leading-relaxed text-lg">
                        Book trusted professionals for cleaning, repairs, and more. We bring peace of mind to your doorstep.
                    </p>
                    <div className="flex gap-4">
                        {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                            <a key={i} href="#" className="w-12 h-12 rounded-xl border border-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary cursor-pointer transition-all duration-300">
                                <Icon size={20} />
                            </a>
                        ))}
                    </div>
                </div>
                <div>
                    <h5 className="font-bold text-lg mb-6">Explore</h5>
                    <ul className="space-y-4 text-text-secondary">
                        <li><a href="#services" className="hover:text-primary transition-colors">All Services</a></li>
                        <li><a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Our Professionals</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Safety Standards</a></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold text-lg mb-6">Contact Us</h5>
                    <ul className="space-y-4 text-text-secondary">
                        <li className="flex items-center gap-3"><Phone size={18} className="text-primary" /> <span>+1 (800) SERVE-IQ</span></li>
                        <li className="flex items-center gap-3"><Mail size={18} className="text-primary" /> <span>hello@serve-iq.com</span></li>
                        <li className="flex items-center gap-3"><MapPin size={18} className="text-primary" /> <span>San Francisco, CA</span></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto pt-10 border-t border-secondary flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-text-secondary">
                <p>© 2026 ServeIQ Inc. All rights reserved.</p>
                <div className="flex gap-8 font-semibold">
                    <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};
