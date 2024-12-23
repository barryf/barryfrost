const arc = require('@architect/functions')
const sanitizeHtml = require('sanitize-html')
const md = require('markdown-it')({
  linkify: true,
  html: true,
  typographer: true
})
md.use(require('markdown-it-handle'))

function isUrl (u) {
  return (u.indexOf('http://') > -1) || (u.indexOf('https://') > -1)
}

function urlHost (u) {
  const url = new URL(u)
  return url.host
}

function urlIsRoot (u) {
  const url = new URL(u)
  return url.pathname === '/' || url.pathname === '/index.html'
}

function containsTweet (post) {
  return (
    'content' in post.properties &&
    typeof post.properties.content[0] === 'string' &&
    post.properties.content[0].match(/https?:\/\/twitter\.com\/\w+\/status\/\d+/)
  )
}

function postTitle (post) {
  return post.properties.name[0].trim()
}

function postContent (post) {
  if ('content' in post.properties) {
    if (typeof post.properties.content[0] === 'string') {
      let content = post.properties.content[0].trim()
      // auto-embed images
      // image: ![alt](url)
      content = content.replace(/!\[(.*)\]\((https?:\/\/.*\.(?:gif|png|jpg|jpeg))\)/g,
        '<img src="$2" alt="$1" class="rounded">')
      // image: url
      content = content.replace(/\s(https?:\/\/.*\.(?:gif|png|jpg|jpeg))/g,
        '<img src="$1" alt="" class="rounded">')
      // auto-embed youtube
      content = content.replace(/((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?/g,
        '<iframe class="mt-4 w-full" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/$5" frameborder="0"></iframe>')
      // auto-embed tweets
      content = content.replace(/(https?:\/\/twitter\.com\/\w+\/status\/\d+)/g,
        '<blockquote class="twitter-tweet"><a href="$1">$1</a></blockquote>')
      // auto-link hashtags
      content = content.replace(/[\s]+[#]+([A-Za-z0-9-_]+)/g, ' <a href="/categories/$1">#$1</a>')
      return md.render(content)
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
    if (typeof webmention.properties.content[0].html === 'string') {
      html = webmention.properties.content[0].html
    } else {
      html = webmention.properties.content[0].html[0]
    }
  } else {
    html = webmention.properties.content[0]
  }
  const sanitizedHtml = sanitizeHtml(
    html, {
      allowedTags: [],
      allowedAttributes: {}
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
  let sanitizedHtml = sanitizeHtml(
    html, {
      allowedTags: [],
      allowedAttributes: {}
    }
  )
  sanitizedHtml = sanitizedHtml.replace(
    /\shttps?:\/\/([\S]+)/g,
    (_, u) => {
      return ' ' + u.split('/')[0] + '&hellip;'
    })
  return sanitizedHtml
}

function humanDate (dateString) {
  return new Date(dateString).toLocaleString('en-gb', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function humanDateFull (dateString) {
  return new Date(dateString).toLocaleString('en-gb', {
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric'
  })
}

function yearFromDateString (dateString) {
  return new Date(dateString).toLocaleString('en-gb', {
    year: 'numeric'
  })
}

function monthFromDateString (dateString) {
  const month = new Date(dateString).toLocaleString('en-gb', {
    month: 'numeric'
  })
  return month < 10 ? `0${month}` : month
}

function imageOptimise (url, height = 768) {
  const starts = 'https://res.cloudinary.com/barryf/image/upload/'
  if (url.startsWith(starts)) {
    return url.replace(starts, `${starts}h_${height},fl_progressive/`)
  } else {
    return url
  }
}

function iconFromUrl (url, includeServiceName = false) {
  const host = urlHost(url).replace(/^www\./, '')
  let svg = ''; let name = ''
  if (host === 'twitter.com' || host === 'mobile.twitter.com') {
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
  } else if (host === 'mastodon.social') {
    svg = '<svg class="w-4 h4 md:w-5 md:h-5 inline" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="mastodon" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M433 179.11c0-97.2-63.71-125.7-63.71-125.7-62.52-28.7-228.56-28.4-290.48 0 0 0-63.72 28.5-63.72 125.7 0 115.7-6.6 259.4 105.63 289.1 40.51 10.7 75.32 13 103.33 11.4 50.81-2.8 79.32-18.1 79.32-18.1l-1.7-36.9s-36.31 11.4-77.12 10.1c-40.41-1.4-83-4.4-89.63-54a102.54 102.54 0 0 1-.9-13.9c85.63 20.9 158.65 9.1 178.75 6.7 56.12-6.7 105-41.3 111.23-72.9 9.8-49.8 9-121.5 9-121.5zm-75.12 125.2h-46.63v-114.2c0-49.7-64-51.6-64 6.9v62.5h-46.33V197c0-58.5-64-56.6-64-6.9v114.2H90.19c0-122.1-5.2-147.9 18.41-175 25.9-28.9 79.82-30.8 103.83 6.1l11.6 19.5 11.6-19.5c24.11-37.1 78.12-34.8 103.83-6.1 23.71 27.3 18.4 53 18.4 175z"/></svg>'
    name = 'Mastodon'
  } else if (host === 'bsky.app' || host === 'staging.bsky.app') {
    svg = '<svg class="w-4 h4 md:w-5 md:h-5 inline" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="bluesky" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M111.8 62.2C170.2 105.9 233 194.7 256 242.4c23-47.6 85.8-136.4 144.2-180.2c42.1-31.6 110.3-56 110.3 21.8c0 15.5-8.9 130.5-14.1 149.2C478.2 298 412 314.6 353.1 304.5c102.9 17.5 129.1 75.5 72.5 133.5c-107.4 110.2-154.3-27.6-166.3-62.9l0 0c-1.7-4.9-2.6-7.8-3.3-7.8s-1.6 3-3.3 7.8l0 0c-12 35.3-59 173.1-166.3 62.9c-56.5-58-30.4-116 72.5-133.5C100 314.6 33.8 298 15.7 233.1C10.4 214.4 1.5 99.4 1.5 83.9c0-77.8 68.2-53.4 110.3-21.8z"></path></svg>'
    name = 'Bluesky'
  } else {
    return host
  }
  return svg + (
    includeServiceName
      ? '&nbsp;' + name
      : `<span class="hidden">${name}</span>`
  )
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

function shortUrl (post) {
  return '/' + post.url[0].replace(process.env.ROOT_URL, '')
}

function contextNameEqualsContent (context) {
  if (!('name' in context.properties) || !('content' in context.properties)) {
    return false
  }
  const name = context.properties.name[0]
  let content
  if (context.properties.content[0].html) {
    content = sanitizeHtml(
      context.properties.content[0].html, {
        allowedTags: [],
        allowedAttributes: {}
      }
    )
  } else {
    content = context.properties.content[0]
  }
  return (content === name)
}

function listPhotos (post, width = 240, height = 240) {
  let html = ''
  const starts = 'https://res.cloudinary.com/barryf/image/upload/'
  for (const photo of post.properties.photo) {
    const url = photo.value || photo
    const alt = photo.alt || 'Photo'
    if (url.startsWith(starts)) {
      const newUrl = url.replace(starts, `${starts}w_${width},h_${height},c_thumb,fl_progressive/`)
      html += `<img src="${newUrl}" width="${width / 4}" height="${height / 4}" class="u-photo inline rounded ml-1" alt="${alt}">`
    }
  }
  return `<div class="float-right ml-2">${html}</div>`
}

function isProduction () {
  return process.env.NODE_ENV === 'production'
}

function getWeeknoteTitle (post) {
  const weekNum = post.properties.name[0].split(' ')[1]
  if ('category' in post.properties) {
    for (const cat of post.properties.category) {
      if (cat.startsWith('emoji-')) {
        return `${cat.split('-')[1]} ${weekNum}`
      }
    }
  }
  return weekNum
}

function bridgyFedTag (post) {
  const federatedTypes = ['article', 'note', 'photo', 'like', 'reply', 'repost']
  if (federatedTypes.includes(post['post-type'][0])) {
    return '<a class="u-bridgy-fed" href="https://fed.brid.gy/"></a>'
  }
}

module.exports = {
  postTitle,
  postContent,
  contextContent,
  webmentionContent,
  listContent,
  humanDate,
  humanDateFull,
  yearFromDateString,
  monthFromDateString,
  imageOptimise,
  static: arc.static,
  iconFromUrl,
  urlHost,
  contextVerb,
  pluralise,
  isUrl,
  containsTweet,
  shortUrl,
  contextNameEqualsContent,
  listPhotos,
  isProduction,
  urlIsRoot,
  getWeeknoteTitle,
  bridgyFedTag
}
