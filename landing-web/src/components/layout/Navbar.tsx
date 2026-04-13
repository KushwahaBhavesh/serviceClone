"use client";
import React, { useState, useEffect } from "react";
import { ArrowRight, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-surface/90 backdrop-blur-md shadow-sm py-4 border-b border-white/10" : "bg-transparent py-6"}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">S</div>
                    <span className="font-bold text-2xl tracking-tight text-text-primary">ServeIQ</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider text-text-primary">
                    <a href="#services" className="hover:text-primary transition-colors">Services</a>
                    <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
                    <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary text-text-primary hover:bg-primary/10 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="hidden sm:block text-sm font-bold px-4 py-2 text-text-primary hover:text-primary transition-colors">Login</button>
                    <button className="btn-primary flex items-center gap-2 whitespace-nowrap">Book Now <ArrowRight size={18} /></button>
                </div>
            </div>
        </nav>
    );
};
