import React from "react";

export const CTA = () => {
    return (
        <section id="cta" className="py-20 px-6 bg-primary w-full text-white">
            <div className="max-w-4xl mx-auto text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-light/20 rounded-full -ml-32 -mb-32 blur-3xl opacity-30" />

                <div className="relative space-y-8">
                    <h2 className="text-4xl md:text-6xl font-bold leading-tight">Ready to elevate your <br /> home living?</h2>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto">Book your first service today and experience the ServeIQ difference. New users get 20% off their first booking.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button className="bg-white text-primary text-xl px-12 py-5 rounded-xl font-bold hover:bg-secondary transition-colors w-full sm:w-auto shadow-xl">Book Service Now</button>
                        <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-xl px-12 py-5 rounded-xl font-bold hover:bg-white/20 transition-colors w-full sm:w-auto">View Pricing</button>
                    </div>
                </div>
            </div>
        </section>
    );
};
