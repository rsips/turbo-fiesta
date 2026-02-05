/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        status: {
          online: '#10b981',
          busy: '#f59e0b',
          offline: '#6b7280',
          error: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
