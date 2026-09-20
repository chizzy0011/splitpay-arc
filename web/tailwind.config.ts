import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0F17",
        surface: "#151C28",
        "surface-2": "#1B2536",
        line: "#24304a",
        usdc: "#2775CA",
        arc: "#38BDF8",
        executed: "#10B981",
        muted: "#7A8AA5",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
