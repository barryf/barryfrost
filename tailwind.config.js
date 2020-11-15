module.exports = {
  future: {},
  purge: [
    './src/**/*.njk'
  ],
  theme: {
    extend: {}
  },
  variants: {},
  plugins: [
    require('@tailwindcss/typography')
  ]
}
