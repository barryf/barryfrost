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
  const cfUrl = `https://api.cloudflare.com/client/v4/${zone}/purge_cache`
  const url = new URL(body.url, process.env.ROOT_URL).href
  const response = await fetch(cfUrl, {
    method: 'post',
    headers: {
      'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
      'X-Auth-Key': process.env.CLOUDFLARE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files: [url] })
  })
  const result = await response.json()
  return {
    statusCode: result.success ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: result.success
        ? 'Cloudflare purge of URL was successful'
        : 'Cloudflare returned an error from purge request',
      url,
      result
    })
  }
}
