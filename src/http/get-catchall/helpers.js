const arc = require('@architect/functions')
const sanitizeHtml = require('sanitize-html')
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

function postTitle (post) {
  return md.render(post.properties.name[0]).trim()
}

function postContent (post) {
  if ('content' in post.properties) {
    if (typeof post.properties.content[0] === 'string') {
      let html = md.render(post.properties.content[0]).trim()
      html = html.replace(/[@]+([A-Za-z0-9-_]+)/g, ' <a href="https://twitter.com/$1">@$1</a>')
      html = html.replace(/[\s]+[#]+([A-Za-z0-9-_]+)/g, ' <a href="https://twitter.com/hashtag/$1">#$1</a>')
      return html
    } else {
      return post.properties.content[0].html.trim()
    }
  } else {
    return ''
  }
}

function contextContent (context) {
  if (!context.properties.content) return ''
  if (context.properties.content[0].html) {
    const sanitizedHtml = sanitizeHtml(
      context.properties.content[0].html, {
        allowedTags: [],
        allowedAttributes: {}
      }
    )
    let html = sanitizedHtml.split(' ').splice(0, 30).join(' ')
    if (sanitizedHtml !== html) html += '&hellip;'
    return html
  } else {
    return context.properties.content[0]
  }
}

function webmentionContent (webmention) {
  if (!webmention.properties.content) return ''
  let html
  if (webmention.properties.content[0].html) {
    html = webmention.properties.content[0].html
  } else {
    html = webmention.properties.content[0]
  }
  const sanitizedHtml = sanitizeHtml(
    html, {
      allowedTags: ['a'],
      allowedAttributes: { a: ['href'] }
    }
  )
  return sanitizedHtml
}

function listContent (post) {
  if (!post.properties.content) return ''
  let html
  if (post.properties.content[0].html) {
    html = post.properties.content[0].html
  } else {
    html = md.render(post.properties.content[0]).trim()
  }
  const sanitizedHtml = sanitizeHtml(
    html, {
      allowedTags: [],
      allowedAttributes: {}
    }
  )
  return sanitizedHtml
}

function humanDate (dateString) {
  return new Date(dateString).toLocaleString('en-gb', {
    day: 'numeric', month: 'short', year: 'numeric'
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

function iconFromUrl (url, includeServiceName = false) {
  const host = urlHost(url).replace(/^www\./, '')
  let svg = ''; let name = ''
  if (host === 'twitter.com') {
    svg = '<svg class="w-4 h4 md:w-5 md:h-5 inline" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="twitter" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>'
    name = 'Twitter'
  } else if (host === 'linkedin.com' || host === 'www.linkedin.com') {
    svg = '<svg class="w-4 h4 md:w-5 md:h-5 inline" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="linkedin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>'
    name = 'LinkedIn'
  } else if (host === 'instagram.com' || host === 'www.instagram.com') {
    svg = '<svg class="w-4 h4 md:w-5 md:h-5 inline" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="instagram" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>'
    name = 'Instagram'
  } else if (host === 'medium.com') {
    svg = '<svg class="w-4 h4 md:w-5 md:h-5 inline" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="medium" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M0 32v448h448V32H0zm372.2 106.1l-24 23c-2.1 1.6-3.1 4.2-2.7 6.7v169.3c-.4 2.6.6 5.2 2.7 6.7l23.5 23v5.1h-118V367l24.3-23.6c2.4-2.4 2.4-3.1 2.4-6.7V199.8l-67.6 171.6h-9.1L125 199.8v115c-.7 4.8 1 9.7 4.4 13.2l31.6 38.3v5.1H71.2v-5.1l31.6-38.3c3.4-3.5 4.9-8.4 4.1-13.2v-133c.4-3.7-1-7.3-3.8-9.8L75 138.1V133h87.3l67.4 148L289 133.1h83.2v5z"></path></svg>'
    name = 'Medium'
  } else if (host === 'www.swarmapp.com' || host === 'swarmapp.com') {
    svg = '<svg class="w-4 h4 md:w-5 md:h-5 inline" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="foursquare" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 368 512"><path fill="currentColor" d="M323.1 3H49.9C12.4 3 0 31.3 0 49.1v433.8c0 20.3 12.1 27.7 18.2 30.1 6.2 2.5 22.8 4.6 32.9-7.1C180 356.5 182.2 354 182.2 354c3.1-3.4 3.4-3.1 6.8-3.1h83.4c35.1 0 40.6-25.2 44.3-39.7l48.6-243C373.8 25.8 363.1 3 323.1 3zm-16.3 73.8l-11.4 59.7c-1.2 6.5-9.5 13.2-16.9 13.2H172.1c-12 0-20.6 8.3-20.6 20.3v13c0 12 8.6 20.6 20.6 20.6h90.4c8.3 0 16.6 9.2 14.8 18.2-1.8 8.9-10.5 53.8-11.4 58.8-.9 4.9-6.8 13.5-16.9 13.5h-73.5c-13.5 0-17.2 1.8-26.5 12.6 0 0-8.9 11.4-89.5 108.3-.9.9-1.8.6-1.8-.3V75.9c0-7.7 6.8-16.6 16.6-16.6h219c8.2 0 15.6 7.7 13.5 17.5z"></path></svg>'
    name = 'Swarm'
  } else if (host === 'facebook.com' || host === 'www.facebook.com') {
    svg = '<svg class="w-4 h4 md:w-5 md:h-5 inline" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook-square" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.42 19.12-40.42 38.73V256h68.78l-11 71.69h-57.78V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48z"></path></svg>'
    name = 'Facebook'
  } else {
    return host
  }
  return svg + (includeServiceName ? ' ' + name : '')
}

function contextVerb (contextLabel) {
  switch (contextLabel) {
    case 'In reply to':
      return 'u-in-reply-to'
    case 'Reposted':
      return 'u-repost-of'
    case 'Liked':
      return 'u-like-of'
    case 'Bookmarked':
      return 'u-bookmark-of'
  }
}

function pluralise (term) {
  switch (term) {
    case 'reply':
      return 'replies'
    case 'Reply':
      return 'Replies'
    case 'rsvp':
      return 'RSVPs'
    case 'Rsvp':
      return 'RSVPs'
    default:
      return `${term}s`
  }
}

module.exports = {
  postTitle,
  postContent,
  contextContent,
  webmentionContent,
  listContent,
  humanDate,
  imageOptimise,
  static: arc.static,
  iconFromUrl,
  urlHost,
  contextVerb,
  pluralise
}
