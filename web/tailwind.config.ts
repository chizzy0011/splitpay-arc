import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light editorial-fintech palette (matches the redesign reference).
        paper: "#F5F1E8", // warm cream page
        card: "#FCFAF5", // near-white card
        inset: "#F1ECE0", // input / recessed surface
        line: "#E6DECE", // warm hairline border
        ink: "#1A1712", // primary text (warm near-black)
        muted: "#77705F", // secondary text
        // primary + split-share / semantic trio
        indigo: "#4F46E5",
        "indigo-deep": "#4338CA",
        ochre: "#C0803A", // split-share fill / avatar (graphic use)
        "ochre-deep": "#8A5A1F", // AA-safe ochre for text + filled buttons
        green: "#2F9160",
        red: "#B23A32",
        // legacy aliases so any un-updated utilities still resolve sensibly
        canvas: "#F5F1E8",
        surface: "#FCFAF5",
        "surface-2": "#F1ECE0",
        cream: "#1A1712",
        gold: "#4F46E5",
        "gold-soft": "#4338CA",
        usdc: "#4F46E5",
        arc: "#4F46E5",
        executed: "#2F9160",
        danger: "#B23A32",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.03em" },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "toast-in": "toast-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
