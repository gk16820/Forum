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

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      parentId INTEGER,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postId) REFERENCES posts(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (parentId) REFERENCES comments(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      postId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      PRIMARY KEY (postId, userId),
      FOREIGN KEY (postId) REFERENCES posts(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS followers (
      followerId INTEGER NOT NULL,
      followingId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (followerId, followingId),
      FOREIGN KEY (followerId) REFERENCES users(id),
      FOREIGN KEY (followingId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      actorId INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'follow', 'comment'
      postId INTEGER,
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (actorId) REFERENCES users(id),
      FOREIGN KEY (postId) REFERENCES posts(id)
    );
  `);

  try {
    await db.run('ALTER TABLE users ADD COLUMN description TEXT DEFAULT ""');
  } catch (err) {} 
  try {
    await db.run('ALTER TABLE users ADD COLUMN location TEXT DEFAULT ""');
  } catch (err) {}
  try {
    await db.run('ALTER TABLE users ADD COLUMN interests TEXT DEFAULT ""');
  } catch (err) {}

  // Seed with an initial user if empty
  const userCount = await db.get('SELECT COUNT(*) as c FROM users');
  if (userCount.c === 0) {
    const defaultPassword = await bcrypt.hash('password123', 10);
    await db.run(
      'INSERT INTO users (username, email, password, role, avatar, points, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['admin', 'admin@deved.com', defaultPassword, 'Admin', '/Blank profile.png', 1500, 'Chief Administrator of DevEd.']
    );

    await db.run(
      'INSERT INTO posts (userId, title, content, tags, upvotes) VALUES (?, ?, ?, ?, ?)',
      [1, 'Welcome to DevEd Forum v2', 'This is the newly overhauled platform with proper authentication and real dynamic data. Let us know your thoughts.', JSON.stringify(['Announcement', 'Platform']), 10]
    );
  }

  return db;
}
