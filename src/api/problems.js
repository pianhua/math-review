import client from './client'

export async function getProblems(mode = 'all', chapter = null) {
  const params = { mode }
  if (chapter) params.chapter = chapter
  const res = await client.get('/problems', { params })
  return res.data.problems
}
