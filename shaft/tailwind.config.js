/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'primary-green': '#75FB90',
        'bg-white': '#FFFFFF',
        'bg-light': '#F0EFF2',
        'text-gray': '#9A9A9A',
        'text-black': '#000000',
        'text-primary': '#1A1A1A',
        'text-secondary': '#888888',
        'border-color': '#EBEBEB',
      },
      fontFamily: {
        sans: ['Urbanist', 'sans-serif'],
      },
    }
  },
  plugins: []
};
