/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#080B14",
          100: "#0A0E1A",
          200: "#0D1220",
          300: "#111728",
          400: "#161D33",
          500: "#1B2340",
        },
        surface: {
          DEFAULT: "#12172A",
          light: "#1A2038",
          border: "#232B47",
        },
        neon: {
          blue: "#4F7CFF",
          blue2: "#3B5FE0",
          purple: "#A855F7",
          violet: "#8B5CF6",
          cyan: "#22D3EE",
        },
        state: {
          success: "#34D399",
          warning: "#FBBF24",
          danger: "#F87171",
          gold: "#FFC94D",
          silver: "#C9D3E0",
          bronze: "#E0A467",
        },
        ink: {
          DEFAULT: "#E8ECF7",
          dim: "#9AA4C2",
          faint: "#5B6488",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "grid-glow": "radial-gradient(circle at 50% 0%, rgba(79,124,255,0.15), transparent 60%)",
        aurora: "linear-gradient(120deg, #4F7CFF 0%, #A855F7 50%, #22D3EE 100%)",
        "aurora-soft": "linear-gradient(120deg, rgba(79,124,255,0.25) 0%, rgba(168,85,247,0.25) 50%, rgba(34,211,238,0.25) 100%)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(79,124,255,0.35)",
        "glow-purple": "0 0 24px rgba(168,85,247,0.35)",
        "glow-cyan": "0 0 24px rgba(34,211,238,0.35)",
        card: "0 8px 32px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: 0.5, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "gradient-move": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "spin-slow": "spin-slow 12s linear infinite",
        "gradient-move": "gradient-move 8s ease infinite",
      },
    },
  },
  plugins: [],
};
