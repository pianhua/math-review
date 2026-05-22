const express = require('express');
const { query, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { getUserQuota, incrementQuota } = require('../utils/quota');
const { generateWeakPointReview } = require('../services/ai');

const router = express.Router();
const REVIEW_COUNT = 5;

// Get user's weak chapters and weak problems
router.get('/', authMiddleware, (req, res) => {
  const userId = req.userId;

  // 1. Get chapters with weak/unfamiliar count >= 3
  const weakChapters = query(
    `SELECT p.chapter, COUNT(*) as weak_count
     FROM user_problem_progress upp
     JOIN problems p ON p.id = upp.problem_id
     WHERE upp.user_id = ? AND upp.mastery IN ('weak', 'unfamiliar')
     GROUP BY p.chapter
     HAVING weak_count >= 3
     ORDER BY weak_count DESC`,
    [userId]
  );

  // 2. Also consider chapters with < 70% accuracy from attempts
  const accuracyChapters = query(
    `SELECT p.chapter,
      COUNT(*) as total,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct
     FROM attempts a
     JOIN problems p ON p.id = a.problem_id
     WHERE a.user_id = ? AND a.attempted_at >= date('now', '-7 days')
     GROUP BY p.chapter
     HAVING total > 0 AND (correct * 100 / total) < 70`,
    [userId]
  );

  // Merge: accuracy-based chapters not already in weakChapters
  const weakChapterNames = new Set(weakChapters.map(c => c.chapter));
  for (const c of accuracyChapters) {
    if (!weakChapterNames.has(c.chapter)) {
      weakChapters.push({
        chapter: c.chapter,
        weak_count: parseInt(c.total) - parseInt(c.correct)
      });
    }
  }

  // 3. Get weak problems grouped by chapter
  const problemsByChapter = {};
  for (const chapter of weakChapters) {
    const probs = query(
      `SELECT p.*, upp.mastery
       FROM user_problem_progress upp
       JOIN problems p ON p.id = upp.problem_id
       WHERE upp.user_id = ? AND p.chapter = ? AND upp.mastery IN ('weak', 'unfamiliar')
       ORDER BY upp.updated_at DESC
       LIMIT 20`,
      [userId, chapter.chapter]
    );
    problemsByChapter[chapter.chapter] = probs.map(p => ({
      ...p,
      options: JSON.parse(p.options)
    }));
  }

  res.json({
    weak_chapters: weakChapters,
    problems_by_chapter: problemsByChapter,
    quota: getUserQuota(userId)
  });
});

// Generate weak point review problems
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Check quota
    const quota = getUserQuota(userId);
    if (quota.remaining <= 0) {
      return res.status(429).json({ error: '今日 AI 生成次数已用完（5/5），请明天再试' });
    }

    // 2. Get user's weak problems
    const weakProblems = query(
      `SELECT p.*, upp.mastery
       FROM user_problem_progress upp
       JOIN problems p ON p.id = upp.problem_id
       WHERE upp.user_id = ? AND upp.mastery IN ('weak', 'unfamiliar')
       ORDER BY upp.updated_at DESC
       LIMIT 10`,
      [userId]
    );

    if (weakProblems.length === 0) {
      return res.status(400).json({ error: '暂无薄弱题目，请先标记掌握程度' });
    }

    // 3. Build prompt from weak problems
    const problemList = weakProblems.map((p, i) => {
      const options = JSON.parse(p.options || '[]');
      const opts = options.map(o => `${o.label}. ${o.text}`).join(' ');
      return `${i + 1}. [${p.chapter}] ${p.content} ${opts ? '(' + opts + ')' : ''}`;
    }).join('\n');

    // 4. Call AI to generate similar problems
    let generatedProblems = [];
    let usedAi = false;

    try {
      const generated = await generateWeakPointReview(problemList, REVIEW_COUNT);
      if (generated.problems && generated.problems.length > 0) {
        for (const prob of generated.problems) {
          const id = `ai-w-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          run(
            `INSERT INTO problems (id, chapter, source, difficulty, type, content, options, correct, explanation, knowledge_point, is_ai_generated, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
            [
              id,
              prob.chapter || weakProblems[0].chapter,
              'AI生成-薄弱专项',
              prob.difficulty || 'basic',
              prob.type || '选择题',
              prob.content,
              JSON.stringify(prob.options || []),
              prob.correct,
              prob.explanation,
              prob.knowledge_point || ''
            ]
          );
          generatedProblems.push(id);
        }
        usedAi = true;
      }
    } catch (err) {
      console.log('AI weak point generation failed, using fallback:', err.message);
    }

    // 5. Fallback: pick from weak problems pool
    if (generatedProblems.length === 0) {
      const shuffled = weakProblems.sort(() => Math.random() - 0.5);
      generatedProblems = shuffled.slice(0, Math.min(REVIEW_COUNT, shuffled.length)).map(p => p.id);
    }

    // 6. Increment quota if AI was used
    if (usedAi) {
      incrementQuota(userId);
    }

    // 7. Return generated problems
    const problems = [];
    for (const pid of generatedProblems) {
      const p = query('SELECT * FROM problems WHERE id = ?', [pid]);
      if (p.length > 0) {
        problems.push({ ...p[0], options: JSON.parse(p[0].options) });
      }
    }

    res.json({
      problems,
      quota: getUserQuota(userId)
    });
  } catch (err) {
    console.error('Generate weak point review error:', err);
    res.status(500).json({ error: 'Failed to generate weak point review' });
  }
});

// Update mastery level for a problem
router.post('/mastery', authMiddleware, (req, res) => {
  const { problem_id, mastery } = req.body;
  const userId = req.userId;

  if (!problem_id || !['weak', 'unfamiliar', 'mastered'].includes(mastery)) {
    return res.status(400).json({ error: 'Invalid problem_id or mastery' });
  }

  const existing = query(
    'SELECT id FROM user_problem_progress WHERE user_id = ? AND problem_id = ?',
    [userId, problem_id]
  );

  if (existing.length > 0) {
    run(
      'UPDATE user_problem_progress SET mastery = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND problem_id = ?',
      [mastery, userId, problem_id]
    );
  } else {
    run(
      'INSERT INTO user_problem_progress (user_id, problem_id, mastery) VALUES (?, ?, ?)',
      [userId, problem_id, mastery]
    );
  }

  res.json({ success: true });
});

module.exports = router;
