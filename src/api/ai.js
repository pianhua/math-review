// ============================================================
//   MiniMax AI API 调用
// ============================================================

const API_BASE = 'https://api.minimax.chat/v1'

// 请替换为你的实际 API Key
const API_KEY = import.meta.env.VITE_MINIMAX_API_KEY || ''

/**
 * 调用 MiniMax 生成数学题目
 * @param {string} chapter - 章节名称
 * @param {string} difficulty - 难度：basic / advanced / exam
 * @param {string} type - 题型：选择题 / 填空题 / 计算题 / 证明题
 */
export async function generateProblem(chapter, difficulty, type) {
  const prompt = `你是一位考研数学出题专家。请根据以下要求生成一道高质量的数学题目。

要求：
- 章节：${chapter}
- 难度：${difficulty === 'basic' ? '基础（教材例题难度）' : difficulty === 'advanced' ? '强化（考研模拟题难度）' : '真题（考研真题难度）'}
- 题型：${type}

输出要求（JSON格式）：
{
  "content": "题目题干（LaTeX格式）",
  "options": [
    {"label": "A", "text": "选项A内容"},
    {"label": "B", "text": "选项B内容"},
    {"label": "C", "text": "选项C内容"},
    {"label": "D", "text": "选项D内容"}
  ],
  "correct": "正确答案标签（如 A/B/C/D）",
  "explanation": "详细解析（LaTeX格式，包含解题步骤）",
  "answer": "最终答案"
}

注意事项：
1. 题目必须符合考研数学大纲要求
2. 答案必须正确，解析逻辑清晰
3. 难度适中，适合30分钟内完成
4. 题目来源标注为"AI生成"
`

  try {
    const response = await fetch(`${API_BASE}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'abab6.5-chat',
        messages: [
          { role: 'system', content: '你是一位专业的考研数学出题专家，擅长生成高质量的数学题目。' },
          { role: 'user', content: prompt }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // 解析 JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('JSON 解析失败:', e)
    }
    
    return null
  } catch (error) {
    console.error('生成题目失败:', error)
    return null
  }
}

/**
 * AI 自查题目质量
 * @param {Object} problem - 题目对象
 */
export async function validateProblem(problem) {
  const prompt = `请审查以下数学题目，检查是否存在问题：

题目：${problem.content}
选项：${problem.options.map(o => `${o.label}. ${o.text}`).join(' | ')}
正确答案：${problem.correct}
解析：${problem.explanation}

请检查以下方面：
1. 题目表述是否清晰、无歧义
2. 选项是否互斥、正确
3. 答案是否正确
4. 解析逻辑是否正确
5. 是否有任何数学错误

以JSON格式输出审查结果：
{
  "valid": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}`

  try {
    const response = await fetch(`${API_BASE}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'abab6.5-chat',
        messages: [
          { role: 'system', content: '你是一位严谨的数学题目审核专家。' },
          { role: 'user', content: prompt }
        ],
        stream: false
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('JSON 解析失败:', e)
    }
    
    return { valid: true, issues: [], suggestions: [] }
  } catch (error) {
    console.error('题目验证失败:', error)
    return { valid: true, issues: [], suggestions: [] }
  }
}