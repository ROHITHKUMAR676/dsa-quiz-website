/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "rgb(var(--color-void) / <alpha-value>)",
          100: "rgb(var(--color-void-100) / <alpha-value>)",
          200: "rgb(var(--color-void-200) / <alpha-value>)",
          300: "rgb(var(--color-void-300) / <alpha-value>)",
          400: "rgb(var(--color-void-400) / <alpha-value>)",
          500: "rgb(var(--color-void-500) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          light: "rgb(var(--color-surface-light) / <alpha-value>)",
          border: "rgb(var(--color-surface-border) / <alpha-value>)",
        },
        neon: {
          blue: "rgb(var(--color-neon-blue) / <alpha-value>)",
          blue2: "rgb(var(--color-neon-blue2) / <alpha-value>)",
          purple: "rgb(var(--color-neon-purple) / <alpha-value>)",
          violet: "rgb(var(--color-neon-violet) / <alpha-value>)",
          cyan: "rgb(var(--color-neon-cyan) / <alpha-value>)",
        },
        state: {
          success: "rgb(var(--color-state-success) / <alpha-value>)",
          warning: "rgb(var(--color-state-warning) / <alpha-value>)",
          danger: "rgb(var(--color-state-danger) / <alpha-value>)",
          gold: "rgb(var(--color-state-gold) / <alpha-value>)",
          silver: "rgb(var(--color-state-silver) / <alpha-value>)",
          bronze: "rgb(var(--color-state-bronze) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          dim: "rgb(var(--color-ink-dim) / <alpha-value>)",
          faint: "rgb(var(--color-ink-faint) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "grid-glow": "radial-gradient(circle at 50% 0%, rgba(79,124,255,0.15), transparent 60%)",
        aurora: "linear-gradient(120deg, rgb(var(--color-neon-blue)) 0%, rgb(var(--color-neon-purple)) 50%, rgb(var(--color-neon-cyan)) 100%)",
        "aurora-soft": "linear-gradient(120deg, rgb(var(--color-neon-blue) / 0.25) 0%, rgb(var(--color-neon-purple) / 0.25) 50%, rgb(var(--color-neon-cyan) / 0.25) 100%)",
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
