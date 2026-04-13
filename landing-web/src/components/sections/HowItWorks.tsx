"use client";

import React, { useRef } from "react";
import { Search, Calendar, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export const HowItWorks = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from(".step-card", {
            opacity: 0,
            y: 50,
            stagger: 0.3,
            duration: 0.8,
            ease: "back.out(1.7)",
            scrollTrigger: {
                trigger: container.current,
                start: "top 80%",
            }
        });

        gsap.from(".connect-line", {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1.5,
            stagger: 0.5,
            ease: "power2.inOut",
            scrollTrigger: {
                trigger: container.current,
                start: "top 70%",
            }
        });
    }, { scope: container });

    const steps = [
        {
            icon: <Search className="text-white" size={32} />,
            title: "Choose Service",
            desc: "Select from 50+ home services like cleaning, plumbing, or salon treatments.",
            color: "bg-primary",
            shadow: "shadow-primary/20"
        },
        {
            icon: <Calendar className="text-white" size={32} />,
            title: "Select Time",
            desc: "Pick a date and time slot that fits your busy schedule perfectly.",
            color: "bg-emerald-500",
            shadow: "shadow-emerald-200"
        },
        {
            icon: <Sparkles className="text-white" size={32} />,
            title: "Relax",
            desc: "Our verified professional arrives and does the magic while you chill.",
            color: "bg-amber-500",
            shadow: "shadow-amber-200"
        }
    ];

    return (
        <section id="how-it-works" ref={container} className="py-32 px-6 bg-background overflow-hidden border-y border-surface">
            <div className="max-w-7xl mx-auto text-center mb-24">
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6">How it Works</h2>
                <p className="text-lg text-text-secondary font-medium max-w-2xl mx-auto leading-relaxed">
                    Booking a premium home service is now easier than ordering coffee. Just three simple steps to a better home.
                </p>
            </div>

            <div className="max-w-7xl mx-auto relative">
                {/* Horizontal Connection Lines (Desktop) */}
                <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[2px] bg-surface -translate-y-1/2 z-0" />

                <div className="grid md:grid-cols-3 gap-12 relative z-10">
                    {steps.map((step, index) => (
                        <div key={index} className="step-card flex flex-col items-center text-center group">
                            <div className={`w-24 h-24 ${step.color} rounded-[32px] flex items-center justify-center mb-10 shadow-2xl ${step.shadow} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative`}>
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 font-black text-lg shadow-md">
                                    {index + 1}
                                </div>
                                {step.icon}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">{step.title}</h3>
                            <p className="text-text-secondary font-medium leading-relaxed px-4">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
