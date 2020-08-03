const { shell, ipcRenderer, clipboard } = require('electron')
const { v4: uuidv4 } = require('uuid')

const Store = require('electron-store')
const store = new Store()

const trashIcon = `
<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
</svg>
`

const pencilIcon = `
<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-pencil" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M11.293 1.293a1 1 0 0 1 1.414 0l2 2a1 1 0 0 1 0 1.414l-9 9a1 1 0 0 1-.39.242l-3 1a1 1 0 0 1-1.266-1.265l1-3a1 1 0 0 1 .242-.391l9-9zM12 2l2 2-9 9-3 1 1-3 9-9z"/>
  <path fill-rule="evenodd" d="M12.146 6.354l-2.5-2.5.708-.708 2.5 2.5-.707.708zM3 10v.5a.5.5 0 0 0 .5.5H4v.5a.5.5 0 0 0 .5.5H5v.5a.5.5 0 0 0 .5.5H6v-1.5a.5.5 0 0 0-.5-.5H5v-.5a.5.5 0 0 0-.5-.5H3z"/>
</svg>
`

ipcRenderer.on('add-bookmark', (event, msg) => {
    showAddView()
})

ipcRenderer.on('add-bookmark-clipboard', (event, msg) => {
    showAddView()
    urlInput.value = clipboard.readText()
    nameInput.focus()
})

showAddViewButton.onclick = function () {
    showAddView()
}

