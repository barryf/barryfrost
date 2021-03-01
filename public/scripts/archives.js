"use strict";

// select the letter passed in as param
var url = new URL(window.location.href);
var c = url.searchParams.get('c');

if (c) {
  document.getElementById('c-' + c).focus();
}

function filterCategory(letter) {
  // clear any existing results
  var categoriesContainer = document.getElementById('categories');
  categoriesContainer.innerHTML = ''; // filter list based on initial letter

  var filteredCategories = categories.filter(function (cat, i) {
    if (cat.substring(0, 1) === letter.toLowerCase()) {
      return cat;
    }
  }); // create a link for each filtered category

  filteredCategories.forEach(function (cat, i) {
    var a = document.createElement('a');
    a.href = '/categories/' + cat;
    a.className = 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200';
    a.innerText = cat;
    categoriesContainer.append(a);

    if (i < filteredCategories.length - 1) {
      categoriesContainer.append(' / ');
    }
  });
} // attach click listeners to letters


document.addEventListener('DOMContentLoaded', function () {
  var letters = document.querySelectorAll('.letter');
  letters.forEach(function (letter) {
    letter.addEventListener('click', function (event) {
      var c = event.target.id.split('-')[1];
      event.preventDefault();
      filterCategory(c);
      event.target.focus();
    });
  });
});