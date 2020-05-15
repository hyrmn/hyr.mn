module.exports = {
  purge: [
    './src/**/*.njk',
  ],
  theme: {
    extend: {
      screens: {
        'print': {'raw': 'print'},
        // => @media  print { ... }
      }
    }
  },
  variants: {},
  plugins: [],
}
