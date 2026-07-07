/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Verde bosque: headers, botones primarios, texto de marca.
        forest: {
          50: '#F1F8F2',
          100: '#E1F0E3',
          200: '#C3E2C8',
          300: '#98CCA2',
          400: '#69AF78',
          500: '#458C57',
          600: '#347044',
          700: '#2A5837',
          800: '#22462C',
          900: '#1B3823',
        },
        // Acento violeta: unicamente para el estado activo de la navegacion,
        // igual que en el diseno de referencia.
        accent: {
          50: '#F2EEFC',
          100: '#E4DBFA',
          200: '#C9B7F5',
          300: '#AC90EF',
          400: '#9370E8',
          500: '#7C5CE0',
          600: '#6D4CD6',
          700: '#5A3CB8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
