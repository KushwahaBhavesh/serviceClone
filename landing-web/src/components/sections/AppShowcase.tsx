"use client";

import React, { useRef } from "react";
import { Apple, PlayCircle, CheckCircle2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export const AppShowcase = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from(".app-text", {
            opacity: 0,
            x: -50,
            duration: 1,
            scrollTrigger: {
                trigger: container.current,
                start: "top 70%",
            }
        });

        gsap.from(".app-screen", {
            opacity: 0,
            x: 100,
            stagger: 0.2,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: container.current,
                start: "top 60%",
            }
        });
    }, { scope: container });

    return (
        <section ref={container} className="py-32 px-6 bg-primary overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
                <div className="app-text text-white space-y-8">
                    <h2 className="text-5xl lg:text-7xl font-black leading-tight">Your Home, <br /> Just a Tap Away.</h2>
                    <p className="text-xl text-white/80 font-medium leading-relaxed max-w-lg">
                        Download our mobile app to track bookings in real-time, get instant updates, and manage all your home needs on the go.
                    </p>

                    <ul className="space-y-4">
                        {["Real-time tracking", "Instant notifications", "Secure payments", "Exclusive offers"].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-white font-bold text-lg">
                                <CheckCircle2 className="text-emerald-400" size={24} />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-wrap gap-4 pt-6">
                        <button className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-100 transition-all shadow-2xl">
                            <Apple size={24} /> App Store
                        </button>
                        <button className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-2xl">
                            <PlayCircle size={24} /> Google Play
                        </button>
                    </div>
                </div>

                <div className="relative flex justify-center lg:justify-end gap-6">
                    <div className="app-screen w-[280px] aspect-[9/19] bg-slate-100 rounded-[40px] border-[12px] border-slate-900 shadow-2xl overflow-hidden mt-20 hidden sm:block">
                        <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                    </div>
                    <div className="app-screen w-[280px] aspect-[9/19] bg-slate-100 rounded-[40px] border-[12px] border-slate-900 shadow-2xl overflow-hidden relative z-10">
                        <img src="https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </section>
    );
};
