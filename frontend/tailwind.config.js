/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFDFB',
          100: '#FAF9F6',
          200: '#F5F2ED',
          300: '#EBE6DD',
        },
        forest: {
          50: '#F0F4F0',
          100: '#D8E5D8',
          200: '#A3C2A3',
          300: '#6B9B6B',
          400: '#4A7C4A',
          500: '#2D5A2D',
          600: '#234523',
          700: '#1A331A',
          800: '#122312',
          900: '#0A130A',
        },
        sage: {
          50: '#F4F7F2',
          100: '#E6EDE1',
          200: '#C8D9BD',
          300: '#A7C299',
          400: '#87A96B',
          500: '#6B8E4E',
          600: '#537239',
          700: '#3E5529',
          800: '#2A391B',
          900: '#1A230F',
        },
        terracotta: {
          50: '#FDF6F0',
          100: '#FAE8D8',
          200: '#F4D0B0',
          300: '#E6A670',
          400: '#D47D3A',
          500: '#C65D00',
          600: '#A04A00',
          700: '#7A3800',
          800: '#552700',
          900: '#331700',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#87CEEB',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        earth: {
          50: '#FAF7F4',
          100: '#F3EDE6',
          200: '#E2D3C3',
          300: '#C9B199',
          400: '#A8896A',
          500: '#8B6F47',
          600: '#6F5636',
          700: '#554128',
          800: '#3B2D1B',
          900: '#231A0F',
        },
        warm: {
          yellow: '#F4E4C1',
          orange: '#FFB878',
          brown: '#A0826D',
        }
      },
      fontFamily: {
        'nature': ['Merriweather', 'Georgia', 'serif'],
        'heading': ['Montserrat', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'nature-pattern': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%232D5A2D\" fill-opacity=\"0.03\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        'leaf-pattern': "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 80 80\"%3E%3Cpath d=\"M40 40c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20z\" fill=\"%2387A96B\" fill-opacity=\"0.05\"/%3E%3C/svg%3E')",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'nature': '0 4px 6px -1px rgba(45, 90, 45, 0.1), 0 2px 4px -1px rgba(45, 90, 45, 0.06)',
        'nature-lg': '0 10px 15px -3px rgba(45, 90, 45, 0.1), 0 4px 6px -2px rgba(45, 90, 45, 0.05)',
        'nature-xl': '0 20px 25px -5px rgba(45, 90, 45, 0.1), 0 10px 10px -5px rgba(45, 90, 45, 0.04)',
      },
    },
  },
  plugins: [],
}
