const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  future: {},
  purge: [
    './src/**/*.njk'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans]
      },
    },
  },
  variants: {},
  plugins: [
    require('@tailwindcss/typography')
  ]
}
