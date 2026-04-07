import React from "react";
import { ArrowRight } from "lucide-react";

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-secondary/50">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
                    <span className="font-bold text-2xl tracking-tight">ServeIQ</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <a href="#services" className="hover:text-primary transition-colors">Services</a>
                    <a href="#why-us" className="hover:text-primary transition-colors">Why Choose Us</a>
                    <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-sm font-medium px-4 py-2 hover:bg-secondary rounded-lg transition-colors">Login</button>
                    <button className="btn-primary flex items-center gap-2">Book Now <ArrowRight size={18} /></button>
                </div>
            </div>
        </nav>
    );
};
