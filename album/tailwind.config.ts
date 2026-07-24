import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        mist: "var(--mist)",
        moss: "var(--moss)",
        ember: "var(--ember)",
        line: "var(--line)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pinPop: {
          "0%": { transform: "scale(0.92)" },
          "60%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.22,1,0.36,1) forwards",
        fade: "fade 0.5s ease-out forwards",
        "pin-pop": "pinPop 0.45s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
