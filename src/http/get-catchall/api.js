const fetch = require('node-fetch')

const micropubSourceUrl = `${process.env.MICROPUB_URL}?q=source`

async function getPostType (postType, before) {
  return getList(
    `${micropubSourceUrl}&post-type=${postType}`,
    before
  )
}

async function getCategory (category, before) {
  return getList(
    `${micropubSourceUrl}&category=${category}`,
    before
  )
}

async function getPublished (published, before) {
  return getList(
    `${micropubSourceUrl}&published=${published}`,
    before
  )
}

async function getAll (before) {
  return getList(micropubSourceUrl, before)
}

async function getList (url, before = null) {
  const limit = 20
  if (before) url = url + '&before=' + parseInt(before, 10)
  // return n+1 rows to check if there is another page
  url += `&limit=${limit + 1}`
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (!response.ok) return
  let posts = (await response.json()).items
  const lastPublishedInt = (posts.length === (limit + 1))
    ? new Date(posts.slice(-1)[0].properties.published[0]).valueOf()
    : null
  posts = posts.slice(0, limit)
  posts.lastPublishedInt = lastPublishedInt
  return posts
}

async function getPost (url) {
  const response = await fetch(
    `${micropubSourceUrl}&url=${process.env.ROOT_URL}${url}`,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  switch (response.status) {
    case 200:
      return await response.json()
    case 410:
      return {
        statusCode: response.status,
        type: ['h-entry'],
        properties: {
          name: ['`410` Gone'],
          content: ['This post has been deleted and is no longer available.']
        }
      }
    case 404:
      return {
        statusCode: response.status,
        type: ['h-entry'],
        properties: {
          name: ['`404` Not Found'],
          content: ['The page or post was not found.']
        }
      }
  }
  const error = await response.json()
  return {
    statusCode: response.status,
    type: ['h-entry'],
    properties: {
      name: ['Error'],
      content: [error.error_description]
    }
  }
}

async function getCategories () {
  const response = await fetch(
    `${process.env.MICROPUB_URL}?q=category`,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (response.status === 200) {
    return await response.json()
  }
}

module.exports = {
  getPost,
  getPostType,
  getCategory,
  getPublished,
  getAll,
  getCategories
}
