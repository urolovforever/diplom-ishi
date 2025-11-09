/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
      }
    },
  },
  corePlugins: {
    // Disable default textDecoration plugin to override it
    textDecoration: false,
  },
  plugins: [
    // Custom textDecoration plugin with proper no-underline
    function({ addUtilities }) {
      addUtilities({
        '.underline': {
          'text-decoration': 'underline',
        },
        '.overline': {
          'text-decoration': 'overline',
        },
        '.line-through': {
          'text-decoration': 'line-through',
        },
        '.no-underline': {
          'text-decoration': 'none !important',
        },
      })
    },
  ],
}