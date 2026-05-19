import client from './client'

export async function getDailyReview() {
  const res = await client.get('/daily-review')
  return res.data.review
}

export async function generateDailyReview() {
  const res = await client.post('/daily-review/generate')
  return res.data.review
}
