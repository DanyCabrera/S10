const fs = require("fs");
const path = require("path");
const { createSeedDatabase } = require("./seed-data");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeedDatabase();
    writeDb(seed);
    return seed;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function resetDb() {
  const seed = createSeedDatabase();
  writeDb(seed);
  return seed;
}

module.exports = { readDb, writeDb, resetDb, DB_PATH };
