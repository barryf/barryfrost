const arc = require('@architect/functions')
const fetch = require('node-fetch')

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)

  // abort if cloudflare env vars not set up
  if (!process.env.CLOUDFLARE_KEY ||
    !process.env.CLOUDFLARE_EMAIL ||
    !process.env.CLOUDFLARE_ZONE
  ) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Missing Cloudflare ENV variables'
      })
    }
  }

  // purge cloudflare cache for url
  const zone = process.env.CLOUDFLARE_ZONE
  const cfUrl = `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`
  const files = [
    new URL(body.url, process.env.ROOT_URL).href,
    `${process.env.ROOT_URL}`,
    `${process.env.ROOT_URL}all`
  ]
  const response = await fetch(cfUrl, {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + process.env.CLOUDFLARE_TOKEN,
      'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
      'X-Auth-Key': process.env.CLOUDFLARE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files })
  })
  const result = await response.json()
  return {
    statusCode: result.success ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: result.success
        ? 'Cloudflare purge of URL was successful'
        : 'Cloudflare returned an error from purge request',
      url: body.url,
      result
    })
  }
}
