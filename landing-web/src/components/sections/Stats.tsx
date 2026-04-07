import React from "react";
import { CheckCircle2, Star, Clock, Users } from "lucide-react";

export const Stats = () => {
    return (
        <section className="py-20 bg-primary/5 border-y border-primary/10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                    { value: "50k+", label: "Tasks Done", icon: <CheckCircle2 size={20} className="mx-auto mb-2 text-primary" /> },
                    { value: "10k+", label: "Happy Clients", icon: <Users size={20} className="mx-auto mb-2 text-primary" /> },
                    { value: "4.9/5", label: "Average Rating", icon: <Star size={20} className="mx-auto mb-2 text-primary" /> },
                    { value: "15min", label: "Response Time", icon: <Clock size={20} className="mx-auto mb-2 text-primary" /> }
                ].map((stat, i) => (
                    <div key={i}>
                        {stat.icon}
                        <p className="text-3xl font-bold mb-1">{stat.value}</p>
                        <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