addBookmarkButton.onclick = function () {
    const urlText = urlInput.value.trim()
    const url = urlText.match(/^(?<scheme>.+):\/\//) ? urlText : `http://${urlText}`
    const tags = tagsInput.value.trim().length > 0 ? tagsInput.value.split(/(, *)+/).map((s) => s.trim()) : []
    const notes = notesInput.value
    const name = nameInput.value.trim()
    

    if(editBookmark) {
        const key = editBookmark.key
        removeBookmark(key)
        addBookmark({ key, name, url, tags, notes })
    } else {
        const key = uuidv4()
        addBookmark({ key, name, url, tags, notes })
    }

    closeAddView()
}

cancelBookmarkButton.onclick = function () {
    closeAddView()
}

searchInput.oninput = function (e) {
    refreshSearchResults()
}

searchInput.onkeydown = function (e) {
    if (e.code === "Enter") {
        e.preventDefault()
        const hit = filteredBookmarks[0]
        if (hit) {
            launch(hit)
            searchInput.value = ""
            refreshSearchResults()
        }
    }
}

confirmDeleteButton.onclick = function () {
    if(deleteKey) {
        removeBookmark(deleteKey)
        deleteKey = null
    }
}

function handleOnInput(e) {
    if (e.code === "Escape") {
        e.preventDefault()
        closeAddView()
    }

    if(e.code === "Enter") {
        e.preventDefault()
        addBookmarkButton.click()
    }
}

urlInput.onkeydown = handleOnInput
nameInput.onkeydown = handleOnInput
tagsInput.onkeydown = handleOnInput
notesInput.onkeydown = handleOnInput

function launch(bookmark) {
    shell.openExternal(bookmark.url)
}

function refreshSearchResults() {
    const query = searchInput.value
    filteredBookmarks = bookmarks.filter((b) => {
        const q = query.toUpperCase()
        const name = b.name.toUpperCase()
        const tags = b.tags.map((t) => t.toUpperCase())
        const notes = b.notes.toUpperCase()

        return name.includes(q) || notes.includes(q) || tags.includes(q)
    })
    refreshBookmarkList()
}

function showAddView() {
    addView.hidden = false
    searchView.hidden = true
    listView.hidden = true

    if(editBookmark) {
        editBookmarklabel.innerText = "Edit Bookmark"
        addBookmarkButton.innerText = "Edit"
        urlInput.value = editBookmark.url
        nameInput.value = editBookmark.name
        tagsInput.value = editBookmark.tags
        notesInput.value = editBookmark.notes
    } else {
        editBookmarklabel.innerText = "Add Bookmark"
        addBookmarkButton.innerText = "Add"
        clearAddBookmarkView()
    }

    urlInput.focus()
}

function closeAddView() {
    editBookmark = null
    addView.hidden = true
    searchView.hidden = false
    listView.hidden = false
    searchInput.focus()
}

function clearAddBookmarkView() {
    nameInput.value = ""
    urlInput.value = ""
    tagsInput.value = ""
    notesInput.value = ""
}

function addBookmark(bookmark) {
    bookmarks.push(bookmark)
    bookmarks.sort((a, b) => {
        nameA = a.name.toUpperCase()
        nameB = b.name.toUpperCase()

        if(nameA < nameB) return -1
        if(nameA > nameB) return 1

        return 0
    })
    store.set('bookmarks', bookmarks)
    refreshSearchResults()
}

function confirmRemoveBookmark(key) {
    deleteKey = key
    $("#confirm-delete-modal").modal('show')
}

function removeBookmark(key) {
    i = bookmarks.findIndex((b) => b.key === key)
    if (i > -1) {
        bookmarks.splice(i, 1)
        saveBookmarks()
        refreshSearchResults()
        searchInput.focus()
    }
}

function refreshBookmarkList() {
    const listItems = filteredBookmarks.map((bookmark, index) => {

        const delAnchor = document.createElement("a")
        delAnchor.innerHTML = trashIcon
        delAnchor.classList = 'text-danger'
        delAnchor.href = '#'
        delAnchor.onclick = function () {
            confirmRemoveBookmark(bookmark.key)
        }

        const editAnchor = document.createElement("a")
        editAnchor.innerHTML = pencilIcon
        editAnchor.classList = 'text-info'
        editAnchor.href = '#'
        editAnchor.onclick = function () {
            editBookmark = bookmark
            showAddView()
        }

        const nameRow = document.createElement("div")
        nameRow.classList = 'row'
        nameRow.appendChild(delAnchor)
        nameRow.appendChild(editAnchor)
        const bName = document.createElement("b")
        bName.innerHTML = `&nbsp;${bookmark.name}`
        nameRow.appendChild(bName )

        const urlRow = document.createElement("div")
        urlRow.classList = 'row'
        const urlCol = document.createElement("div")
        urlCol.classList = 'col-12'
        const urlP = document.createElement("p")
        urlP.style = 'overflow: auto'
        const urlLink = document.createElement("a")
        urlLink.href = '#'
        urlLink.innerText = bookmark.url
        urlLink.onclick = function () {
            launch(bookmark)
        }
        urlP.appendChild(urlLink)
        urlCol.appendChild(urlP)
        urlRow.appendChild(urlCol)

        const tagsRow = document.createElement("div")
        tagsRow.classList = 'row'
        tagsRow.innerHTML = `
                <div class="col-1">Tags</div>
                <div class="col-11">
                    ${bookmark.tags.map((tag, index) => {
                        return ` <span class='badge badge-pill badge-info'> ${tag} </span> `
                    }).join('')}
                </div>
            `

        const notesRow = document.createElement("div")
        notesRow.classList = 'row'
        notesRow.innerHTML = `
            <div class="col-1">Notes</div>
            <div class="col-11">${bookmark.notes}</div>
        `
        
        const li = document.createElement("li")
        li.classList = 'list-group-item'

        li.appendChild(nameRow)
        li.appendChild(urlRow)
        bookmark.tags.length > 0 && li.appendChild(tagsRow)
        bookmark.notes.length > 0 && li.appendChild(notesRow)

        return li
    })

    bookmarkList.innerHTML = ""
    listItems.forEach((li, index) => {
        bookmarkList.appendChild(li)
    })
}

function loadBookmarks() {
    // bookmarks = [
    //     {
    //         name: 'red',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'green',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'blue',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'orange',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'purple',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'yellow',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'white',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'black',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'pink',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'violet',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'indigo',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    //     {
    //         name: 'cyan',
    //         url: 'https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS4zLjcyIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsImpzQ29kZSI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHByaW50bG4oMS4wZilcbn0ifQ==',
    //         tags: ['kotlin', 'programming'],
    //         notes: 'run kotlin code in your Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    //     },
    // ]
    bookmarks = store.get('bookmarks')
    // bookmarks.forEach((b) => {
    //     b.key = uuidv4()
    // })
    // saveBookmarks()
    filteredBookmarks = bookmarks
    refreshBookmarkList()
}

function saveBookmarks () {
    store.set('bookmarks', bookmarks)
}

let bookmarks = []
let filteredBookmarks = []
let deleteKey = null
let editBookmark = null

loadBookmarks()

searchInput.focus()