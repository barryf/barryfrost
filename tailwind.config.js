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
            'h2,h3,h4,code,a,blockquote': {
              color: theme('colors.gray.800'),
              fontStyle: 'normal'
            },
            a: {
              fontWeight: 'bold',
              '&:hover': {
                color: theme('colors.yellow.600')
              }
            },
            blockquote: {
              fontStyle: 'normal'
            }
          }
        },
        dark: {
          css: {
            'h2,h3,h4,code,a,blockquote': {
              color: theme('colors.gray.200')
            },
            a: {
              code: {
                color: theme('colors.gray.200'),
                '&:hover': {
                  color: theme('colors.yellow.600')
                }
              }
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
