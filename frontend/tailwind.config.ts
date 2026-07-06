import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
        orbitron: ["Orbitron", "monospace"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        accent: "#00e87a",
        gold: "#f5a32a",
        danger: "#ff3b5c",
        "blue-accent": "#4d9fff",
        surface: "rgba(255,255,255,0.04)",
        "surface-border": "rgba(255,255,255,0.08)",
        "bg-deep": "#050b12",
        "bg-mid": "#0a1628",
        "text-primary": "#f0f4f8",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "score-pop": "scorePop 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "live-pulse": "livePulse 1.5s ease-in-out infinite",
        "timer-pulse": "timerPulse 0.6s ease-in-out infinite",
        "glow-burst": "glowBurst 0.5s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        scorePop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.4)", filter: "drop-shadow(0 0 20px #00e87a)" },
          "100%": { transform: "scale(1)" },
        },
        slideIn: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        livePulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
        timerPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        glowBurst: {
          "0%": { boxShadow: "0 0 0 0 rgba(0,232,122,0.8)" },
          "50%": { boxShadow: "0 0 40px 20px rgba(0,232,122,0.4)" },
          "100%": { boxShadow: "0 0 0 0 rgba(0,232,122,0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backgroundImage: {
        "stadium-gradient": "radial-gradient(ellipse at 50% 0%, #0f2040 0%, #050b12 70%)",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
