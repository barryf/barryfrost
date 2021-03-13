const arc = require('@architect/functions')
const RSS = require('rss')
const fetch = require('node-fetch')
const md = require('markdown-it')({
  linkify: true,
  html: true
})

async function getPosts (params) {
  let url = `${process.env.MICROPUB_URL}?q=source&`
  if ('post-type' in params &&
    ['article', 'note', 'photo'].includes(params['post-type'])) {
    url += `post-type=${params['post-type']}`
  } else {
    url += 'homepage'
  }
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (!response.ok) return { statusCode: 400 }
  return await response.json()
}

function createFeed (postsMf2) {
  const feed = new RSS({
    title: 'Barry Frost',
    description: "Barry Frost's personal website.",
    feed_url: process.env.ROOT_URL + 'rss',
    site_url: process.env.ROOT_URL,
    image_url: new URL(arc.static('/barryfrost-favicon.png'), process.env.ROOT_URL).href,
    language: 'en-GB'
  })
  postsMf2.items.forEach(post => {
    const item = {
      title: ('name' in post.properties) ? post.properties.name[0] : '',
      url: post.url[0],
      date: post.properties.published[0]
    }
    let description = ''
    if ('photo' in post.properties) {
      description += `<p><img src="${post.properties.photo[0]}"></p>\n`
    }
    if ('summary' in post.properties) {
      description += post.properties.summary[0]
    } else if ('content' in post.properties) {
      description += typeof post.properties.content[0] === 'string'
        ? md.render(post.properties.content[0])
        : post.properties.content[0].html || ''
      description += '\n'
    }
    if (description !== '') { item.description = description.trim() }
    feed.item(item)
  })
  return feed
}

exports.handler = async function http (req) {
  const params = req.queryStringParameters || {}
  const postsMf2 = await getPosts(params)
  const feed = createFeed(postsMf2)
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 's-maxage=600'
    },
    body: feed.xml({ indent: true })
  }
}
