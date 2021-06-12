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
  'events',
  'listens'
]

const urls = {
  root: process.env.ROOT_URL,
  scripts: {
    archives: arc.static('/scripts/archives.js')
  },
  css: arc.static(`/styles${
    process.env.NODE_ENV === 'testing' ? '-dev' : ''
    }.css`),
  favicon: arc.static('/barryfrost-favicon.png'),
  micropub: process.env.MICROPUB_URL,
  webmention: process.env.WEBMENTION_URL
}

const oneYearInSeconds = 60 * 60 * 24 * 365
const oneDayInSeconds = 60 * 60 * 24
const oneHourInSeconds = 60 * 60

function httpHeaders (cache = oneHourInSeconds) {
  return {
    headers: {
      'Content-Type': 'text/html; charset=utf8',
      'Cache-Control': `s-maxage=${cache}`,
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "script-src 'self' https://platform.twitter.com/ https://static.cloudflareinsights.com/",
      'X-Frame-Options': 'DENY'
    }
  }
}

function metadata (post) {
  let title = ''
  if (post.properties.name) {
    if (post['post-type'] && post['post-type'][0] === 'bookmark') {
      title += 'Bookmark: '
    }
    title += post.properties.name[0]
  } else {
    let postType = post['post-type'][0]
    postType = postType === 'rsvp' ? 'RSVP' : postType
    title += postType.charAt(0).toUpperCase() + postType.slice(1) + ': ' +
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
  let image
  if (post.properties.photo) {
    const photo = post.properties.photo[0]
    const photoUrl = photo.value ? photo.value : photo
    image = helpers.imageOptimise(photoUrl, 627) // 627 is og:image max height
  }
  return { title, description, image }
}

async function renderIndex (data) {
  return nunjucks.render('index.njk', {
    ...data,
    helpers,
    urls
  })
}

function redirect301 (url) {
  return {
    statusCode: 301,
    headers: {
      Location: `${process.env.ROOT_URL}${url}`
    }
  }
}

async function renderArchives (categories, filteredCategories, c) {
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
    filteredCategories,
    c,
    title: 'Archives',
    helpers,
    urls,
    url: 'archives'
  })
}

async function renderList (data, title, year = null, month = null, day = null) {
  return nunjucks.render('list.njk', {
    ...data,
    title,
    year,
    month,
    day,
    helpers,
    urls
  })
}

function renderPost (post, url) {
  const statusCode = post.statusCode || 200
  delete post.statusCode
  const template = ((statusCode !== 200) || (post.channel && post.channel[0] === 'pages'))
    ? 'page'
    : 'post'
  const body = nunjucks.render(`${template}.njk`, {
    post,
    metadata: metadata(post),
    helpers,
    urls,
    url
  })
  const raw = JSON.stringify(
    { type: post.type, properties: post.properties }, null, 2)
  return {
    statusCode,
    body,
    raw
  }
}

async function handleUrl (url, params) {
  const { before, mf2json } = params
  // category pages, e.g. /categories/indieweb
  if (url.substr(0, 11) === 'categories/') {
    const category = url.substr(11, url.length - 11)
    const data = await api.getCategory(category, before)
    return {
      ...httpHeaders(oneHourInSeconds),
      statusCode: 200,
      body: await renderList(data, `#${category}`)
    }
  // index pages, e.g. /articles
  } else if (postTypePlurals.includes(url)) {
    // post types e.g. notes (no trailing slash)
    let postType = url.substr(0, url.length - 1)
    if (postType === 'replie') postType = 'reply'
    let title = helpers.pluralise(postType)
    title = title.charAt(0).toUpperCase() + title.substr(1) // initial cap
    const data = await api.getPostType(postType, before)
    return {
      ...httpHeaders(oneHourInSeconds),
      statusCode: 200,
      body: await renderList(data, title)
    }
  // date archive: year, month or day
  } else if (url.match(/^[0-9]{4}(\/[0-9]{2})?(\/[0-9]{2})?$/)) {
    const dateParts = url.split('/')
    const year = dateParts[0]
    const month = dateParts[1] || null
    const day = dateParts[2] || null
    const published = url.replace(/\//g, '-')
    const data = await api.getPublished(published, before)
    return {
      ...httpHeaders(oneHourInSeconds),
      statusCode: 200,
      body: await renderList(data, published, year, month, day)
    }
  // all posts
  } else if (url === 'all') {
    const data = await api.getAll(before)
    return {
      ...httpHeaders(oneYearInSeconds),
      statusCode: 200,
      body: await renderList(data, 'All')
    }
  // categories, month archives
  } else if (url === 'archives') {
    const categories = await api.getCategories()
    const c = (params.c || '').toLowerCase()
    let filteredCategories
    if (c) {
      filteredCategories = categories.filter(category => category.startsWith(c))
    }
    return {
      ...httpHeaders(oneDayInSeconds),
      statusCode: 200,
      body: await renderArchives(categories, filteredCategories, c)
    }
  // root index page at /
  } else if (url === '') {
    const data = await api.getHomepage()
    return {
      ...httpHeaders(oneDayInSeconds),
      statusCode: 200,
      body: await renderIndex(data)
    }
  // redirect legacy *.json paths to *?mf2json
  } else if (url.slice(-5) === '.json') {
    return redirect301(`${url.slice(0, -5)}?mf2json`)
  // redirect tags/* => categories/*
  } else if (url.slice(0, 5) === 'tags/') {
    const category = url.slice(5)
    return redirect301(`categories/${category}`)
  // redirect tag/* => categories/*
  } else if (url.slice(0, 4) === 'tag/') {
    const category = url.slice(4)
    return redirect301(`categories/${category}`)
  // redirect index.xml and feed => rss
  } else if (url === 'index.xml' || url === 'rss.xml' || url === 'feed') {
    return redirect301('rss')
  // categories as javascript array
  } else if (url === 'categories.js') {
    const categories = await api.getCategories()
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/javascript; charset=utf8',
        'Cache-Control': `s-maxage=${oneDayInSeconds}`
      },
      body: `var categories = ${JSON.stringify(categories)};`
    }
  // catch all - assume this is a post or page
  } else {
    const post = await api.getPost(url)
    post.url = [process.env.ROOT_URL + url]
    const { statusCode, body, raw } = renderPost(post, url)
    if (mf2json !== undefined) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/javascript; charset=utf8',
          'Cache-Control': `s-maxage=${oneHourInSeconds}`
        },
        body: raw
      }
    }
    return {
      ...httpHeaders(oneYearInSeconds),
      statusCode,
      body
    }
  }
}

exports.handler = async function http (req) {
  // strip initial/ending slash, remove any api gateway stage, clean characters
  const url = req.rawPath.substr(1).replace(/[^a-z0-9./-]/, '').replace(/\/$/, '')
  const params = req.queryStringParameters || {}
  return handleUrl(url, params)
}
