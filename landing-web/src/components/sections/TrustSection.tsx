"use client";

import React, { useRef } from "react";
import { ShieldCheck, CircleDollarSign, Clock, Headset } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export const TrustSection = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from(".trust-item", {
            opacity: 0,
            scale: 0.8,
            stagger: 0.2,
            duration: 0.8,
            ease: "back.out(2)",
            scrollTrigger: {
                trigger: container.current,
                start: "top 85%",
            }
        });
    }, { scope: container });

    const trustItems = [
        { icon: <ShieldCheck size={40} />, title: "Verified Pros", desc: "100% Background checked and trained staff." },
        { icon: <CircleDollarSign size={40} />, title: "Transparent Pricing", desc: "No hidden costs. Pay exactly what you see." },
        { icon: <Clock size={40} />, title: "On-Time Service", desc: "We value your time. Guaranteed punctuality." },
        { icon: <Headset size={40} />, title: "24/7 Support", desc: "Instant assistance whenever you need us." }
    ];

    return (
        <section ref={container} className="py-24 bg-white px-6 w-full">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {trustItems.map((item, i) => (
                        <div key={i} className="trust-item flex flex-col items-center text-center p-8 rounded-3xl bg-surface border border-white/5 hover:bg-surface/80 hover:shadow-xl transition-all duration-300">
                            <div className="w-16 h-16 bg-white text-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                {item.icon}
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">{item.title}</h4>
                            <p className="text-sm text-text-secondary font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
