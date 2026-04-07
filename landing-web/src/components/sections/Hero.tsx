import React from "react";
import Image from "next/image";
import { ArrowRight, Star, ShieldCheck } from "lucide-react";

export const Hero = () => {
    return (
        <div className="bg-background w-full">
            <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Trusted by 10,000+ Households
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                            A Premium Home <br />
                            <span className="text-primary italic">Starts with Care</span>
                        </h1>
                        <p className="text-xl text-text-secondary leading-relaxed max-w-lg">
                            Experience the next generation of home services. Professional cleaning, repairs, and maintenance tailored to your lifestyle.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <button className="btn-primary text-lg w-full sm:w-auto px-8 py-4">Explore Services</button>
                            <div className="flex items-center gap-3 px-4 py-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-[10px] overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs">
                                    <div className="flex text-yellow-500">
                                        {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={10} fill="currentColor" />)}
                                    </div>
                                    <p className="font-semibold">4.9/5 Average Rating</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-secondary shadow-2xl relative">
                            <img
                                src="/home/bitrix116/.gemini/antigravity/brain/bc26d7e8-9cfa-46a6-803a-b646ec8530ef/premium_home_hero_1775543972262.png"
                                alt="Premium Home Living"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl space-y-4 max-w-xs transition-transform hover:scale-105">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <p className="font-bold">Fully Insured</p>
                                    <p className="text-xs text-text-secondary">Peace of mind guaranteed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
