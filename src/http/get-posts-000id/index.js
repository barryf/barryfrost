// Redirect legacy paths from a previous site
// e.g. /posts/1 => /2013/09/baker-1

const paths = {
  1: '2013/09/baker-1',
  11: '2013/09/baker-11',
  13: '2013/09/baker-13',
  16: '2013/09/baker-16',
  20: '2013/09/baker-20',
  24: '2013/09/baker-24',
  25: '2013/09/baker-25',
  26: '2013/09/baker-26',
  27: '2013/09/baker-27',
  28: '2013/09/baker-28',
  29: '2013/09/baker-29',
  33: '2013/09/baker-33',
  34: '2013/09/baker-34',
  35: '2013/09/baker-35',
  36: '2013/09/baker-36',
  37: '2013/09/baker-37',
  38: '2013/10/baker-38',
  39: '2013/10/baker-39',
  41: '2013/10/baker-41',
  42: '2013/10/baker-42',
  44: '2013/10/baker-44',
  45: '2013/10/baker-45',
  51: '2013/10/baker-51',
  53: '2013/10/baker-53',
  57: '2013/10/baker-57',
  59: '2013/10/baker-59',
  60: '2013/10/baker-60',
  61: '2013/10/baker-61',
  62: '2013/11/baker-62',
  63: '2013/11/baker-63',
  64: '2013/11/baker-64',
  65: '2013/11/baker-65',
  66: '2013/11/baker-66',
  67: '2013/11/baker-67',
  71: '2013/12/baker-71',
  73: '2013/12/baker-73',
  79: '2014/01/baker-79',
  80: '2014/01/baker-80',
  82: '2014/01/baker-82',
  83: '2014/02/baker-83',
  84: '2014/02/baker-84',
  87: '2014/02/baker-87',
  89: '2014/03/baker-89',
  90: '2014/03/baker-90',
  91: '2014/03/baker-91',
  92: '2014/03/baker-92',
  93: '2014/03/baker-93',
  96: '2014/04/baker-96',
  97: '2014/04/baker-97',
  99: '2014/05/baker-99',
  100: '2014/05/baker-100',
  101: '2014/05/baker-101',
  103: '2014/06/baker-103',
  104: '2014/08/baker-104',
  105: '2014/08/baker-105',
  108: '2014/09/baker-108',
  109: '2014/09/baker-109',
  110: '2014/11/baker-110',
  111: '2014/11/baker-111'
}

function findPath (id) {
  if (id in paths) {
    return paths[id]
  }
  return ''
}

exports.handler = async function http (req) {
  const { id } = req.pathParameters
  const path = findPath(id)
  const url = new URL(path, process.env.ROOT_URL).href
  return {
    statusCode: 301,
    headers: {
      Location: url
    }
  }
}
