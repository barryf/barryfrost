const arc = require('@architect/functions')
const fetch = require('node-fetch')
const md = require('markdown-it')({
  linkify: true,
  html: true
})

async function getPosts () {
  const url = `${process.env.MICROPUB_URL}?q=source&homepage`
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (!response.ok) return { statusCode: 400 }
  return await response.json()
}

function createFeed (postsMf2) {
  const feed = {
    version: 'https://jsonfeed.org/version/1',
    title: 'Barry Frost',
    home_page_url: process.env.ROOT_URL,
    feed_url: new URL('feed.json', process.env.ROOT_URL).href,
    author: {
      name: 'Barry Frost',
      url: process.env.ROOT_URL,
      avatar: new URL(arc.static('/barryfrost-favicon.png'), process.env.ROOT_URL).href
    },
    items: []
  }
  for (const post of postsMf2.items) {
    const item = {
      id: post.url[0],
      url: post.url[0],
      date_published: post.properties.published[0]
    }
    if ('updated' in post.properties) {
      item.date_modified = post.properties.updated[0]
    }
    if ('name' in post.properties) {
      item.title = post.properties.name[0]
    }
    if ('summary' in post.properties) {
      item.content_html = post.properties.summary[0]
    } else if ('content' in post.properties) {
      item.content_html = typeof post.properties.content[0] === 'string'
        ? md.render(post.properties.content[0])
        : post.properties.content[0].html || ''
    }
    if ('photo' in post.properties) {
      const photo = post.properties.photo[0]
      item.image = typeof photo === 'string' ? photo : photo.value
    }
    if ('category' in post.properties) {
      item.tags = post.properties.category
    }
    feed.items.push(item)
  }
  return feed
}

exports.handler = async function http (req) {
  const postsMf2 = await getPosts()
  const feed = createFeed(postsMf2)
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 's-maxage=600'
    },
    body: JSON.stringify(feed, null, 2)
  }
}
