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

async function getHomepage () {
  const posts = await getList(`${micropubSourceUrl}&homepage`, null, 50)
  const weeknotes = await getList(`${micropubSourceUrl}&category=weeknotes`, null, 15)
  const homepagePost = await getPost('homepage')
  const content = homepagePost.properties.content[0].html
  return { content, ...posts, weeknotes }
}

async function getList (url, before = null, limit = 20) {
  if (before) url = url + '&before=' + parseInt(before, 10)
  // return n+1 rows to check if there is another page
  url += `&limit=${limit + 1}`
  const response = await fetch(url,
    { headers: { Authorization: `Bearer ${process.env.MICROPUB_TOKEN}` } }
  )
  if (!response.ok) return
  const posts = (await response.json()).items
  const nextInt = (posts.length === (limit + 1))
    ? new Date(posts.slice(-1)[0].properties.published[0]).valueOf()
    : null
  return {
    posts: posts.slice(0, limit),
    nextInt
  }
}

async function getPost (url) {
  const absoluteUrl = new URL(url, process.env.ROOT_URL).href
  const queryString = new URLSearchParams({
    url: absoluteUrl,
    'include-contexts': 1
  }).toString()
  const response = await fetch(`${micropubSourceUrl}&${queryString}`,
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
          name: ['410'],
          content: [
            'This post has been deleted and is no longer available.'
          ]
        }
      }
    case 404:
      return {
        statusCode: response.status,
        type: ['h-entry'],
        properties: {
          name: ['404'],
          content: [
            'The page or post could not be found. Check that you entered the URL correctly.'
          ]
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
    const categories = await response.json()
    // remove urls
    return categories.filter(c => !c.match(/^https?:/))
  }
}

module.exports = {
  getPost,
  getPostType,
  getCategory,
  getPublished,
  getAll,
  getCategories,
  getHomepage
}
