/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF8F5',  // soft cream
          100: '#F5EFE6', // warm sand
          200: '#EADBC8', // deep sand
          500: '#D0A25C', // warm amber accent
          600: '#B88746',
          700: '#9C6F35',
          900: '#3D3122', // warm dark chocolate
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
