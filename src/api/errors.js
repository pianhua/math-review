import client from './client'

export async function getErrors() {
  const res = await client.get('/errors')
  return res.data.errors
}

export async function reviewError(errorId) {
  await client.post(`/errors/${errorId}/review`)
}
