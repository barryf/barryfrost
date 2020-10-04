const arc = require('@architect/functions')
const RSS = require('rss')
const fetch = require('node-fetch')
const md = require('markdown-it')({
  linkify: true,
  html: true
})

exports.handler = async function http (req) {
  const feed = new RSS({
    title: 'Barry Frost',
    description: "Barry Frost's personal website.",
    feed_url: process.env.ROOT_URL + 'rss',
    site_url: process.env.ROOT_URL,
    image_url: arc.static('/barryfrost-favicon.png'),
    language: 'en'
  })

  const url = process.env.MICROPUB_URL +
    '?q=source&limit=10&post-type[]=note&post-type[]=article&post-type[]=photo'
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (!response.ok) return { statusCode: 400 }
  const postsMf2 = await response.json()

  postsMf2.items.forEach(post => {
    const item = {
      title: ('name' in post.properties) ? post.properties.name[0] : '',
      url: post.url[0],
      date: post.properties.published[0]
    }
    if ('content' in post.properties) {
      item.description = typeof post.properties.content[0] === 'string'
        ? md.render(post.properties.content[0])
        : post.properties.content[0].html || ''
    }
    feed.item(item)
  })

  return {
    statusCode: 200,
    'Content-Type': 'text/xml; charset=utf-8',
    body: feed.xml({ indent: true })
  }
}
