import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

async function fix() {
  const db = await open({ filename: 'forum.sqlite', driver: sqlite3.Database });
  await db.run('UPDATE users SET avatar = ?', ['/Blank profile.png']);
  const rows = await db.all('SELECT * FROM users');
  console.log(rows);
}
fix();
