const API_BASE = 'https://api.minimaxi.com/v1';
const API_KEY = process.env.MINIMAX_API_KEY || '';

/**
 * Analyze user's weak points and generate daily review problems
 */
async function generateDailyReview(weakChapters, reviewCount = 3) {
  if (!API_KEY) {
    throw new Error('MINIMAX_API_KEY not configured');
  }

  const chapterList = weakChapters.map(c => `${c.chapter} (正确率 ${c.accuracy}%)`).join('、');

  const prompt = `你是一位考研数学出题专家。请根据学生的薄弱知识点生成 ${reviewCount} 道**选择题**。

学生的薄弱章节：
${chapterList}

**强制要求**：
1. 所有题目必须是**选择题**，每道题必须有 A/B/C/D 四个选项
2. 每道题的 correct 字段必须是单个字母：A、B、C 或 D
3. 每道题的 type 字段必须是 "选择题"
4. 题目必须覆盖上述薄弱章节
5. 难度适中，适合复习巩固

**输出要求（严格JSON格式，不要输出任何其他文字）**：
{
  "problems": [
    {
      "chapter": "章节名称",
      "difficulty": "basic|advanced|exam",
      "type": "选择题",
      "content": "题目题干（LaTeX格式，使用$...$表示行内公式）",
      "options": [
        {"label": "A", "text": "$选项A内容$"},
        {"label": "B", "text": "$选项B内容$"},
        {"label": "C", "text": "$选项C内容$"},
        {"label": "D", "text": "$选项D内容$"}
      ],
      "correct": "C",
      "explanation": "详细解析（LaTeX格式）"
    }
  ]
}

注意：
1. 题目必须符合考研数学大纲
2. 答案正确，解析逻辑清晰
3. 题目来源标注为"AI生成"
4. **必须严格返回JSON，不要加markdown代码块或其他说明文字**`;

  try {
    const response = await fetch(`${API_BASE}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: '你是一位专业的考研数学出题专家，擅长根据学生的薄弱点生成针对性复习题目。' },
          { role: 'user', content: prompt }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('JSON parse failed:', e);
    }

    return { problems: [] };
  } catch (error) {
    console.error('Generate daily review failed:', error);
    throw error;
  }
}

module.exports = { generateDailyReview };
