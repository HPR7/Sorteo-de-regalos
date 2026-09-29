import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        festive: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f8d2d9',
          300: '#f2abb9',
          400: '#e8788f',
          500: '#db4969',
          600: '#c52d51',
          700: '#a5203f',
          800: '#8b1d38',
          900: '#751c33',
        },
        pine: {
          50: '#effaf3',
          100: '#d9f3e3',
          200: '#b6e6cb',
          300: '#84d2a9',
          400: '#4fb682',
          500: '#2b9864',
          600: '#1d7b4e',
          700: '#176240',
          800: '#154e34',
          900: '#13402d',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      animation: {
        'bounce-subtle': 'bounce 2s infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
