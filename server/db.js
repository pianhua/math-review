const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db = null;
let SQL = null;

async function initDb() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
    console.log('Database loaded from', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('New database created');
  }

  createTables();
  saveDb();
}

function migrateProblemsTable() {
  try {
    const cols = query("PRAGMA table_info(problems)");
    if (cols.length > 0 && !cols.some(c => c.name === 'knowledge_point')) {
      // 需要添加 knowledge_point 列，SQLite 不支持 ALTER TABLE ADD COLUMN
      // 策略：创建新表，复制数据，删除旧表，重命名
      db.run(`
        CREATE TABLE problems_new (
          id TEXT PRIMARY KEY,
          chapter TEXT NOT NULL,
          source TEXT,
          difficulty TEXT CHECK(difficulty IN ('basic','advanced','exam')),
          type TEXT,
          content TEXT NOT NULL,
          options TEXT NOT NULL,
          correct TEXT NOT NULL,
          explanation TEXT,
          knowledge_point TEXT,
          is_ai_generated INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.run(`
        INSERT INTO problems_new (id, chapter, source, difficulty, type, content, options, correct, explanation, is_ai_generated, created_at)
        SELECT id, chapter, source, difficulty, type, content, options, correct, explanation, is_ai_generated, created_at FROM problems
      `);
      db.run('DROP TABLE problems');
      db.run('ALTER TABLE problems_new RENAME TO problems');
      console.log('Migrated problems table: added knowledge_point column');
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS formulas (
      id TEXT PRIMARY KEY,
      chapter TEXT NOT NULL,
      title TEXT NOT NULL,
      latex TEXT NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      chapter TEXT NOT NULL,
      source TEXT,
      difficulty TEXT CHECK(difficulty IN ('basic','advanced','exam')),
      type TEXT,
      content TEXT NOT NULL,
      options TEXT NOT NULL,
      correct TEXT NOT NULL,
      explanation TEXT,
      knowledge_point TEXT,
      is_ai_generated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  migrateProblemsTable();

  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT CHECK(item_type IN ('formula','problem')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_id, item_type)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      problem_id TEXT NOT NULL,
      selected_answer TEXT,
      is_correct INTEGER NOT NULL,
      time_spent_seconds INTEGER,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      problem_id TEXT NOT NULL,
      wrong_answer TEXT,
      review_count INTEGER DEFAULT 0,
      last_review_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, problem_id)
    )
  `);

  // Migrate daily_reviews: add user_id, change unique to (user_id, review_date)
  try {
    const cols = query("PRAGMA table_info(daily_reviews)");
    if (cols.length > 0 && !cols.some(c => c.name === 'user_id')) {
      db.run(`
        CREATE TABLE daily_reviews_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          review_date DATE NOT NULL,
          problems TEXT NOT NULL,
          weak_chapters TEXT,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, review_date)
        )
      `);
      db.run(`
        INSERT INTO daily_reviews_new (review_date, problems, weak_chapters, generated_at)
        SELECT review_date, problems, weak_chapters, generated_at FROM daily_reviews
      `);
      db.run('DROP TABLE daily_reviews');
      db.run('ALTER TABLE daily_reviews_new RENAME TO daily_reviews');
      console.log('Migrated daily_reviews: added user_id column');
    }
  } catch (e) {
    // table doesn't exist yet
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      review_date DATE NOT NULL,
      problems TEXT NOT NULL,
      weak_chapters TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, review_date)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_daily_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      review_date DATE NOT NULL,
      completed_ids TEXT DEFAULT '[]',
      UNIQUE(user_id, review_date)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mastery_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter TEXT NOT NULL,
      total_solved INTEGER DEFAULT 0,
      total_correct INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, chapter)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_problem_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      problem_id TEXT NOT NULL,
      mastery TEXT CHECK(mastery IN ('weak', 'unfamiliar', 'mastered')) NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, problem_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_generation_quota (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      used_today INTEGER DEFAULT 0,
      quota_date DATE NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(sql, params = []) {
  db.run(sql, params);
}

function insert(sql, params = []) {
  db.run(sql, params);
  const result = query('SELECT last_insert_rowid() as id');
  return result[0]?.id;
}

function startAutoSave(intervalMs = 30000) {
  const timer = setInterval(() => {
    saveDb();
  }, intervalMs);

  function onExit() {
    clearInterval(timer);
    saveDb();
    process.exit(0);
  }

  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);
}

module.exports = {
  initDb,
  getDb,
  query,
  run,
  insert,
  saveDb,
  startAutoSave
};
