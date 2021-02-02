const arc = require('@architect/functions')
const sanitizeHtml = require('sanitize-html')
const nunjucks = require('nunjucks')
nunjucks.configure('views')
const api = require('./api')
const helpers = require('./helpers')

const postTypePlurals = [
  'notes',
  'articles',
  'bookmarks',
  'photos',
  'checkins',
  'reposts',
  'likes',
  'replies',
  'rsvps',
  'events'
]

const urls = {
  root: process.env.ROOT_URL,
  css: arc.static(`/styles${
    process.env.NODE_ENV !== 'production' ? '-dev' : ''
    }.css`),
  favicon: arc.static('/barryfrost-favicon.png'),
  micropub: process.env.MICROPUB_URL,
  webmention: 'https://webmention.io/barryf/webmention'
}

function httpHeaders (cache) {
  return {
    headers: {
      'Content-Type': 'text/html; charset=utf8',
      'Cache-Control': `s-maxage=${cache}`,
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "script-src 'self'"
    }
  }
}

function dateWithin24Hours (dateString) {
  const date = new Date(dateString)
  const timeStamp = Math.round(new Date().getTime() / 1000)
  const timeStampYesterday = timeStamp - (24 * 3600)
  const is24 = date >= new Date(timeStampYesterday * 1000).getTime()
  return is24
}

function metadata (post) {
  let title = ''
  if (post.properties.name) {
    if (post['post-type'] && post['post-type'][0] === 'bookmark') {
      title += 'Bookmark: '
    }
    title += post.properties.name[0]
  } else {
    title += post['post-type'][0].charAt(0).toUpperCase() +
      post['post-type'][0].slice(1) +
      ': ' +
      post.url[0].split('/').slice(-1)
  }
  let description = ''
  // use post content for the description if it exists
  if (post.properties.content) {
    description = helpers.postContent(post)
    // remove tags
    description = sanitizeHtml(
      description, {
        allowedTags: [],
        allowedAttributes: {}
      }
    )
    // replace newlines with a space
    description = description.replace(/\n/g, ' ')
    // truncate to first 20 words
    description = description.split(' ').splice(0, 20).join(' ')
  }
  return { title, description }
}

async function renderIndex () {
  return nunjucks.render('index.njk', {
    helpers,
    urls
  })
}

async function renderArchives (categories) {
  const yearMonths = {
    2000: ['10', '11', '12'],
    2001: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'],
    2004: ['08', '09', '10', '11', '12']
  }
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  for (let y = 2005; y <= currentYear; y++) {
    yearMonths[y] = []
    const maxMonth = (y === currentYear) ? currentMonth : 12
    for (let m = 1; m <= maxMonth; m++) {
      const mm = (m < 10) ? `0${m}` : m
      yearMonths[y].push(mm)
    }
  }
  return nunjucks.render('archives.njk', {
    yearMonths,
    categories,
    helpers,
    urls
  })
}

async function renderList (posts, title) {
  const lastPublishedInt = posts.lastPublishedInt
  delete posts.lastPublishedInt
  return nunjucks.render('list.njk', {
    posts,
    title,
    lastPublishedInt,
    helpers,
    urls
  })
}

function renderPost (post) {
  const statusCode = post.statusCode || 200
  delete post.statusCode
  const template = (
    (statusCode !== 200) ||
    (post.channel && post.channel[0] === 'pages')
  ) ? 'page' : 'post'
  const body = nunjucks.render(`${template}.njk`, {
    post,
    metadata: metadata(post),
    helpers,
    urls
  })
  const cache = (post.properties.published &&
    dateWithin24Hours(post.properties.published[0])
  ) ? 60 : 3600
  const raw = JSON.stringify(
    { type: post.type, properties: post.properties }, null, 2)
  return {
    statusCode,
    body,
    cache,
    raw
  }
}

async function handleUrl (url, params) {
  const { before, mf2json } = params
  // category pages, e.g. /categories/indieweb
  if (url.substr(0, 11) === 'categories/') {
    const category = url.substr(11, url.length - 11)
    const posts = await api.getCategory(category, before)
    return {
      ...httpHeaders(3600),
      statusCode: 200,
      body: await renderList(posts, `#${category}`)
    }
  // index pages, e.g. /articles
  } else if (postTypePlurals.includes(url)) {
    // post types e.g. notes (no trailing slash)
    let postType = url.substr(0, url.length - 1)
    if (postType === 'replie') postType = 'reply'
    let title = helpers.pluralise(postType)
    title = title.charAt(0).toUpperCase() + title.substr(1) // initial cap
    const posts = await api.getPostType(postType, before)
    return {
      ...httpHeaders(3600),
      statusCode: 200,
      body: await renderList(posts, title)
    }
  // date archive: year, month or day
  } else if (url.match(/^[0-9]{4}(\/[0-9]{2})?(\/[0-9]{2})?$/)) {
    const published = url.replace(/\//g, '-')
    const posts = await api.getPublished(published, before)
    return {
      ...httpHeaders(3600),
      statusCode: 200,
      body: await renderList(posts, published)
    }
  // all posts
  } else if (url === 'all') {
    const posts = await api.getAll(before)
    return {
      ...httpHeaders(3600),
      statusCode: 200,
      body: await renderList(posts, 'All')
    }
  // categories, month archives
  } else if (url === 'archives') {
    const categories = await api.getCategories()
    return {
      ...httpHeaders(3600),
      statusCode: 200,
      body: await renderArchives(categories)
    }
  // root index page at /
  } else if (url === '') {
    return {
      ...httpHeaders(3600),
      statusCode: 200,
      body: await renderIndex()
    }
  // catch all - assume this is a post or page
  } else {
    const post = await api.getPost(url)
    post.url = [process.env.ROOT_URL + url]
    const { statusCode, body, cache, raw } = renderPost(post)
    if (mf2json !== undefined) {
      return raw
    }
    return {
      ...httpHeaders(cache),
      statusCode,
      body
    }
  }
}

exports.handler = async function http (req) {
  // strip initial/ending slash, remove any api gateway stage, clean characters
  const url = req.rawPath.substr(1).replace(/^staging\//, '')
    .replace(/[^a-z0-9/-]/, '').replace(/\/$/, '')
  const params = req.queryStringParameters || {}
  return handleUrl(url, params)
}
