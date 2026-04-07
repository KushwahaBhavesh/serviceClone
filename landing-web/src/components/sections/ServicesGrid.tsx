import React from "react";
import { ArrowRight } from "lucide-react";

const services = [
    { title: "Deep Cleaning", icon: "✨", desc: "Eco-friendly premium cleaning for every corner of your home." },
    { title: "Smart Repairs", icon: "🛠️", desc: "Expert technicians for all your appliances and fixtures." },
    { title: "Home Interior", icon: "🎨", desc: "Refresh your space with professional painting and design." },
    { title: "Garden Care", icon: "🌿", desc: "Complete landscaping and maintenance for your outdoor oasis." },
    { title: "Plumbing", icon: "💧", desc: "Reliable solutions for all your water and drainage needs." },
    { title: "Pest Control", icon: "🛡️", desc: "Safe, effective treatments for a pest-free environment." }
];

export const ServicesGrid = () => {
    return (
        <section id="services" className="py-20 bg-white px-6 w-full border-y border-secondary/30">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-bold">Expert Services at your Fingertips</h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">From deep cleaning to electrical repairs, our certified professionals handle everything with precision.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, i) => (
                        <div key={i} className="card-premium group cursor-pointer hover:border-primary/30">
                            <div className="w-14 h-14 bg-background rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">{service.icon}</div>
                            <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                            <p className="text-text-secondary text-sm leading-relaxed mb-6">{service.desc}</p>
                            <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                                Learn More <ArrowRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
