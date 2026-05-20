const cron = require('node-cron');
const { query, run } = require('./db');

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function resetQuota() {
  const today = getToday();
  run(
    'UPDATE ai_generation_quota SET used_today = 0, quota_date = ?',
    [today]
  );
  console.log(`[${today}] Reset AI generation quota for all users`);
}

function startCron() {
  // 每天 00:01 重置所有用户的 AI 生成额度
  cron.schedule('1 0 * * *', () => {
    resetQuota();
  });

  console.log('Cron scheduled: quota reset at 00:01');
}

module.exports = { startCron };
