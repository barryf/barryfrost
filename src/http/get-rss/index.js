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
    image_url: new URL(arc.static('/barryfrost-favicon.png'), process.env.ROOT_URL).href,
    language: 'en'
  })

  const url = 'http://localhost:3333/micropub?q=source&post-type=article'
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
    let description = ''
    if ('photo' in post.properties) {
      description += `<img src="${post.properties.photo[0]}">\n\n`
    }
    if ('like-of' in post.properties) {
      description += `Liked a post on ${post.properties['like-of'][0]}\n\n`
    }
    if ('repost-of' in post.properties) {
      description += `Reposted a post on ${post.properties['repost-of'][0]}\n\n`
    }
    if ('checkin' in post.properties) {
      description += post.properties.checkin[0].properties.name[0] + '\n\n'
    }
    if ('summary' in post.properties) {
      description += post.properties.summary[0]
    } else if ('content' in post.properties) {
      description += typeof post.properties.content[0] === 'string'
        ? md.render(post.properties.content[0])
        : post.properties.content[0].html || ''
      description += '\n'
    }
    if (description !== '') { item.description = description }
    feed.item(item)
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 's-maxage=600'
    },
    body: feed.xml({ indent: true })
  }
}
