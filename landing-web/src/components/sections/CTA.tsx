"use client";

import React, { useRef } from "react";
import { ArrowRight, Gift } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export const CTA = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from(".cta-content", {
            opacity: 0,
            y: 40,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: container.current,
                start: "top 80%",
            }
        });
    }, { scope: container });

    return (
        <section id="cta" ref={container} className="py-32 px-6 bg-slate-900 w-full text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-0" />

            <div className="max-w-5xl mx-auto text-center relative z-10 cta-content">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/20 text-primary rounded-full text-sm font-black border border-primary/30 mb-10 uppercase tracking-widest animate-pulse">
                    <Gift size={20} /> Limited Time Offer
                </div>

                <h2 className="text-5xl md:text-8xl font-black leading-none tracking-tight mb-10">
                    Your Dream Home <br /> <span className="text-primary italic">Just 1 Click Away</span>
                </h2>

                <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
                    Book your first service today and experience the ServeIQ difference. New users get <span className="text-white font-black underline underline-offset-8 decoration-primary decoration-4">20% OFF</span> their first booking.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                    <button className="btn-primary text-2xl px-14 py-6 shadow-primary">
                        Book Service Now
                    </button>
                    <button className="px-14 py-6 rounded-2xl font-black text-2xl border-2 border-slate-700 hover:bg-slate-800 transition-all flex items-center gap-3">
                        View Rates <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </section>
    );
};
