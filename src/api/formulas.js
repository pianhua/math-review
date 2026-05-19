import client from './client'

export async function getFormulas() {
  const res = await client.get('/formulas')
  return res.data.formulas
}
