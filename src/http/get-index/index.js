const arc = require('@architect/functions')
const fetch = require('node-fetch')
const hljs = require('highlight.js')
const md = require('markdown-it')({
  linkify: true,
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value
      } catch (__) {}
    }
    return ''
  }
})
const nunjucks = require('nunjucks')
nunjucks.configure('views')

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

const micropubSourceUrl = `${process.env.MICROPUB_URL}?q=source`

const paths = {
  rootPath: process.env.ROOT_URL,
  cssUrl: arc.static('/style.css'),
  faviconUrl: arc.static('/barryfrost-favicon.png'),
  micropubUrl: process.env.MICROPUB_URL,
  webmentionUrl: 'https://webmention.io/barryf/webmention'
}

const helpers = {
  urlHost: function (u) {
    const url = new URL(u)
    return url.host
  },
  content: function (post) {
    if ('content' in post.properties) {
      if (typeof post.properties.content[0] === 'string') {
        return md.render(post.properties.content[0]).trim()
      } else {
        return post.properties.content[0].html.trim()
      }
    } else {
      return ''
    }
  },
  humanDate: function (dateString) {
    return new Date(dateString).toLocaleString('en-gb', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }
}

async function getIndex () {
  return nunjucks.render('index.njk', {
    ...helpers,
    ...paths
  })
}

async function getPostType (postType, before) {
  return getList(`${micropubSourceUrl}&post-type=${postType}`, before)
}

async function getCategory (category, before) {
  return getList(`${micropubSourceUrl}&category=${category}`, before)
}

async function getPublished (published, before) {
  return getList(`${micropubSourceUrl}&published=${published}`, before)
}

async function getAll (before) {
  return getList(micropubSourceUrl, before)
}

async function getList (url, before = null) {
  if (before) url = url + '&before=' + parseInt(before, 10)
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (!response.ok) return
  const json = await response.json()
  const posts = json.items
  const lastPublishedInt = (posts.length === 20)
    ? new Date(posts.slice(-1)[0].properties.published[0]).valueOf()
    : null
  return nunjucks.render('list.njk', {
    posts,
    lastPublishedInt,
    ...helpers,
    ...paths
  })
}

async function getPost (url) {
  const response = await fetch(
    `${micropubSourceUrl}&url=${process.env.ROOT_URL}${url}`,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  const body = await response.json()
  let template
  switch (response.status) {
    case 200:
      break
    case 410:
      template = 'gone.njk'
      break
    case 404:
      return {
        statusCode: 404,
        body: nunjucks.render('not-found.njk', paths)
      }
    default:
      return {
        statusCode: response.status,
        body: body.error_description
      }
  }
  const post = { ...body, url }
  if (!url.match(/\//)) template = 'page.njk'
  if (!template) template = post['post-type'] + '.njk'
  const postJSON = JSON.stringify(post, null, 2)
  const html = nunjucks.render(template, {
    post,
    postJSON,
    ...helpers,
    ...paths
  })
  return {
    statusCode: response.status,
    body: html
  }
}

exports.handler = async function http (req) {
  const { before } = req.queryStringParameters || {}
  // strip initial/ending slash, remove any api gateway stage, clean characters
  const url = req.rawPath.substr(1).replace(/^staging\//, '')
    .replace(/[^a-z0-9/-]/, '').replace(/\/$/, '')
  const httpHeaders = {
    headers: {
      'Content-Type': 'text/html; charset=utf8',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "script-src 'self'"
    }
  }
  // category pages, e.g. /categories/indieweb
  if (url.substr(0, 11) === 'categories/') {
    const category = url.substr(11, url.length - 11)
    return {
      ...httpHeaders,
      statusCode: 200,
      body: await getCategory(category, before)
    }
  // index pages, e.g. /articles
  } else if (postTypePlurals.includes(url)) {
    // post types e.g. notes (no trailing slash)
    let postType = url.substr(0, url.length - 1)
    if (postType === 'replie') postType = 'reply'
    return {
      ...httpHeaders,
      statusCode: 200,
      body: await getPostType(postType, before)
    }
  // date archive: year, month or day
  } else if (url.match(/^[0-9]{4}(\/[0-9]{2})?(\/[0-9]{2})?$/)) {
    const published = url.replace(/\//g, '-')
    return {
      ...httpHeaders,
      statusCode: 200,
      body: await getPublished(published, before)
    }
  // all posts
  } else if (url === 'all') {
    return {
      ...httpHeaders,
      statusCode: 200,
      body: await getAll(before)
    }
  // root index page at /
  } else if (url === '') {
    return {
      ...httpHeaders,
      statusCode: 200,
      body: await getIndex()
    }
  // catch all - assume this is a post
  } else {
    const response = await getPost(url)
    return {
      ...httpHeaders,
      statusCode: response.statusCode,
      body: response.body
    }
  }
}
