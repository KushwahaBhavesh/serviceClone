import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { TrustSection } from "@/components/sections/TrustSection";
import { AppShowcase } from "@/components/sections/AppShowcase";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";

export default function LandingPage() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <Hero />
            <HowItWorks />
            <ServicesGrid />
            <TrustSection />
            <Testimonials />
            <AppShowcase />
            <CTA />
            <Footer />
        </main>
    );
}
