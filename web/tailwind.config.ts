import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Luxury "display product" palette: matte warm ink + champagne gold + cream.
        canvas: "#0B0A09", // warm matte ink (60%)
        surface: "#131110",
        "surface-2": "#1B1714",
        line: "#2B2620", // warm hairline
        cream: "#F1E9DA", // primary text (30%)
        muted: "#A79C89", // secondary text
        gold: "#CBAE72", // single locked accent (10%)
        "gold-soft": "#E4CE9A", // lighter champagne for highlights
        executed: "#8FA686", // muted sage (semantic success)
        danger: "#C77B62", // muted terracotta (semantic error)
        // legacy aliases so existing component classes resolve to the new accent
        usdc: "#CBAE72",
        arc: "#E4CE9A",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
