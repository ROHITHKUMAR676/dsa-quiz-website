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
        display: ["'Pixel Digits'", "'Pixelify Sans'", "sans-serif"],
        body: ["'Pixel Digits'", "'Pixelify Sans'", "sans-serif"],
        mono: ["'Pixel Digits'", "'VT323'", "monospace"],
        pixel: ["'Press Start 2P'", "monospace"],
      },
      backgroundImage: {
        "grid-glow": "radial-gradient(circle at 50% 0%, rgba(125,165,228,0.18), transparent 60%)",
        aurora: "linear-gradient(120deg, rgb(var(--aurora-1)) 0%, rgb(var(--aurora-2)) 55%, rgb(var(--aurora-3)) 100%)",
        "aurora-soft": "linear-gradient(120deg, rgb(var(--color-neon-blue) / 0.25) 0%, rgb(var(--color-neon-purple) / 0.25) 50%, rgb(var(--color-neon-cyan) / 0.25) 100%)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(16,105,196,0.50)",
        "glow-purple": "0 0 24px rgba(152,138,252,0.40)",
        "glow-cyan": "0 0 24px rgba(100,172,218,0.40)",
        card: "var(--glass-shadow)",
        pixel: "3px 3px 0 0 var(--pixel-btn-shadow)",
        "pixel-sm": "2px 2px 0 0 var(--pixel-btn-shadow)",
        "pixel-pressed": "1px 1px 0 0 var(--pixel-btn-shadow)",
      },
      borderRadius: {
        xl2: "6px",
        md: "3px",
        lg: "4px",
        xl: "4px",
        "2xl": "6px",
        "3xl": "6px",
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
