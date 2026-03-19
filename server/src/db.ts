import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

export async function initDb() {
  const db = await open({
    filename: './forum.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'Member',
      avatar TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Seed with an initial user if empty
  const userCount = await db.get('SELECT COUNT(*) as c FROM users');
  if (userCount.c === 0) {
    const defaultPassword = await bcrypt.hash('password123', 10);
    await db.run(
      'INSERT INTO users (username, email, password, role, avatar, points) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin', 'admin@deved.com', defaultPassword, 'Admin', 'https://i.pravatar.cc/150?u=admin', 1500]
    );

    await db.run(
      'INSERT INTO posts (userId, title, content, tags, upvotes) VALUES (?, ?, ?, ?, ?)',
      [1, 'Welcome to DevEd Forum v2', 'This is the newly overhauled platform with proper authentication and real dynamic data. Let us know your thoughts.', JSON.stringify(['Announcement', 'Platform']), 10]
    );
  }

  return db;
}
