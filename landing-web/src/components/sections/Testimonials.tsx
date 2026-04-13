"use client";

import React, { useRef } from "react";
import { Star, Quote } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const reviews = [
    { name: "Sarah J.", role: "Busy Professional", text: "ServeIQ has been a lifesaver. Their deep cleaning service is truly premium. I don't have to worry about my home anymore.", img: "11" },
    { name: "David M.", role: "Tech Lead", text: "Finally, a service that understands quality. The repair was quick, professional, and the transparent pricing is a game-changer.", img: "12" },
    { name: "Emma R.", role: "Homeowner", text: "I recommend ServeIQ to everyone. Their attention to detail and professional staff is unmatched in the industry today.", img: "13" }
];

export const Testimonials = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from(".testimonial-card", {
            opacity: 0,
            y: 40,
            stagger: 0.2,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: container.current,
                start: "top 75%",
            }
        });
    }, { scope: container });

    return (
        <section id="testimonials" ref={container} className="py-32 px-6 bg-background w-full overflow-hidden border-y border-surface">
            <div className="max-w-7xl mx-auto space-y-24">
                <div className="text-center space-y-6">
                    <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tight">Voices of Trust</h2>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto font-medium leading-relaxed">
                        Join thousands of satisfied homeowners who have upgraded their living experience with our premium services.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    {reviews.map((test, i) => (
                        <div key={i} className="testimonial-card bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 relative group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
                            <Quote className="absolute top-8 right-10 text-primary opacity-20 group-hover:opacity-40 transition-opacity" size={80} />
                            <div className="text-amber-400 mb-8 flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} fill="currentColor" stroke="none" />)}
                            </div>
                            <p className="text-xl font-medium leading-relaxed mb-10 text-slate-800">"{test.text}"</p>
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 overflow-hidden shadow-inner">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${test.img}`} alt={test.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-lg">{test.name}</p>
                                    <p className="text-sm text-text-secondary font-bold uppercase tracking-wider">{test.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
