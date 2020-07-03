const arc = require('@architect/functions')
const fetch = require('node-fetch')
const nunjucks = require('nunjucks')
const markdown = require('nunjucks-markdown')
const marked = require('marked')

const njkEnv = nunjucks.configure('views')
markdown.register(njkEnv, marked)

const micropubSourceUrl = 'http://localhost:3333/micropub?q=source'

function flattenProperties (properties) {
  for (const prop in properties) {
    if (Array.isArray(properties[prop]) && properties[prop].length === 1) {
      properties[prop] = properties[prop][0]
    }
  }
}

async function getIndex () {
  const css = arc.static('/main.css')
  const data = await arc.tables()
  const result = await data.posts.scan({ TableName: 'posts' })
  const posts = result.Items.map(item => JSON.parse(item.properties))
  const html = nunjucks.render('homepage.njk', { posts, css })
  return html
}

async function getPostType (postType) {
  const css = arc.static('/main.css')
  // const data = await arc.tables()
  // const result = await data.posts.scan({ // should be a query?
  //   TableName: 'posts',
  //   FilterExpression: 'post-type = :postType',
  //   ExpressionAttributeValues: {
  //     ':postType': postType
  //   }
  // })
  // const posts = result.Items.map(item => item.properties)
  const response = await fetch(`${micropubSourceUrl}&post-type=${postType}`)
  if (!response.ok) return
  const json = await response.json()
  console.log(json)
  const posts = json.items.map(item => {
    const post = { ...item.properties }
    flattenProperties(post)
    return post
  })
  const html = nunjucks.render('homepage.njk', { posts, css })
  return html
}

async function getPost (slug) {
  const css = arc.static('/main.css')
  // const data = await arc.tables()
  // const postData = await data.posts.get({ slug })
  const response = await fetch(`${micropubSourceUrl}&url=${slug}`)
  if (!response.ok) return
  const json = await response.json()
  const post = { ...json.properties }
  console.log(json)
  flattenProperties(post)
  const postJSON = JSON.stringify(post, null, 2)
  const html = nunjucks.render('post.njk', { post, css, postJSON })
  return html
}

exports.handler = async function http (req) {
  // accepted post types from server
  const postTypes = ['notes', 'articles', 'bookmarks', 'photos', 'checkins',
    'reposts', 'likes', 'replies']
  // strip initial slash, remove any api gateway stage, clean characters
  const url = req.path.substr(1).replace(/^staging\//, '')
    .replace(/[^a-z0-9/-]/, '')
  const res = {
    headers: { 'content-type': 'text/html; charset=utf8' }
  }
  // temp reject favicon
  if (url === 'favicon.ico') {
    return { statusCode: 404 }
  // post types e.g. notes (no trailing slash)
  } else if (postTypes.includes(url)) {
    let postType = url.substr(0, url.length - 1)
    if (postType === 'replie') postType = 'reply'
    return { ...res, body: await getPostType(postType) }
  // root is homepage
  } else if (url === '') {
    return { ...res, body: await getIndex() }
  // default, assume a post
  } else {
    const body = await getPost(url)
    if (body) {
      return { ...res, body }
    } else {
      return { statusCode: 404 }
    }
  }
}
