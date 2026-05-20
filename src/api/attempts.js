import client from './client'

export async function submitAttempt(problemId, selectedAnswer, isCorrect, timeSpent = 0) {
  const res = await client.post('/attempts', {
    problem_id: problemId,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
    time_spent_seconds: timeSpent
  })
  return res.data
}

export async function getMastery(problemId) {
  const res = await client.get(`/attempts/mastery/${problemId}`)
  return res.data
}
