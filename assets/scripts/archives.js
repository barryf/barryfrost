/* global categories */
// select the letter passed in as param
const url = new URL(window.location.href)
const c = url.searchParams.get('c')
if (c) {
  document.getElementById('c-' + c).focus()
}

function filterCategory (letter) {
  // clear any existing results
  const categoriesContainer = document.getElementById('categories')
  categoriesContainer.innerHTML = ''

  // filter list based on initial letter
  const filteredCategories = categories.filter((cat) => {
    return cat.substring(0, 1) === letter.toLowerCase()
  })

  // create a link for each filtered category
  filteredCategories.forEach((cat, i) => {
    const a = document.createElement('a')
    a.href = '/categories/' + cat
    a.className = 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
    a.innerText = cat
    categoriesContainer.append(a)
    if (i < filteredCategories.length - 1) {
      categoriesContainer.append(' / ')
    }
  })
}

// attach click listeners to letters
document.addEventListener('DOMContentLoaded', function () {
  const letters = document.querySelectorAll('.letter')
  letters.forEach((letter) => {
    letter.addEventListener('click', (event) => {
      const c = event.target.id.split('-')[1]
      event.preventDefault()
      filterCategory(c)
      event.target.focus()
    })
  })
})
