require('jquery')

function find(id) {
    return document.getElementById(id)
}

const searchView = find("search-bookmark-view")
const addView = find("add-bookmark-view")
const listView = find("bookmark-list-view")

const showAddViewButton = find("show-add-bookmark-button")
const addBookmarkButton = find("add-bookmark-button")
const cancelBookmarkButton = find("cancel-bookmark-button")
const confirmDeleteButton = find("confirm-delete-button")
const cancelDeleteButton = find("cancel-delete-button")

const nameInput = find("name-input")
const searchInput = find("search-input")
const urlInput = find("url-input")
const tagsInput = find("tags-input")
const notesInput = find("notes-input")

const bookmarkList = find("bookmark-list")
const tagsList = find("tags-list")

const editBookmarklabel = find("edit-bookmark-label")
