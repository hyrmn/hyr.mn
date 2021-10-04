module.exports = {
  purge: [
    './src/**/*.njk',
  ],
  darkMode: false, // or 'media' or 'class',
  theme: {

    extend: {
      screens: {
        'print': {'raw': 'print'},
        // => @media  print { ... }
      }
    }
  },
  variants: {},
  plugins: [
    require('@tailwindcss/typography')
  ],
}
