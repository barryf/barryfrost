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

// Properties that should always remain as arrays
const arrayProperties = [
  'category',
  'syndication',
  'in-reply-to',
  'repost-of',
  'like-of',
  'bookmark-of',
  'comment',
  'like',
  'repost',
  'rsvp',
  'bookmark'
]

const micropubSourceUrl = `${process.env.MICROPUB_URL}?q=source`
const paths = {
  cssPath: arc.static('/style.css'),
  faviconPath: arc.static('/barryfrost-favicon.png')
}

function flatten (post) {
  for (const key in post) {
    if (Array.isArray(post[key]) && post[key].length === 1 &&
      !arrayProperties.includes(key)) {
      post[key] = post[key][0]
    }
  }
}

function humanDate (dateString) {
  return new Date(dateString).toLocaleString('en-gb', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

async function getIndex () {
  return nunjucks.render('index.njk', { ...paths })
}

async function getPostType (postType, before) {
  return getList(`${micropubSourceUrl}&post-type=${postType}`, before)
}

async function getCategory (category, before) {
  return getList(`${micropubSourceUrl}&category=${category}`, before)
}

async function getList (url, before) {
  if (before) url = url + '&before=' + parseInt(before, 10)
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  // console.log(JSON.stringify(response))
  if (!response.ok) return
  const json = await response.json()
  const posts = json.items.map(item => {
    const post = { ...item.properties }
    flatten(post)
    if ('content' in post) {
      if (typeof post.content === 'string') {
        post._contentHtml = md.render(post.content)
      } else {
        post._contentHtml = post.content.html
      }
    }
    post._publishedHuman = humanDate(post.published)
    return post
  })
  // console.log('posts', posts)
  const lastPublishedInt = (posts.length === 20)
    ? new Date(posts.slice(-1)[0].published).valueOf()
    : null
  return nunjucks.render('list.njk', { posts, lastPublishedInt, ...paths })
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
  const post = { ...body.properties }
  flatten(post)
  if ('content' in post) {
    if (typeof post.content === 'string') {
      post._contentHtml = md.render(post.content)
    } else {
      post._contentHtml = post.content.html
    }
  }
  if (!template) template = post['post-type'] + '.njk'
  post._publishedHuman = humanDate(post.published)
  const postJSON = JSON.stringify(post, null, 2)
  const html = nunjucks.render(template, { post, postJSON, ...paths })
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
  if (url === 'faviconico') {
    // temp reject favicon
    return { statusCode: 404 }
    //
  } else if (url.substr(0, 11) === 'categories/') {
    const category = url.substr(11, url.length - 11)
    return { ...httpHeaders, body: await getCategory(category, before) }
    //
  } else if (postTypePlurals.includes(url)) {
    // post types e.g. notes (no trailing slash)
    let postType = url.substr(0, url.length - 1)
    if (postType === 'replie') postType = 'reply'
    return { ...httpHeaders, body: await getPostType(postType, before) }
    //
  } else if (url === '') {
    // root is homepage
    return { ...httpHeaders, body: await getIndex() }
    //
  }
  // default, assume a 200 post (or 404, 410)
  const response = await getPost(url)
  return {
    ...httpHeaders,
    statusCode: response.statusCode,
    body: response.body
  }
}
