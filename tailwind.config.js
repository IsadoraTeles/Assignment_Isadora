import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
// Tokens live in src/styles/seqera-tokens.css as CSS variables. We reference the
// variables here (not raw hex) so every component uses the *role* — e.g. bg-success-soft,
// text-danger-text — and a token change flows through the whole UI in one place.
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-sunk": "var(--surface-sunk)",
        border: "var(--border)",
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
        },
        brand: {
          solid: "var(--brand-solid)",
          text: "var(--brand-text)",
          soft: "var(--brand-soft)",
        },
        success: {
          solid: "var(--success-solid)",
          text: "var(--success-text)",
          soft: "var(--success-soft)",
        },
        danger: {
          solid: "var(--danger-solid)",
          text: "var(--danger-text)",
          soft: "var(--danger-soft)",
        },
        primary: {
          solid: "var(--primary-solid)",
          text: "var(--primary-text)",
          soft: "var(--primary-soft)",
        },
        muted: {
          solid: "var(--muted-solid)",
          text: "var(--muted-text)",
          soft: "var(--muted-soft)",
        },
        ai: {
          solid: "var(--ai-solid)",
          text: "var(--ai-text)",
          soft: "var(--ai-soft)",
        },
        focus: "var(--focus-ring)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
      },
      // Token spacing exposed as a NON-colliding namespace (e.g. p-token-5,
      // gap-token-6). We deliberately do NOT override Tailwind's numeric spacing
      // keys 1–8 because that scale is shared by width/height utilities — token
      // values 1–4 already equal Tailwind's 4px base, and 5–8 would silently
      // resize h-*/w-* (e.g. an h-8 button jumping to 64px).
      spacing: {
        "token-1": "var(--space-1)",
        "token-2": "var(--space-2)",
        "token-3": "var(--space-3)",
        "token-4": "var(--space-4)",
        "token-5": "var(--space-5)",
        "token-6": "var(--space-6)",
        "token-7": "var(--space-7)",
        "token-8": "var(--space-8)",
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
