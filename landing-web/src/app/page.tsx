import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { FeaturedServices } from "@/components/sections/FeaturedServices";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Stats } from "@/components/sections/Stats";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";

export default function LandingPage() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <Hero />
            <ServicesGrid />
            <FeaturedServices />
            <WhyChooseUs />
            <Stats />
            <Testimonials />
            <CTA />
            <Footer />
        </main>
    );
}
