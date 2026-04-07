import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#F7F5F2",
                surface: "#FFFFFF",
                primary: {
                    DEFAULT: "#F97316",
                    dark: "#EA580C",
                    light: "#FDBA74",
                },
                secondary: "#EDEDED",
                text: {
                    primary: "#1F1F1F",
                    secondary: "#6B7280",
                },
            },
            fontFamily: {
                sans: ["Inter", "Poppins", "sans-serif"],
            },
            borderRadius: {
                "xl": "1rem",
                "2xl": "1.5rem",
            },
        },
    },
    plugins: [],
};
export default config;
