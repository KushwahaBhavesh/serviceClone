import React from "react";
import { ArrowRight } from "lucide-react";

const features = [
    {
        title: "Deep Cleaning with a Personal Touch",
        desc: "Our premium cleaning service goes beyond the surface. We use eco-friendly products and meticulous techniques to ensure every corner of your home feels refreshed and healthy.",
        accent: "Lifestyle focused",
        image: "IH-1"
    },
    {
        title: "Certified Experts for Every Repair",
        desc: "Don't let home maintenance stress you out. Professional, background-verified technicians ready to handle electrical, plumbing, and appliance fixes with guaranteed quality.",
        accent: "Trust first",
        image: "IH-2"
    }
];

export const FeaturedServices = () => {
    return (
        <section className="py-20 px-6 w-full bg-secondary/30">
            <div className="max-w-7xl mx-auto space-y-32">
                {features.map((feature, i) => (
                    <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}>
                        <div className="flex-1 space-y-6">
                            <span className="text-primary font-bold tracking-widest uppercase text-xs">{feature.accent}</span>
                            <h2 className="text-4xl font-bold leading-tight">{feature.title}</h2>
                            <p className="text-lg text-text-secondary leading-relaxed">{feature.desc}</p>
                            <button className="flex items-center gap-2 text-primary font-bold group">
                                View Details <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="aspect-[16/10] bg-secondary rounded-2xl overflow-hidden shadow-xl border border-secondary relative">
                                <img
                                    src={i === 0 ? "/home/bitrix116/.gemini/antigravity/brain/bc26d7e8-9cfa-46a6-803a-b646ec8530ef/home_cleaning_service_1775543994947.png" : "/home/bitrix116/.gemini/antigravity/brain/bc26d7e8-9cfa-46a6-803a-b646ec8530ef/home_repair_service_1775544013284.png"}
                                    alt={feature.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
