module.exports = {
  future: {},
  purge: [
    './src/**/*.njk'
  ],
  theme: {
    extend: {},
    fontFamily: {
      sans: ['plex-sans', 'ui-sans-serif', 'system-ui']
    }
  },
  variants: {},
  plugins: [
    require('@tailwindcss/typography')
  ]
}
