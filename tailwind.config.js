/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TKH Branding Colors
        'tkh-primary': '#CCCC00',
        'tkh-blue-dark': '#1A2638',
        'tkh-blue': '#1E4466',
        'tkh-blue-medium': '#183147',
        'tkh-blue-light': '#326CDB',
        'tkh-blue-sky': '#21BCFF',
        'tkh-green': '#00CCB3',
        'tkh-grey': '#9FA2A1',
        'tkh-grey-light': '#DDDDDD',
        'tkh-line': '#F5F0F0',
        'tkh-line-dark': '#183147',
        'tkh-white': '#FFFFFF',
        'tkh-black': '#0D0C20',
        // Status colors (aligned with TKH)
        status: {
          online: '#00CCB3',  // TKH Green
          busy: '#326CDB',    // TKH Blue Light
          offline: '#9FA2A1', // TKH Grey
          error: '#FF5454',   // Red
        }
      },
      fontFamily: {
        sans: ['"Nimbus Sans L"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
}
