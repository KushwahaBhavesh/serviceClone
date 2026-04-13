"use client";

import React, { useRef } from "react";
import { ArrowRight, Sparkles, Hammer, PaintBucket, TreePine, Droplets, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const services = [
    { title: "Deep Cleaning", icon: <Sparkles size={28} />, desc: "Eco-friendly premium cleaning for every corner of your home.", color: "text-primary", bg: "bg-primary/10" },
    { title: "Smart Repairs", icon: <Hammer size={28} />, desc: "Expert technicians for all your appliances and fixtures.", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Home Interior", icon: <PaintBucket size={28} />, desc: "Refresh your space with professional painting and design.", color: "text-primary", bg: "bg-primary/10" },
    { title: "Garden Care", icon: <TreePine size={28} />, desc: "Complete landscaping and maintenance for your outdoor oasis.", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Plumbing", icon: <Droplets size={28} />, desc: "Reliable solutions for all your water and drainage needs.", color: "text-primary", bg: "bg-primary/10" },
    { title: "Security", icon: <ShieldCheck size={28} />, desc: "Advanced home security installations for peace of mind.", color: "text-emerald-600", bg: "bg-emerald-50" }
];

export const ServicesGrid = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from(".service-card", {
            opacity: 0,
            y: 40,
            scale: 0.95,
            stagger: 0.1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: container.current,
                start: "top 75%",
            }
        });
    }, { scope: container });

    return (
        <section id="services" ref={container} className="py-32 bg-background px-6 w-full border-y border-surface">
            <div className="max-w-7xl mx-auto space-y-20">
                <div className="text-center space-y-6">
                    <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tight">Our Premium Services</h2>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto font-medium leading-relaxed">
                        From deep cleaning to electrical repairs, our certified professionals handle everything with precision and care.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, i) => (
                        <div key={i} className="service-card bg-white p-10 rounded-3xl shadow-sm border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 cursor-pointer group">
                            <div className={`w-16 h-16 ${service.bg} ${service.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                {service.icon}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{service.title}</h3>
                            <p className="text-text-secondary font-medium leading-relaxed mb-8">{service.desc}</p>
                            <div className="flex items-center text-primary font-bold text-lg group-hover:gap-3 transition-all duration-300">
                                Explore <ArrowRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-8">
                    <button className="btn-primary px-12 py-5 text-lg shadow-xl shadow-primary/10">
                        View All Services
                    </button>
                </div>
            </div>
        </section>
    );
};
