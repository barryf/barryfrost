const arc = require('@architect/functions')
const hljs = require('highlight.js')
const md = require('markdown-it')({
  linkify: true,
  html: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value
      } catch (__) {}
    }
    return ''
  }
})

function urlHost (u) {
  const url = new URL(u)
  return url.host
}

function content (post) {
  if ('content' in post.properties) {
    if (typeof post.properties.content[0] === 'string') {
      return md.render(post.properties.content[0]).trim()
    } else {
      return post.properties.content[0].html.trim()
    }
  } else {
    return ''
  }
}

function title (post) {
  return md.renderInline(post.properties.name[0])
}

function humanDate (dateString) {
  return new Date(dateString).toLocaleString('en-gb', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function imageOptimise (url) {
  const width = 740
  const parts = url.match(/https:\/\/res.cloudinary.com\/([a-z0-9]*)\/(.*)/)
  if (parts) {
    return `https://res.cloudinary.com/${parts[1]}/w_${width}/${parts[2]}`
  } else {
    return url
  }
}

module.exports = {
  urlHost,
  content,
  title,
  humanDate,
  imageOptimise,
  static: arc.static
}
