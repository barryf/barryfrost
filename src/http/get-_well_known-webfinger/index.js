exports.handler = async function http (req) {
  return {
    statusCode: 302,
    headers: {
      Location: `https://fed.brid.gy/.well-known/webfinger?${req.rawQueryString}`
    }
  }
}
