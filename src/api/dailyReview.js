import client from './client'

export async function getDailyReview() {
  const res = await client.get('/daily-review')
  return { review: res.data.review, quota: res.data.quota }
}

export async function generateDailyReview() {
  const res = await client.post('/daily-review/generate')
  return { review: res.data.review, quota: res.data.quota }
}
