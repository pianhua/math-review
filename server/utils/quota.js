const { query, run } = require('../db');

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getUserQuota(userId) {
  const today = getToday();
  const quota = query(
    'SELECT * FROM ai_generation_quota WHERE user_id = ?',
    [userId]
  );

  if (quota.length === 0) {
    run(
      'INSERT INTO ai_generation_quota (user_id, used_today, quota_date) VALUES (?, 0, ?)',
      [userId, today]
    );
    return { remaining: 5, used: 0 };
  }

  const q = quota[0];
  if (q.quota_date !== today) {
    run(
      'UPDATE ai_generation_quota SET used_today = 0, quota_date = ? WHERE user_id = ?',
      [today, userId]
    );
    return { remaining: 5, used: 0 };
  }

  const used = parseInt(q.used_today) || 0;
  return { remaining: Math.max(0, 5 - used), used };
}

function incrementQuota(userId) {
  const today = getToday();
  run(
    'UPDATE ai_generation_quota SET used_today = used_today + 1, quota_date = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [today, userId]
  );
}

module.exports = { getToday, getUserQuota, incrementQuota };
