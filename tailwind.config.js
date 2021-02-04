module.exports = {
  future: {},
  purge: [
    './src/**/*.njk'
  ],
  theme: {
    fontFamily: {
      sans: ['plex-sans', 'ui-sans-serif', 'system-ui']
    },
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            'h2,h3,h4,code,a': {
              color: theme('colors.gray.800')
            },
            a: {
              '&:hover': {
                color: theme('colors.yellow.600')
              }
            }
          }
        },
        dark: {
          css: {
            'h2,h3,h4,code,a': {
              color: theme('colors.gray.200')
            }
          }
        }
      })
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
  darkMode: 'media',
  variants: {
    typography: ['dark']
  }
}
