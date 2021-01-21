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
  plugins: [
    require('@tailwindcss/typography')
  ],
  darkMode: 'class'
}
