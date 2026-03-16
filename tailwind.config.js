/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './script.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0C3C6E',
        primary: '#1E5FA8',
        secondary: '#2F7CC3',
        'secondary-light': '#7FB6E6',
        accent: '#35C6D6',
        dark: '#0F0F0F',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(53,198,214,0.35), 0 22px 46px rgba(127,182,230,0.22)'
      }
    }
  },
  plugins: []
};
