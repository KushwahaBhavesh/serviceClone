"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ArrowRight, Star, ShieldCheck, Play, Download } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const Hero = () => {
    const container = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const mockRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });

        tl.from(".hero-badge", { opacity: 0, y: 20, duration: 0.6 })
            .from(".hero-title span", { opacity: 0, y: 40, stagger: 0.2 }, "-=0.3")
            .from(".hero-desc", { opacity: 0, y: 20 }, "-=0.5")
            .from(".hero-cta", { opacity: 0, scale: 0.9, stagger: 0.15 }, "-=0.5")
            .from(".hero-stats", { opacity: 0, x: -20 }, "-=0.5")
            .from(".hero-mockup", { opacity: 0, x: 100, rotate: 5, duration: 1.2 }, "-=1");

        // Parallax effect
        gsap.to(".hero-float", {
            y: -50,
            ease: "none",
            scrollTrigger: {
                trigger: container.current,
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
    }, { scope: container });

    return (
        <div ref={container} className="relative bg-background w-full overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-bl-[100px] -z-10" />
            <div className="hero-float absolute top-40 left-10 w-12 h-12 bg-primary/20 rounded-full blur-xl opacity-50" />
            <div className="hero-float absolute bottom-40 right-1/2 w-20 h-20 bg-emerald-200 rounded-full blur-2xl opacity-40" />

            <section className="pt-40 pb-24 px-6 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div ref={textRef} className="space-y-8 z-10">
                        <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-sm font-bold border border-primary/10 uppercase tracking-wider">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Trusted by 10,000+ Households
                        </div>

                        <h1 className="hero-title text-6xl lg:text-8xl font-black leading-none tracking-tight text-slate-900">
                            <span className="block">Book Trusted</span>
                            <span className="block text-primary">Home Services</span>
                            <span className="block">in Minutes.</span>
                        </h1>

                        <p className="hero-desc text-xl text-text-secondary leading-relaxed max-w-xl font-medium">
                            Experience convenience like never before. From professional cleaning to repairs, get top-rated pros at your doorstep instantly.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-5 pt-4">
                            <button className="hero-cta btn-primary text-lg w-full sm:w-auto px-10 py-5 shadow-xl shadow-primary/20 hover:shadow-primary/30">
                                Book Now
                            </button>
                            <button className="hero-cta flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 rounded-xl font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center">
                                <Download size={20} className="text-primary" /> Download App
                            </button>
                        </div>

                        <div className="hero-stats flex items-center gap-6 pt-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-12 h-12 rounded-2xl border-4 border-white bg-slate-100 overflow-hidden shadow-lg">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                <div className="w-12 h-12 rounded-2xl border-4 border-white bg-primary flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                    +2k
                                </div>
                            </div>
                            <div className="h-10 w-[1px] bg-slate-200 mx-2" />
                            <div>
                                <div className="flex text-amber-400 mb-1">
                                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="currentColor" stroke="none" />)}
                                </div>
                                <p className="text-sm font-bold text-slate-900">4.9/5 Happy Reviews</p>
                            </div>
                        </div>
                    </div>

                    <div ref={mockRef} className="relative hero-mockup">
                        {/* Abstract Shape Behind Image */}
                        <div className="absolute -inset-10 bg-gradient-to-tr from-primary/10 to-primary/5 rounded-[40px] blur-3xl -z-10 animate-pulse" />

                        <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl border-8 border-white bg-slate-200">
                            <img
                                src="https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=1000"
                                alt="Professional Home Services"
                                className="w-full h-full object-cover"
                            />
                            {/* Floating Card */}
                            <div className="absolute top-10 right-10 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/50 space-y-4 max-w-[200px] animate-bounce-slow">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 leading-tight">Verified Pros</p>
                                    <p className="text-xs text-text-secondary font-semibold">100% Background Checked</p>
                                </div>
                            </div>
                        </div>

                        {/* App Experience Overlay */}
                        <div className="absolute -bottom-10 -left-10 bg-primary p-8 rounded-[32px] shadow-2xl text-white space-y-4 max-w-[240px]">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Play size={24} fill="currentColor" />
                            </div>
                            <h4 className="text-xl font-bold leading-tight">See how it works</h4>
                            <p className="text-white/80 text-sm font-medium">Watch 30s video</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
