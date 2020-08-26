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
  cssPath: arc.static('/style.css'),
  faviconPath: arc.static('/barryfrost-favicon.png'),
  micropubUrl: process.env.MICROPUB_URL
}

const helpers = {
  urlHost: function (u) {
    const url = new URL(u)
    return url.host
  }
}

function humanDate (dateString) {
  return new Date(dateString).toLocaleString('en-gb', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
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
  // console.log(JSON.stringify(response))
  if (!response.ok) return
  const json = await response.json()
  console.log('json', JSON.stringify(json, null, 2))
  const posts = json.items.map(post => {
    if ('content' in post.properties) {
      if (typeof post.properties.content[0] === 'string') {
        post._contentHtml = md.render(post.properties.content[0])
      } else {
        post._contentHtml = post.properties.content[0].html
      }
    }
    post._publishedHuman = humanDate(post.properties.published[0])
    return post
  })
  // console.log('posts', posts)
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
  // console.log('micropub response', body)
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
  const post = { ...body }
  // TODO: this is duplicated from above so split into function
  if ('content' in post.properties) {
    if (typeof post.properties.content[0] === 'string') {
      post._contentHtml = md.render(post.properties.content[0])
    } else {
      post._contentHtml = post.properties.content[0].html
    }
  }
  if (!template) template = post['post-type'][0] + '.njk'
  post._publishedHuman = humanDate(post.properties.published[0])
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
  // strip initial slash, remove any api gateway stage, clean characters
  const url = req.path.substr(1).replace(/^staging\//, '')
    .replace(/[^a-z0-9/-]/, '')
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
    return { ...httpHeaders, body: await getCategory(category, before) }
  // index pages, e.g. /articles
  } else if (postTypePlurals.includes(url)) {
    // post types e.g. notes (no trailing slash)
    let postType = url.substr(0, url.length - 1)
    if (postType === 'replie') postType = 'reply'
    return { ...httpHeaders, body: await getPostType(postType, before) }
  // date archive: year, month or day
  } else if (url.match(/^[0-9]{4}(\/[0-9]{2})?(\/[0-9]{2})?$/)) {
    const published = url.replace(/\//g, '-')
    return { ...httpHeaders, body: await getPublished(published, before) }
  // all posts
  } else if (url === 'all') {
    return { ...httpHeaders, body: await getAll(before) }
  // root index page at /
  } else if (url === '') {
    return { ...httpHeaders, body: await getIndex() }
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
