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
      is_ai_generated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  // Migrate old daily_reviews if it has user_id column
  try {
    const cols = query("PRAGMA table_info(daily_reviews)");
    if (cols.length > 0 && cols.some(c => c.name === 'user_id')) {
      db.run('DROP TABLE daily_reviews');
      console.log('Migrated old daily_reviews table');
    }
  } catch (e) {
    // table doesn't exist yet
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_date DATE NOT NULL UNIQUE,
      problems TEXT NOT NULL,
      weak_chapters TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  saveDb();
}

function insert(sql, params = []) {
  db.run(sql, params);
  saveDb();
  const result = query('SELECT last_insert_rowid() as id');
  return result[0]?.id;
}

module.exports = {
  initDb,
  getDb,
  query,
  run,
  insert,
  saveDb
};
