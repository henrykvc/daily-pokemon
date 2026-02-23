import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["'Press Start 2P'", "monospace"],
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "fade-out": "fadeOut 0.5s ease-out forwards",
        confetti: "confetti 1.5s ease-out forwards",
        stamp: "stamp 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards",
      },
      keyframes: {
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0", display: "none" },
        },
        stamp: {
          "0%": { transform: "scale(3)", opacity: "0" },
          "50%": { transform: "scale(0.9)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
