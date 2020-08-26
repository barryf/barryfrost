// TODO: mf2
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
    // image_url: process.env.ROOT_URL + 'icon.png', // TODO add image
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
    feed.item({
      title: ('name' in post.properties) ? post.properties.name[0] : '',
      description: ('content' in post.properties &&
        typeof post.properties.content[0] === 'string')
        ? md.render(post.properties.content[0])
        : post.properties.content[0].html,
      url: post.properties.url[0],
      date: post.properties.published[0]
    })
  })

  return {
    headers: {
      // 'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/xml; charset=utf8'
    },
    body: feed.xml({ indent: true })
  }
}
