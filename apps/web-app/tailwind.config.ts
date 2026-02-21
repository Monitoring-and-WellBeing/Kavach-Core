import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'display': ['clamp(1.5rem, 4vw, 2rem)', { lineHeight: '1.2' }],
        'title':   ['clamp(1.125rem, 3vw, 1.5rem)', { lineHeight: '1.3' }],
      },
      colors: {
        kavach: {
          bg: "#0A0F1E",
          surface: "#0F1629",
          border: "#1E2A45",
          accent: "#3B82F6",
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
          text: "#E2E8F0",
          muted: "#64748B",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
