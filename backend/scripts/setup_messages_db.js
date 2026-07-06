const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Kevinkandet05!',
  database: 'addugo',
  multipleStatements: true
});

async function main() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("Connected to DB!");
    const sql = fs.readFileSync(path.join(__dirname, '../config/db_messages.sql'), 'utf8');
    await conn.query(sql);
    console.log("SQL executed successfully!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

main();
