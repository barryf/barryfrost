// image proxy for legacy /barryfrost.jpg image

const fetch = require('node-fetch')
const arc = require('@architect/functions')

async function fetchImage () {
  const url = new URL(arc.static('/barryfrost.jpg'), process.env.ROOT_URL).href
  const response = await fetch(url)
  const buffer = await response.buffer()
  const image = Buffer.from(buffer).toString('base64')
  return image
}

exports.handler = async function http (req) {
  const image = await fetchImage()
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': `max-age=${60 * 60}, s-maxage=${60 * 60 * 24 * 365}`
    },
    body: image.toString('base64'),
    isBase64Encoded: true
  }
}
