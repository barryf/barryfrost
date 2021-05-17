const RSS = require('rss')
const fetch = require('node-fetch')
const md = require('markdown-it')({
  linkify: true,
  html: true
})

async function getPosts (qs = 'homepage') {
  const url = `${process.env.MICROPUB_URL}?q=source&${qs}`
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (!response.ok) return { statusCode: 400 }
  return await response.json()
}

function createFeed (postsMf2, title = null) {
  const feed = new RSS({
    title: `Barry Frost${title ? ' – ' + title : ''}`,
    description: "Barry Frost's personal website.",
    feed_url: process.env.ROOT_URL + 'rss',
    site_url: process.env.ROOT_URL,
    image_url: new URL('/barryfrost.jpg', process.env.ROOT_URL).href,
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
      for (const photo of post.properties.photo) {
        if (photo.value) {
          description += `<p><img src="${photo.value}" alt="${photo.alt || ''}"></p>\n`
        } else {
          description += `<p><img src="${photo}"></p>\n`
        }
      }
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
  let qs
  let title
  if ('post-type' in params &&
    ['article', 'note', 'photo'].includes(params['post-type'])) {
    qs = `post-type=${params['post-type']}`
    title = params['post-type'] + 's'
  }
  const postsMf2 = await getPosts(qs)
  const feed = createFeed(postsMf2, title)
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 's-maxage=600'
    },
    body: feed.xml({ indent: true })
  }
}
