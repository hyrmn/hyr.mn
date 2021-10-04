const colors = require('tailwindcss/colors')

module.exports = {
  purge: [
    './src/**/*.njk',
  ],
  darkMode: false, // or 'media' or 'class',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      blue: colors.blue,
      yellow: colors.amber,
      gray: colors.gray,
      green: colors.green
    },    
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
