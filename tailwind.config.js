/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'], 
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
        '5xl': ['48px', '1'],
        '6xl': ['60px', '1'],
      },
      colors: {
        'warm': {
          50: '#fefbf3',
          100: '#fef7e6', 
          200: '#fdecc8',
          300: '#fbd896',
          400: '#f7be5c',
          500: '#f3a935',
          600: '#e4941b',
          700: '#bd7f18',
          800: '#976519',
          900: '#7a5318',
        }
      }
    },
  },
  plugins: [],
}