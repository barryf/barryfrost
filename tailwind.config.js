module.exports = {
  future: {},
  purge: [
    './src/**/*.njk'
  ],
  theme: {
    fontFamily: {
      sans: ['plex-sans', 'ui-sans-serif', 'system-ui'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace']
    },
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            'h1,h2,h3,h4': {
              color: theme('colors.gray.800'),
              fontStyle: 'normal'
            },
            'code,blockquote': {
              color: theme('colors.gray.700')
            },
            a: {
              fontWeight: 'bold',
              textDecoration: 'no-underline',
              color: theme('colors.yellow.600'),
              '&:hover': {
                color: theme('colors.gray.800')
              }
            },
            blockquote: {
              fontStyle: 'normal'
            }
          }
        },
        dark: {
          css: {
            'h1,h2,h3,h4': {
              color: theme('colors.gray.200')
            },
            'code,blockquote': {
              color: theme('colors.gray.300')
            },
            a: {
              color: theme('colors.yellow.600'),
              '&:hover': {
                color: theme('colors.gray.200')
              },
              code: {
                color: theme('colors.yellow.600'),
                '&:hover': {
                  color: theme('colors.gray.800')
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
    typography: ['dark', 'responsive']
  }
}
