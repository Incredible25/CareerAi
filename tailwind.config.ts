import type { Config } from "tailwindcss";

// Brand tokens from the approved strategy (docs/PRODUCT_STRATEGY.md §14):
// deep green primary, navy secondary, orange/blue/white accents.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        green: {
          50: "#EAF3EE",
          100: "#CFE6D8",
          400: "#2C8562",
          500: "#145C46",
          600: "#0C3B2E",
          700: "#092E24",
        },
        navy: {
          50: "#E7ECF4",
          400: "#2C4874",
          500: "#142B4A",
          600: "#0D1D33",
        },
        orange: {
          50: "#FBEADB",
          400: "#E8863F",
          500: "#D96A25",
          600: "#B2551D",
        },
        sand: {
          50: "#F6F7F2",
          100: "#EFF2EA",
          200: "#DBE2D8",
          300: "#C3CDBF",
        },
        ink: {
          DEFAULT: "#12211B",
          soft: "#48594F",
          faint: "#7C8B81",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg2: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
