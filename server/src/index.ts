import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDb } from './db.js';

const app = express();
const port = 3000;
const JWT_SECRET = 'super-secret-key-for-edutech';

app.use(cors());
app.use(express.json());

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

initDb().then((db) => {

  // Auth Routes
  app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already taken' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const avatar = `https://i.pravatar.cc/150?u=${username}`;
      const result = await db.run(
        'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, avatar]
      );
      
      const token = jwt.sign({ id: result.lastID, username, role: 'Member', avatar }, JWT_SECRET);
      res.status(201).json({ token, user: { id: result.lastID, username, avatar, role: 'Member' } });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/login', async (req: any, res: any) => {
    const { email, password } = req.body;
    try {
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, avatar: user.avatar }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, role: user.role } });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Posts Route
  app.get('/api/posts', async (req, res) => {
    try {
      const rows = await db.all(`
        SELECT p.*, u.username as authorName, u.role as authorRole, u.avatar as authorAvatar 
        FROM posts p
        JOIN users u ON p.userId = u.id
        ORDER BY p.createdAt DESC
      `);
      
      const posts = rows.map(row => ({
        id: row.id,
        author: {
          name: row.authorName,
          role: row.authorRole,
          avatar: row.authorAvatar
        },
        timeAgo: 'Just now', // Simplified for demo scale
        title: row.title,
        content: row.content,
        tags: JSON.parse(row.tags),
        upvotes: row.upvotes,
        comments: row.comments
      }));
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  app.post('/api/posts', authenticateToken, async (req: any, res: any) => {
    const { title, content, tags } = req.body;
    try {
      const result = await db.run(
        'INSERT INTO posts (userId, title, content, tags) VALUES (?, ?, ?, ?)',
        [req.user.id, title, content, JSON.stringify(tags || [])]
      );
      
      // Award user points for posting
      await db.run('UPDATE users SET points = points + 5 WHERE id = ?', [req.user.id]);
      
      res.status(201).json({ id: result.lastID });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.put('/api/posts/:id/vote', authenticateToken, async (req: any, res: any) => {
    const { id } = req.params;
    const { type } = req.body;
    try {
      const post = await db.get('SELECT upvotes, userId FROM posts WHERE id = ?', [id]);
      if (!post) return res.status(404).json({ error: 'Not found' });

      const newUpvotes = type === 'up' ? post.upvotes + 1 : post.upvotes - 1;
      await db.run('UPDATE posts SET upvotes = ? WHERE id = ?', [newUpvotes, id]);
      
      // Award points to the author when getting upvoted
      if (type === 'up') {
         await db.run('UPDATE users SET points = points + 2 WHERE id = ?', [post.userId]);
      } else {
         await db.run('UPDATE users SET points = points - 2 WHERE id = ?', [post.userId]);
      }
      
      res.json({ success: true, upvotes: newUpvotes });
    } catch (err) {
      res.status(500).json({ error: 'Failed to vote' });
    }
  });

  // Dynamic Topics & Leaders
  app.get('/api/trending', async (req, res) => {
    try {
      const rows = await db.all('SELECT tags FROM posts LIMIT 100');
      const tagCounts: Record<string, number> = {};
      
      rows.forEach(r => {
        const tags = JSON.parse(r.tags);
        tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      const trending = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag: `#${tag.toLowerCase()}`, count }));
        
      res.json(trending);
    } catch (e) {
      res.json([]);
    }
  });

  app.get('/api/users/top', async (req, res) => {
    try {
      const users = await db.all('SELECT username, role, points, avatar FROM users ORDER BY points DESC LIMIT 3');
      res.json(users);
    } catch (e) {
      res.json([]);
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to init DB', err);
});
