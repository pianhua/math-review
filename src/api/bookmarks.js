import client from './client'

export async function addBookmark(itemId, itemType) {
  await client.post('/bookmarks', { item_id: itemId, item_type: itemType })
}

export async function removeBookmark(itemId, itemType) {
  await client.delete(`/bookmarks/${itemId}?item_type=${itemType}`)
}
