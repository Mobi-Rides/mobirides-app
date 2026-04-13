
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        'xs': '480px',
        // Mobile-first breakpoints
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'pointer': { 'raw': '(hover: hover) and (pointer: fine)' },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7C3AED",
          foreground: "#FFFFFF",
          dark: "#6D28D9",
        },
        secondary: {
          DEFAULT: "#F3F4F6",
          foreground: "#1F2937",
          dark: "#374151",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#EDE9FE",
          foreground: "#7C3AED",
          dark: "#5B21B6",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        // Ensure minimum 16px for mobile inputs
        'mobile-base': ['16px', { lineHeight: '1.5' }],
      },
      spacing: {
        // Touch target sizes
        'touch': '44px',
        'touch-lg': '48px',
        // Safe area insets
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
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
        "throb": {
          "0%, 100%": {
            textShadow: "0 0 4px rgba(124, 58, 237, 0.3)",
          },
          "50%": {
            textShadow: "0 0 8px rgba(124, 58, 237, 0.6), 0 0 12px rgba(124, 58, 237, 0.4)",
          },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "throb": "throb 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
      transitionDuration: {
        'touch': '150ms',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    function ({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        // Scrollbar utilities
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        // Touch manipulation
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        // Prevent text selection
        '.select-none': {
          '-webkit-user-select': 'none',
          'user-select': 'none',
        },
        // Safe area utilities
        '.pb-safe-area': {
          'padding-bottom': 'env(safe-area-inset-bottom, 0px)',
        },
        '.pt-safe-area': {
          'padding-top': 'env(safe-area-inset-top, 0px)',
        },
        // Active touch feedback
        '.active\:scale-98:active': {
          transform: 'scale(0.98)',
        },
        // Line clamp utilities
        '.line-clamp-1': {
          display: '-webkit-box',
          '-webkit-line-clamp': '1',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
      })
    }
  ],
} satisfies Config;
