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
        // Silkscreen for headings and labels, VT323 for everything you read.
        // Both are bundled in src/assets/fonts so they never depend on a CDN.
        display: ["'Silkscreen'", "'VT323'", "monospace"],
        body: ["'VT323'", "monospace"],
        mono: ["'VT323'", "monospace"],
        pixel: ["'Silkscreen'", "'VT323'", "monospace"],
      },
      backgroundImage: {
        "grid-glow": "none",
        aurora: "linear-gradient(120deg, rgb(var(--aurora-1)) 0%, rgb(var(--aurora-2)) 55%, rgb(var(--aurora-3)) 100%)",
        "aurora-soft": "linear-gradient(120deg, rgb(var(--color-neon-blue) / 0.25) 0%, rgb(var(--color-neon-purple) / 0.25) 50%, rgb(var(--color-neon-cyan) / 0.25) 100%)",
      },
      boxShadow: {
        glow: "0 0 0 2px rgb(var(--color-ink) / 0.35)",
        "glow-purple": "0 0 0 2px rgb(var(--color-ink) / 0.25)",
        "glow-cyan": "0 0 0 2px rgb(var(--color-ink) / 0.25)",
        card: "var(--glass-shadow)",
        pixel: "3px 3px 0 0 var(--pixel-btn-shadow)",
        "pixel-sm": "2px 2px 0 0 var(--pixel-btn-shadow)",
        "pixel-pressed": "1px 1px 0 0 var(--pixel-btn-shadow)",
      },
      borderRadius: {
        // square corners everywhere: pixel art has no rounded edges
        xl2: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
      },
      keyframes: {
        "pixel-twinkle": {
          "0%,100%": { opacity: 0.2 },
          "50%": { opacity: 1 },
        },
        "pixel-bob": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "drift-x": {
          from: { transform: "translate3d(-20vw, 0, 0)" },
          to: { transform: "translate3d(120vw, 0, 0)" },
        },
        "ship-fly": {
          from: { transform: "translate3d(-10vw, 20vh, 0)" },
          to: { transform: "translate3d(95vw, -35vh, 0)" },
        },
        "star-drift": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "0 512px" },
        },
        "flame": {
          "0%,100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
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
        "pixel-twinkle": "pixel-twinkle 1.2s steps(2, end) infinite",
        "pixel-bob": "pixel-bob 2s steps(2, end) infinite",
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
