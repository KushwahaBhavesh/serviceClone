import React from "react";
import { CheckCircle2 } from "lucide-react";

export const WhyChooseUs = () => {
    return (
        <section id="why-us" className="py-20 px-6 w-full bg-white border-b border-secondary/30">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 relative">
                    <div className="aspect-square rounded-2xl bg-secondary relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                    </div>
                </div>
                <div className="order-1 lg:order-2 space-y-8">
                    <h2 className="text-4xl font-bold leading-tight">Elevating Global Standards for Home Care</h2>
                    <p className="text-lg text-text-secondary">We don't just fix things; we enhance your lifestyle through meticulous attention to detail and premium service delivery.</p>
                    <div className="space-y-6">
                        {[
                            { title: "Certified Professionals", desc: "Every background-verified partner undergoes rigorous training.", icon: <CheckCircle2 className="text-primary" /> },
                            { title: "Transparent Pricing", desc: "Know the cost before we start. No hidden fees, ever.", icon: <CheckCircle2 className="text-primary" /> },
                            { title: "Lifestyle Integration", desc: "Scheduling that adapts to your busy life, not the other way around.", icon: <CheckCircle2 className="text-primary" /> }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="pt-1">{item.icon}</div>
                                <div>
                                    <h4 className="font-bold mb-1">{item.title}</h4>
                                    <p className="text-text-secondary text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary px-8">Get Started Today</button>
                </div>
            </div>
        </section>
    );
};
