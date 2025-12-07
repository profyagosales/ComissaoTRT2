import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tjaa: {
          red: "#E30613",
          "red-dark": "#B3040F",
          black: "#000000",
          "surface-dark": "#0A0A0A",
          "surface-darker": "#050505",
          "surface-light": "#F5F5F5",
        },
        border: {
          subtle: "#333333",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        heading: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        // add /public/patterns/calcada-sp.svg later to enable this
        calcada: "url('/patterns/calcada-sp.svg')",
      },
      boxShadow: {
        hero: "0 24px 80px rgba(0,0,0,0.7)",
      },
    },
  },
  plugins: [],
};

export default config;
