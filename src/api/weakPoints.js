import client from './client'

export async function getWeakPoints() {
  const res = await client.get('/weak-points')
  return res.data
}

export async function markMastery(problemId, mastery) {
  const res = await client.post('/weak-points/mastery', { problem_id: problemId, mastery })
  return res.data
}
