exports.handler = async function http (req) {
  const { slug } = req.pathParameters
  return {
    statusCode: 302,
    headers: {
      Location: `https://fed.brid.gy/.well-known/host-meta/${slug}`
    }
  }
}
