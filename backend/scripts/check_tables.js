const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'addugo_admin',
  password: 'AdduGo@2026!',
  database: 'addugo'
});

async function main() {
  let conn;
  try {
    conn = await pool.getConnection();
    const tables = await conn.query("SHOW TABLES;");
    console.log("TABLES:", tables);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}
main();
