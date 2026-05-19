import client from './client'

export async function getMastery() {
  const res = await client.get('/mastery')
  return res.data.mastery
}
