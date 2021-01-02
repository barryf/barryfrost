const arc = require('@architect/functions')
const fetch = require('node-fetch')
const sanitizeHtml = require('sanitize-html')
const nunjucks = require('nunjucks')
nunjucks.configure('views')
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

const micropubSourceUrl = `${process.env.MICROPUB_URL}?q=source`

const paths = {
  rootPath: process.env.ROOT_URL,
  cssUrl: arc.static(`/styles${
    process.env.NODE_ENV !== 'production' ? '-dev' : ''
    }.css`),
  faviconUrl: arc.static('/barryfrost-favicon.png'),
  micropubUrl: process.env.MICROPUB_URL,
  webmentionUrl: 'https://webmention.io/barryf/webmention'
}

function getMetadata (post) {
  let title = ''
  if (post.properties.name) {
    title = post.properties.name[0]
  } else {
    title = post['post-type'][0].charAt(0).toUpperCase() +
      post['post-type'][0].slice(1) +
      ': ' +
      post.url.split('/').slice(-1)
  }
  let description = ''
  // use post content for the description if it exists
  if (post.properties.content) {
    description = helpers.content(post)
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
  const limit = 10
  if (before) url = url + '&before=' + parseInt(before, 10)
  // return n+1 rows to check if there is another page
  url += `&limit=${limit + 1}`
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (!response.ok) return
  const json = await response.json()
  const posts = json.items
  const lastPublishedInt = (posts.length === (limit + 1))
    ? new Date(posts.slice(-2)[0].properties.published[0]).valueOf()
    : null
  return nunjucks.render('list.njk', {
    posts: posts.slice(0, limit),
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
  let body, template
  switch (response.status) {
    case 200:
      body = await response.json()
      break
    case 410:
      body = {
        properties: {
          name: ['410 Gone'],
          content: ['This post has been deleted and is no longer available.']
        }
      }
      template = 'page.njk'
      break
    case 404:
      body = {
        properties: {
          name: ['404 Not Found'],
          content: ['The page or post was not found.']
        }
      }
      template = 'page.njk'
      break
    default:
      body = await response.json()
      return {
        statusCode: response.status,
        body: body.error_description
      }
  }
  const post = { ...body, url: `${process.env.ROOT_URL}${url}` }
  if (!template) template = 'post.njk'
  const html = nunjucks.render(template, {
    post,
    raw: JSON.stringify(post, null, 2),
    metadata: getMetadata(post),
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
      'Cache-Control': 's-maxage=60',
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
