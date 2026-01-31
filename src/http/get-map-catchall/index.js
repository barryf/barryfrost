async function fetchImage (lat = 0, lng = 0, zoom = 15) {
  const token = process.env.MAPBOX_ACCESS_TOKEN
  const url = 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/static/' +
    `pin-l-embassy+f59e0b(${lng},${lat})/` +
    `${lng},${lat},${zoom}/624x312@2x?access_token=${token}`
  const response = await fetch(url)
  if (response.status !== 200) {
    const text = await response.text()
    console.error('Error from Mapbox', text)
  } else {
    const arrayBuffer = await response.arrayBuffer()
    const image = Buffer.from(arrayBuffer).toString('base64')
    return image
  }
}

async function getPostLocation (url) {
  const absoluteUrl = process.env.ROOT_URL + url
  const response = await fetch(
    `${process.env.MICROPUB_URL}?q=source&url=${absoluteUrl}`,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (response.status === 200) {
    const post = await response.json()
    if (post && post.properties) {
      if (post.properties.location) {
        return {
          lat: post.properties.location[0].properties.latitude[0],
          lng: post.properties.location[0].properties.longitude[0]
        }
      } else if (post.properties.checkin) {
        return {
          lat: post.properties.checkin[0].properties.latitude[0],
          lng: post.properties.checkin[0].properties.longitude[0]
        }
      }
    }
  }
  return { lat: 0, lng: 0 }
}

exports.handler = async function http (req) {
  const { proxy } = req.pathParameters
  const url = proxy.slice(0, proxy.length - 4).replace(/[^a-z0-9/-]/, '')
  const { lat, lng } = await getPostLocation(url)
  if (lat === 0 && lng === 0) {
    return {
      statusCode: 404
    }
  }
  const image = await fetchImage(lat, lng)
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 's-maxage=' + 60 * 60 * 24 * 365
    },
    body: image.toString('base64'),
    isBase64Encoded: true
  }
}
