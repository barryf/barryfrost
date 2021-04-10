exports.handler = async function http (req) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=3600'
    },
    body: `User-agent: *
Disallow: /all
Disallow: /categories
`
  }
}
