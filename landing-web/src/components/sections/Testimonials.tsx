import React from "react";
import { Star } from "lucide-react";

const reviews = [
    { name: "Sarah J.", role: "Busy Professional", text: "ServeIQ has been a lifesaver. Their deep cleaning service is truly premium. I don't have to worry about a thing anymore." },
    { name: "David M.", role: "Homeowner", text: "Finally, a service that understands quality. The repair was quick, professional, and the pricing was exactly what they quoted." },
    { name: "Emma R.", role: "Interior Designer", text: "I recommend ServeIQ to all my clients. Their attention to detail and professionalism is unmatched in the industry." }
];

export const Testimonials = () => {
    return (
        <section id="testimonials" className="py-20 px-6 bg-white w-full border-b border-secondary/30 overflow-hidden">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-bold">What our clients are saying</h2>
                    <p className="text-text-secondary max-w-xl mx-auto">Join thousands of homeowners who have upgraded their living experience with ServeIQ.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {reviews.map((test, i) => (
                        <div key={i} className="bg-background/50 p-8 rounded-2xl border border-secondary relative hover:border-primary/20 transition-colors">
                            <div className="text-primary mb-4 flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                            </div>
                            <p className="text-lg italic leading-relaxed mb-8 text-text-primary">"{test.text}"</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-secondary rounded-full overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${test.name}`} alt={test.name} />
                                </div>
                                <div>
                                    <p className="font-bold">{test.name}</p>
                                    <p className="text-xs text-text-secondary">{test.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
