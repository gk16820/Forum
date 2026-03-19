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

const optionalAuthenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (!err) req.user = user;
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
      const avatar = '/Blank profile.png';
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

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, description: user.description, avatar: user.avatar }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, role: user.role, description: user.description } });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Posts Route
  app.get('/api/posts', optionalAuthenticateToken, async (req: any, res: any) => {
    try {
      const { sort } = req.query;
      const orderClause = sort === 'popular' ? 'ORDER BY p.upvotes DESC' : 'ORDER BY p.createdAt DESC';

      const rows = await db.all(`
        SELECT p.*, u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar 
        FROM posts p
        JOIN users u ON p.userId = u.id
        ${orderClause}
      `);
      
      let userVotes: Record<number, string> = {};
      if (req.user) {
        const vRows = await db.all('SELECT postId, type FROM votes WHERE userId = ?', [req.user.id]);
        vRows.forEach(v => userVotes[v.postId] = v.type);
      }
      
      const posts = rows.map(row => ({
        id: row.id,
        author: {
          id: row.authorId,
          name: row.authorName,
          description: row.authorDescription,
          avatar: row.authorAvatar
        },
        createdAt: row.createdAt,
        timeAgo: row.createdAt, // Just pass UTC time string; frontend date-fns will format it
        title: row.title,
        content: row.content,
        tags: JSON.parse(row.tags),
        upvotes: row.upvotes,
        comments: row.comments,
        userVote: req.user ? (userVotes[row.id] || null) : null
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

      const existingVote = await db.get('SELECT type FROM votes WHERE postId = ? AND userId = ?', [id, req.user.id]);
      
      let newUpvotes = post.upvotes;
      let diff = 0;

      if (existingVote) {
         if (existingVote.type === type) {
             await db.run('DELETE FROM votes WHERE postId = ? AND userId = ?', [id, req.user.id]);
             diff = type === 'up' ? -1 : 1;
         } else {
             await db.run('UPDATE votes SET type = ? WHERE postId = ? AND userId = ?', [type, id, req.user.id]);
             diff = type === 'up' ? 2 : -2;
         }
      } else {
         await db.run('INSERT INTO votes (postId, userId, type) VALUES (?, ?, ?)', [id, req.user.id, type]);
         diff = type === 'up' ? 1 : -1;
      }
      
      newUpvotes += diff;
      await db.run('UPDATE posts SET upvotes = ? WHERE id = ?', [newUpvotes, id]);
      
      if (diff !== 0) {
         await db.run('UPDATE users SET points = points + ? WHERE id = ?', [diff, post.userId]);
      }
      
      res.json({ success: true, upvotes: newUpvotes });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to vote' });
    }
  });

  // Comments Route
  app.get('/api/posts/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      const rows = await db.all(`
        SELECT c.*, u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar 
        FROM comments c
        JOIN users u ON c.userId = u.id
        WHERE c.postId = ?
        ORDER BY c.createdAt ASC
      `, [id]);
      
      const comments = rows.map(row => ({
        id: row.id,
        parentId: row.parentId,
        content: row.content,
        createdAt: row.createdAt,
        author: {
          id: row.authorId,
          name: row.authorName,
          description: row.authorDescription,
          avatar: row.authorAvatar
        }
      }));
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  app.post('/api/posts/:id/comments', authenticateToken, async (req: any, res: any) => {
    const { id } = req.params;
    const { content, parentId } = req.body;
    try {
      const result = await db.run(
        'INSERT INTO comments (postId, userId, parentId, content) VALUES (?, ?, ?, ?)',
        [id, req.user.id, parentId || null, content]
      );
      
      await db.run('UPDATE posts SET comments = comments + 1 WHERE id = ?', [id]);
      await db.run('UPDATE users SET points = points + 1 WHERE id = ?', [req.user.id]);
      
      res.status(201).json({ id: result.lastID });
    } catch (err) {
      res.status(500).json({ error: 'Failed to comment' });
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
      const users = await db.all('SELECT id, username, description, points, avatar FROM users ORDER BY points DESC LIMIT 3');
      res.json(users);
    } catch (e) {
      res.json([]);
    }
  });

  app.get('/api/users/:id', optionalAuthenticateToken, async (req: any, res: any) => {
    try {
      const user = await db.get('SELECT id, username, description, avatar, points, createdAt FROM users WHERE id = ?', [req.params.id]);
      if (!user) return res.status(404).json({ error: 'Not found' });
      
      const followers = await db.get('SELECT COUNT(*) as c FROM followers WHERE followingId = ?', [user.id]);
      const following = await db.get('SELECT COUNT(*) as c FROM followers WHERE followerId = ?', [user.id]);
      
      let isFollowing = false;
      if (req.user) {
         const followRow = await db.get('SELECT 1 FROM followers WHERE followerId = ? AND followingId = ?', [req.user.id, user.id]);
         isFollowing = !!followRow;
      }
      
      res.json({ ...user, expectedFollowers: followers.c, expectedFollowing: following.c, isFollowing });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/users/:id/follow', authenticateToken, async (req: any, res: any) => {
    const followingId = req.params.id;
    const followerId = req.user.id;
    if (String(followingId) === String(followerId)) return res.status(400).json({ error: 'Cannot follow yourself' });

    try {
      const exists = await db.get('SELECT 1 FROM followers WHERE followerId = ? AND followingId = ?', [followerId, followingId]);
      if (exists) {
        await db.run('DELETE FROM followers WHERE followerId = ? AND followingId = ?', [followerId, followingId]);
        res.json({ following: false });
      } else {
        await db.run('INSERT INTO followers (followerId, followingId) VALUES (?, ?)', [followerId, followingId]);
        res.json({ following: true });
      }
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.put('/api/users/profile', authenticateToken, async (req: any, res: any) => {
    const { avatar, description } = req.body;
    try {
      await db.run('UPDATE users SET avatar = ?, description = ? WHERE id = ?', [avatar || '/Blank profile.png', description, req.user.id]);
      const user = await db.get('SELECT id, username, avatar, description, points FROM users WHERE id = ?', [req.user.id]);
      res.json({ success: true, user });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to init DB', err);
});
