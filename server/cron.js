const cron = require('node-cron');
const { query, run } = require('./db');
const { generateDailyReview } = require('./services/ai');

const REVIEW_COUNT = 5;

function getToday() {
  return new Date().toISOString().split('T')[0];
}

async function analyzeGlobalWeakChapters() {
  // 分析全站用户最近 7 天的做题数据
  const attempts = query(
    `SELECT p.chapter,
      COUNT(*) as total,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct
     FROM attempts a
     JOIN problems p ON a.problem_id = p.id
     WHERE a.attempted_at >= date('now', '-7 days')
     GROUP BY p.chapter`
  );

  const allChapters = query('SELECT DISTINCT chapter FROM problems');
  const attemptedChapters = new Set(attempts.map(a => a.chapter));

  let weakChapters = attempts
    .map(a => ({
      chapter: a.chapter,
      accuracy: a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0,
      total: a.total
    }))
    .filter(a => a.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy);

  // 把未做过的章节也加入薄弱列表
  for (const c of allChapters) {
    if (!attemptedChapters.has(c.chapter)) {
      weakChapters.push({ chapter: c.chapter, accuracy: 0, total: 0 });
    }
  }

  // 如果没有薄弱章节，随机选 3 个
  if (weakChapters.length === 0) {
    weakChapters = allChapters
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => ({ chapter: c.chapter, accuracy: 50, total: 0 }));
  }

  return weakChapters.slice(0, 3);
}

async function generateGlobalDailyReview() {
  const today = getToday();

  // 检查今天是否已经生成过
  const existing = query('SELECT * FROM daily_reviews WHERE review_date = ?', [today]);
  if (existing.length > 0) {
    console.log(`[${today}] Daily review already exists, skipping`);
    return;
  }

  console.log(`[${today}] Generating global daily review...`);

  const weakChapters = await analyzeGlobalWeakChapters();
  console.log('Weak chapters:', weakChapters.map(c => c.chapter).join(', '));

  let problems = [];

  // 尝试 AI 生成
  try {
    const generated = await generateDailyReview(weakChapters, REVIEW_COUNT);
    if (generated.problems && generated.problems.length > 0) {
      for (const prob of generated.problems) {
        const id = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        run(
          `INSERT INTO problems (id, chapter, source, difficulty, type, content, options, correct, explanation, is_ai_generated, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
          [
            id,
            prob.chapter || weakChapters[0].chapter,
            'AI生成',
            prob.difficulty || 'basic',
            prob.type || '选择题',
            prob.content,
            JSON.stringify(prob.options || []),
            prob.correct,
            prob.explanation
          ]
        );
        problems.push(id);
      }
    }
  } catch (err) {
    console.log('AI generation failed, using fallback:', err.message);
  }

  // Fallback: 从题库中根据薄弱章节抽取
  if (problems.length === 0) {
    const weakChapterNames = weakChapters.map(c => c.chapter);
    const poolSize = Math.min(weakChapterNames.length * 3, REVIEW_COUNT * 2);

    let fallback = query(
      `SELECT * FROM problems
       WHERE chapter IN (${weakChapterNames.map(() => '?').join(',')})
       ORDER BY RANDOM()
       LIMIT ?`,
      [...weakChapterNames, poolSize]
    );

    if (fallback.length === 0) {
      fallback = query('SELECT * FROM problems ORDER BY RANDOM() LIMIT ?', [REVIEW_COUNT]);
    }

    // 补充到 REVIEW_COUNT 道
    while (fallback.length < REVIEW_COUNT) {
      const extra = query('SELECT * FROM problems WHERE id NOT IN (' +
        fallback.map(() => '?').join(',') + ') ORDER BY RANDOM() LIMIT ?',
        [...fallback.map(p => p.id), REVIEW_COUNT - fallback.length]);
      fallback.push(...extra);
      if (extra.length === 0) break;
    }

    problems = fallback.slice(0, REVIEW_COUNT).map(p => p.id);
  }

  // 保存到全局每日复习表
  run(
    `INSERT INTO daily_reviews (review_date, problems, weak_chapters, generated_at)
     VALUES (?, ?, ?, datetime('now'))`,
    [today, JSON.stringify(problems), JSON.stringify(weakChapters.map(c => c.chapter))]
  );

  console.log(`[${today}] Generated daily review with ${problems.length} problems`);
}

function startCron() {
  // 每天 00:01 自动生成
  cron.schedule('1 0 * * *', () => {
    generateGlobalDailyReview().catch(err => {
      console.error('Cron job failed:', err);
    });
  });

  // 启动时如果当天还没生成，立即生成一次
  generateGlobalDailyReview().catch(err => {
    console.error('Initial generation failed:', err);
  });

  console.log('Cron scheduled: daily review at 00:01');
}

module.exports = { startCron, generateGlobalDailyReview };
