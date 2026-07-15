const pool = require('../config/db');

async function fixPins() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT id FROM commandes WHERE code_pin IS NULL');
    let count = 0;
    for(let r of rows) {
      const pin = String(Math.floor(1000 + Math.random() * 9000));
      await conn.query('UPDATE commandes SET code_pin = ? WHERE id = ?', [pin, r.id]);
      count++;
    }
    console.log(`${count} commandes anciennes ont reçu un code PIN avec succès.`);
  } catch (e) {
    console.error('Erreur:', e);
  } finally {
    if(conn) conn.release();
    process.exit();
  }
}

fixPins();
