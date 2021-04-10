// Redirect legacy paths from a previous site
// e.g. /articles/ux-london => /2014/06/ux-london

const paths = {
  'get-your-eyes-lasered': '2011/05/get-your-eyes-lasered',
  'the-recruitment-threesome': '2011/05/the-recruitment-threesome',
  'witness-the-fitness': '2011/06/witness-the-fitness',
  'hacker-jobs-interview': '2017/10/hacker-jobs-interview',
  'monitoring-my-broadband-connection': '2013/11/monitoring-my-broadband-connection',
  'ux-london': '2014/06/ux-london',
  'i-ve-just-set-up-ssl': '2015/01/i-ve-just-set-up-ssl',
  'how-to-comment': '2015/01/how-to-comment'
}

function findPath (slug) {
  if (slug in paths) {
    return paths[slug]
  }
  return ''
}

exports.handler = async function http (req) {
  const { slug } = req.pathParameters
  const path = findPath(slug)
  const url = new URL(path, process.env.ROOT_URL).href
  return {
    statusCode: 301,
    headers: {
      Location: url
    }
  }
}
