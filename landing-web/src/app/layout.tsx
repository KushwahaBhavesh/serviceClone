import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
    weight: ["400", "600", "700"],
    subsets: ["latin"],
    variable: "--font-poppins"
});

export const metadata: Metadata = {
    title: "ServeIQ | Premium Home Services at Your Doorstep",
    description: "Book professional cleaning, plumbing, repair, and other home services with trust and ease. Modern solutions for a premium home lifestyle.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
            <body className="bg-background text-text-primary font-sans antialiased">
                {children}
            </body>
        </html>
    );
}
