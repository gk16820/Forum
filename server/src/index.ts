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
    const { username, email, password, role, domain, userType } = req.body;
    if (!username || !email || !password || !role || !domain) {
      return res.status(400).json({ error: 'All fields including role and domain are required' });
    }
    const finalUserType = userType === 'guvi faculty' ? 'guvi faculty' : 'commonuser';
    try {
      const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already taken' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const avatar = '/Blank profile.png';
      const result = await db.run(
        'INSERT INTO users (username, email, password, avatar, role, domain, userType) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, email, hashedPassword, avatar, role, domain, finalUserType]
      );
      
      const token = jwt.sign({ id: result.lastID, username, role, domain, avatar, userType: finalUserType }, JWT_SECRET);
      res.status(201).json({ token, user: { id: result.lastID, username, avatar, role, domain, userType: finalUserType } });
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

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, domain: user.domain, description: user.description, avatar: user.avatar, userType: user.userType }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, role: user.role, domain: user.domain, description: user.description, userType: user.userType } });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Posts Route
  app.get('/api/posts', optionalAuthenticateToken, async (req: any, res: any) => {
    try {
      const { sort, communityId } = req.query;
      const orderClause = sort === 'popular' 
        ? "ORDER BY ((p.upvotes * 10) + p.views + (p.comments * 5)) / CAST(((STRFTIME('%s', 'now') - STRFTIME('%s', p.createdAt)) / 3600.0) + 2.0 AS REAL) DESC" 
        : "ORDER BY p.createdAt DESC";

      let whereClause = communityId ? 'WHERE p.communityId = ?' : 'WHERE p.communityId IS NULL';
      let params = communityId ? [communityId] : [];
      
      if (!communityId && req.user) {
        whereClause = 'WHERE p.communityId IS NULL OR p.communityId IN (SELECT communityId FROM community_members WHERE userId = ?)';
        params = [req.user.id];
      }

      const rows = await db.all(`
        SELECT p.*, u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar 
        FROM posts p
        JOIN users u ON p.userId = u.id
        ${whereClause}
        ${orderClause}
      `, params);
      
      let userVotes: Record<number, string> = {};
      let userBookmarks: Set<number> = new Set();
      if (req.user) {
        const vRows = await db.all('SELECT postId, type FROM votes WHERE userId = ?', [req.user.id]);
        vRows.forEach(v => userVotes[v.postId] = v.type);
        const bRows = await db.all('SELECT postId FROM bookmarks WHERE userId = ?', [req.user.id]);
        bRows.forEach(b => userBookmarks.add(b.postId));
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
        timeAgo: row.createdAt,
        title: row.title,
        question: row.question,
        tags: JSON.parse(row.tags),
        upvotes: row.upvotes,
        views: row.views || 0,
        comments: row.comments,
        domain: row.domain || '',
        image: row.image || '',
        userVote: req.user ? (userVotes[row.id] || null) : null,
        isBookmarked: req.user ? userBookmarks.has(row.id) : false
      }));
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  app.get('/api/posts/:id', optionalAuthenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      await db.run('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);

      const row = await db.get(`
        SELECT p.*, u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar 
        FROM posts p
        JOIN users u ON p.userId = u.id
        WHERE p.id = ?
      `, [id]);
      
      if (!row) return res.status(404).json({ error: 'Post not found' });

      let userVote = null;
      let isBookmarked = false;
      if (req.user) {
        const vote = await db.get('SELECT type FROM votes WHERE userId = ? AND postId = ?', [req.user.id, id]);
        if (vote) userVote = vote.type;
        const mark = await db.get('SELECT 1 FROM bookmarks WHERE userId = ? AND postId = ?', [req.user.id, id]);
        if (mark) isBookmarked = true;
      }

      res.json({
        id: row.id,
        author: {
          id: row.authorId,
          name: row.authorName,
          description: row.authorDescription,
          avatar: row.authorAvatar
        },
        createdAt: row.createdAt,
        timeAgo: row.createdAt,
        title: row.title,
        question: row.question,
        tags: JSON.parse(row.tags),
        upvotes: row.upvotes,
        views: row.views || 0,
        comments: row.comments,
        domain: row.domain || '',
        image: row.image || '',
        userVote,
        isBookmarked
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/posts', authenticateToken, async (req: any, res: any) => {
    const { title, question, tags, domain, image, communityId } = req.body;
    try {
      if (communityId && req.user.userType !== 'guvi faculty') {
        return res.status(403).json({ error: 'Only GUVI faculty can post in a community' });
      }

      const result = await db.run(
        'INSERT INTO posts (userId, title, question, tags, domain, image, communityId) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, title, question, JSON.stringify(tags || []), domain || '', image || '', communityId || null]
      );
      
      // Award user points for posting
      await db.run('UPDATE users SET points = points + 5 WHERE id = ?', [req.user.id]);
      
      res.status(201).json({ id: result.lastID });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.put('/api/posts/:id', authenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { question, tags, domain, image } = req.body;
      const post = await db.get('SELECT userId FROM posts WHERE id = ?', [id]);
      if (!post) return res.status(404).json({ error: 'Not found' });
      if (post.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      
      let updateFields = [];
      let params = [];
      if (question !== undefined) { updateFields.push('question = ?'); params.push(question); }
      if (tags !== undefined) { updateFields.push('tags = ?'); params.push(JSON.stringify(tags)); }
      if (domain !== undefined) { updateFields.push('domain = ?'); params.push(domain); }
      if (image !== undefined) { updateFields.push('image = ?'); params.push(image); }
      
      if (updateFields.length > 0) {
        params.push(id);
        const postMeta = await db.get('SELECT communityId FROM posts WHERE id = ?', [id]);
        if (postMeta?.communityId && req.user.userType !== 'guvi faculty') {
          return res.status(403).json({ error: 'Only GUVI faculty can edit community posts' });
        }
        await db.run(`UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`, params);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
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
      
      res.json({ success: true, upvotes: newUpvotes, userVote: diff === 0 ? existingVote.type : (existingVote?.type === type ? null : type) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to vote' });
    }
  });

  app.get('/api/search', optionalAuthenticateToken, async (req: any, res: any) => {
    try {
      const q = (req.query.q || '').toString().trim();
      const domain = (req.query.domain || '').toString().trim();
      const status = (req.query.status || '').toString().trim();
      const searchType = (req.query.type || 'posts').toString().trim();

      if (q.startsWith('@') || searchType === 'users') {
        const username = q.startsWith('@') ? q.slice(1) : q;
        let users: any[];
        if (username) {
          users = await db.all('SELECT id, username, description, role, domain, points, avatar FROM users WHERE username LIKE ? COLLATE NOCASE LIMIT 20', [`%${username}%`]);
        } else {
          users = await db.all('SELECT id, username, description, role, domain, points, avatar FROM users LIMIT 50');
        }
        if (domain) users = users.filter((u: any) => u.domain === domain);
        return res.json({ type: 'users', results: users });
      } else if (!q && !domain && !status) {
        return res.json({ type: 'empty', results: [] });
      } else {
        const isTag = q.startsWith('#');
        const searchTerm = isTag ? q.slice(1) : q;
        
        let queryStr = `
          SELECT p.*, u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar 
          FROM posts p
          JOIN users u ON p.userId = u.id
          WHERE 1=1
        `;
        let queryParams: any[] = [];

        if (isTag) {
           queryStr += ` AND p.tags LIKE ? COLLATE NOCASE`;
           queryParams.push(`%${searchTerm}%`);
        } else if (searchTerm) {
           queryStr += ` AND (p.title LIKE ? COLLATE NOCASE OR p.question LIKE ? COLLATE NOCASE)`;
           queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (domain) {
           queryStr += ` AND p.domain = ?`;
           queryParams.push(domain);
        }
        if (status === 'answered') {
           queryStr += ` AND p.comments > 0`;
        } else if (status === 'unanswered') {
           queryStr += ` AND p.comments = 0`;
        }

        queryStr += ` ORDER BY p.createdAt DESC LIMIT 20`;

        const rows = await db.all(queryStr, queryParams);

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
          timeAgo: row.createdAt, 
          title: row.title,
          question: row.question,
          domain: row.domain || '',
          image: row.image || '',
          tags: JSON.parse(row.tags),
          upvotes: row.upvotes,
          views: row.views || 0,
          comments: row.comments,
          userVote: req.user ? (userVotes[row.id] || null) : null
        }));

        return res.json({ type: 'posts', queryType: isTag ? 'tag' : 'text', results: posts });
      }
    } catch (e) {
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/trending', async (req: any, res: any) => {
    try {
      const rows = await db.all('SELECT tags FROM posts');
      const tagCounts: Record<string, number> = {};
      rows.forEach(row => {
        try {
          const tags: string[] = JSON.parse(row.tags);
          tags.forEach(tag => {
            const t = tag.trim();
            if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        } catch(e) {}
      });
      const sorted = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
      res.json(sorted);
    } catch (e) {
      res.status(500).json([]);
    }
  });

  const getPostWithMeta = async (postRow: any, user: any) => {
    let userVote = null;
    let isBookmarked = false;
    if (user) {
      const vote = await db.get('SELECT type FROM votes WHERE userId = ? AND postId = ?', [user.id, postRow.id]);
      if (vote) userVote = vote.type;
      const mark = await db.get('SELECT 1 FROM bookmarks WHERE userId = ? AND postId = ?', [user.id, postRow.id]);
      if (mark) isBookmarked = true;
    }
    return {
      id: postRow.id,
      author: {
        id: postRow.authorId,
        name: postRow.authorName,
        description: postRow.authorDescription,
        avatar: postRow.authorAvatar
      },
      createdAt: postRow.createdAt,
      timeAgo: postRow.createdAt,
      title: postRow.title,
      question: postRow.question,
      tags: JSON.parse(postRow.tags),
      upvotes: postRow.upvotes,
      views: postRow.views || 0,
      comments: postRow.comments,
      userVote,
      isBookmarked
    };
  };

  app.get('/api/users/me/posts', authenticateToken, async (req: any, res: any) => {
    try {
      const rows = await db.all(`
        SELECT p.*, u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar 
        FROM posts p JOIN users u ON p.userId = u.id 
        WHERE p.userId = ? ORDER BY p.createdAt DESC
      `, [req.user.id]);
      const posts = await Promise.all(rows.map(row => getPostWithMeta(row, req.user)));
      res.json(posts);
    } catch (e) { res.status(500).json({error: 'Failed'}); }
  });

  app.get('/api/users/me/upvotes', authenticateToken, async (req: any, res: any) => {
    try {
      const rows = await db.all(`
        SELECT p.*, u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar 
        FROM posts p 
        JOIN users u ON p.userId = u.id 
        JOIN votes v ON p.id = v.postId
        WHERE v.userId = ? AND v.type = 'up'
        ORDER BY p.createdAt DESC
      `, [req.user.id]);
      const posts = await Promise.all(rows.map(row => getPostWithMeta(row, req.user)));
      res.json(posts);
    } catch (e) { res.status(500).json({error: 'Failed'}); }
  });

  app.get('/api/users/me/replies', authenticateToken, async (req: any, res: any) => {
    try {
      // Returns the answers the user posted, with the question details attached.
      const rows = await db.all(`
        SELECT c.id as commentId, c.question as commentContent, c.createdAt as commentCreatedAt,
               p.id as postId, p.question as postQuestion, p.title as postTitle, p.tags as postTags, p.upvotes as postUpvotes, p.views as postViews, p.comments as postComments, p.createdAt as postCreatedAt,
               u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar
        FROM comments c
        JOIN posts p ON c.postId = p.id
        JOIN users u ON p.userId = u.id
        WHERE c.userId = ?
        ORDER BY c.createdAt DESC
      `, [req.user.id]);
      const replies = rows.map(r => ({
        id: r.commentId,
        content: r.commentContent,
        createdAt: r.commentCreatedAt,
        post: {
          id: r.postId, question: r.postQuestion,
          author: { id: r.authorId, name: r.authorName, avatar: r.authorAvatar }
        }
      }));
      res.json(replies);
    } catch (e) { res.status(500).json({error: 'Failed'}); }
  });

  app.get('/api/notifications', authenticateToken, async (req: any, res: any) => {
    try {
      const rows = await db.all(`
        SELECT n.*, u.username as actorName, u.avatar as actorAvatar, p.title as postTitle
        FROM notifications n
        JOIN users u ON n.actorId = u.id
        LEFT JOIN posts p ON n.postId = p.id
        WHERE n.userId = ?
        ORDER BY n.createdAt DESC LIMIT 50
      `, [req.user.id]);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.put('/api/notifications/:id/read', authenticateToken, async (req: any, res: any) => {
    try {
      await db.run('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Bookmarks
  app.get('/api/bookmarks', authenticateToken, async (req: any, res: any) => {
    try {
      const rows = await db.all(`
        SELECT p.*, b.category as bookmarkCategory, u.id as authorId, u.username as authorName, u.description as authorDescription, u.avatar as authorAvatar
        FROM bookmarks b
        JOIN posts p ON b.postId = p.id
        JOIN users u ON p.userId = u.id
        WHERE b.userId = ?
        ORDER BY b.createdAt DESC
      `, [req.user.id]);
      const posts = rows.map(row => ({
        id: row.id,
        author: { id: row.authorId, name: row.authorName, description: row.authorDescription, avatar: row.authorAvatar },
        createdAt: row.createdAt,
        title: row.title,
        question: row.question,
        tags: JSON.parse(row.tags),
        upvotes: row.upvotes,
        views: row.views || 0,
        comments: row.comments,
        domain: row.domain || '',
        image: row.image || '',
        bookmarkCategory: row.bookmarkCategory || 'General',
        userVote: null,
        isBookmarked: true
      }));
      res.json(posts);
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/bookmarks/:postId', authenticateToken, async (req: any, res: any) => {
    try {
      const category = req.body?.category || 'General';
      const exists = await db.get('SELECT 1 FROM bookmarks WHERE userId = ? AND postId = ?', [req.user.id, req.params.postId]);
      if (exists) {
        await db.run('UPDATE bookmarks SET category = ? WHERE userId = ? AND postId = ?', [category, req.user.id, req.params.postId]);
      } else {
        await db.run('INSERT INTO bookmarks (userId, postId, category) VALUES (?, ?, ?)', [req.user.id, req.params.postId, category]);
      }
      res.json({ bookmarked: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/bookmarks/:postId', authenticateToken, async (req: any, res: any) => {
    try {
      await db.run('DELETE FROM bookmarks WHERE userId = ? AND postId = ?', [req.user.id, req.params.postId]);
      res.json({ bookmarked: false });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Bookmark Lists Management
  app.get('/api/bookmarks/lists', authenticateToken, async (req: any, res: any) => {
    try {
      // Ensure General exists implicitly, return all distinct categories
      const rows = await db.all('SELECT DISTINCT category FROM bookmarks WHERE userId = ?', [req.user.id]);
      const customLists = await db.all('SELECT name FROM bookmark_lists WHERE userId = ?', [req.user.id]);
      
      const allLists = new Set(['General']);
      rows.forEach(r => { if (r.category) allLists.add(r.category); });
      customLists.forEach(l => allLists.add(l.name));
      
      res.json(Array.from(allLists));
    } catch (e) {
      // Create table if it doesn't exist dynamically to save db.ts modification space
      await db.run('CREATE TABLE IF NOT EXISTS bookmark_lists (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, name TEXT, UNIQUE(userId, name))').catch(() => {});
      res.json(['General']);
    }
  });

  app.post('/api/bookmarks/lists', authenticateToken, async (req: any, res: any) => {
    const { name } = req.body;
    try {
      await db.run('CREATE TABLE IF NOT EXISTS bookmark_lists (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, name TEXT, UNIQUE(userId, name))').catch(() => {});
      await db.run('INSERT INTO bookmark_lists (userId, name) VALUES (?, ?)', [req.user.id, name]);
      res.json({ success: true, name });
    } catch (e) {
      res.status(500).json({ error: 'Failed or already exists' });
    }
  });

  app.put('/api/bookmarks/lists', authenticateToken, async (req: any, res: any) => {
    const { oldName, newName } = req.body;
    try {
      await db.run('CREATE TABLE IF NOT EXISTS bookmark_lists (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, name TEXT, UNIQUE(userId, name))').catch(() => {});
      // Update custom table
      await db.run('UPDATE bookmark_lists SET name = ? WHERE userId = ? AND name = ?', [newName, req.user.id, oldName]);
      // Update actual bookmarks
      await db.run('UPDATE bookmarks SET category = ? WHERE userId = ? AND category = ?', [newName, req.user.id, oldName]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Follow lists for current user
  app.get('/api/users/me/followers', authenticateToken, async (req: any, res: any) => {
    try {
      const rows = await db.all(`
        SELECT u.id, u.username, u.avatar, u.role, u.domain
        FROM followers f JOIN users u ON f.followerId = u.id
        WHERE f.followingId = ?
        ORDER BY f.createdAt DESC
      `, [req.user.id]);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/users/me/following', authenticateToken, async (req: any, res: any) => {
    try {
      const rows = await db.all(`
        SELECT u.id, u.username, u.avatar, u.role, u.domain
        FROM followers f JOIN users u ON f.followingId = u.id
        WHERE f.followerId = ?
        ORDER BY f.createdAt DESC
      `, [req.user.id]);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
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
        question: row.question,
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
    const { question, parentId } = req.body;
    try {
      const result = await db.run(
        'INSERT INTO comments (postId, userId, parentId, question) VALUES (?, ?, ?, ?)',
        [id, req.user.id, parentId || null, question]
      );
      
      await db.run('UPDATE posts SET comments = comments + 1 WHERE id = ?', [id]);
      await db.run('UPDATE users SET points = points + 1 WHERE id = ?', [req.user.id]);
      
      // Create notification for post owner
      const post = await db.get('SELECT userId FROM posts WHERE id = ?', [id]);
      if (post && post.userId !== req.user.id) {
         await db.run(
           'INSERT INTO notifications (userId, actorId, type, postId) VALUES (?, ?, ?, ?)',
           [post.userId, req.user.id, 'comment', id]
         );
      }

      // Add notifications for mentioned users
      const mentions = question.match(/@(\w+)/g) || [];
      const tagSeen = new Set<string>();
      for (const m of mentions) {
        const username = m.substring(1);
        if (tagSeen.has(username.toLowerCase())) continue;
        tagSeen.add(username.toLowerCase());
        
        const taggedUser = await db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE', [username]);
        if (taggedUser && taggedUser.id !== req.user.id && (!post || taggedUser.id !== post.userId)) {
           await db.run(
             'INSERT INTO notifications (userId, actorId, type, postId) VALUES (?, ?, ?, ?)',
             [taggedUser.id, req.user.id, 'mention', id]
           );
        }
      }

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
      const user = await db.get('SELECT id, username, description, avatar, points, location, interests, role, domain, userType, createdAt FROM users WHERE id = ?', [req.params.id]);
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
        
        // Create notification
        await db.run(
          'INSERT INTO notifications (userId, actorId, type) VALUES (?, ?, ?)',
          [followingId, followerId, 'follow']
        );

        res.json({ following: true });
      }
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.put('/api/users/profile', authenticateToken, async (req: any, res: any) => {
    const { avatar, description, location, interests, role, domain } = req.body;
    try {
      await db.run(
        'UPDATE users SET avatar = ?, description = ?, location = ?, interests = ?, role = ?, domain = ? WHERE id = ?', 
        [avatar || '/Blank profile.png', description, location, interests, role, domain, req.user.id]
      );
      const user = await db.get('SELECT id, username, avatar, description, location, interests, role, domain, points, userType FROM users WHERE id = ?', [req.user.id]);
      res.json({ success: true, user });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Communities Routes
  app.post('/api/communities', authenticateToken, async (req: any, res: any) => {
    if (req.user.userType !== 'guvi faculty') {
      return res.status(403).json({ error: 'Only GUVI faculty can create communities' });
    }
    const { name, description } = req.body;
    if (!name || !description) return res.status(400).json({ error: 'Name and description are required' });
    try {
      const result = await db.run('INSERT INTO communities (name, description, createdBy) VALUES (?, ?, ?)', [name, description, req.user.id]);
      await db.run('INSERT INTO community_members (userId, communityId) VALUES (?, ?)', [req.user.id, result.lastID]);
      res.status(201).json({ id: result.lastID, success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to create community' });
    }
  });

  app.get('/api/communities', optionalAuthenticateToken, async (req: any, res: any) => {
    try {
      const communities = await db.all('SELECT c.*, u.username as creatorName FROM communities c JOIN users u ON c.createdBy = u.id ORDER BY c.createdAt DESC');
      
      let memberCommunities = new Set();
      if (req.user) {
        const memberships = await db.all('SELECT communityId FROM community_members WHERE userId = ?', [req.user.id]);
        memberships.forEach(m => memberCommunities.add(m.communityId));
      }

      const results = communities.map(c => ({
        ...c,
        isMember: req.user ? memberCommunities.has(c.id) : false
      }));
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: 'Failed to list communities' });
    }
  });

  app.post('/api/communities/:id/join', authenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const exists = await db.get('SELECT 1 FROM community_members WHERE userId = ? AND communityId = ?', [req.user.id, id]);
      if (exists) {
        return res.status(400).json({ error: 'Already a member' });
      }
      await db.run('INSERT INTO community_members (userId, communityId) VALUES (?, ?)', [req.user.id, id]);
      res.json({ success: true, joined: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to join community' });
    }
  });

  app.get('/api/communities/:id', optionalAuthenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const community = await db.get('SELECT c.*, u.username as creatorName FROM communities c JOIN users u ON c.createdBy = u.id WHERE c.id = ?', [id]);
      if (!community) return res.status(404).json({ error: 'Not found' });

      let isMember = false;
      if (req.user) {
        const membership = await db.get('SELECT 1 FROM community_members WHERE userId = ? AND communityId = ?', [req.user.id, id]);
        isMember = !!membership;
      }

      const memberCount = await db.get('SELECT COUNT(*) as count FROM community_members WHERE communityId = ?', [id]);
      res.json({ ...community, isMember, memberCount: memberCount.count });
    } catch (e) {
      res.status(500).json({ error: 'Failed to get community' });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to init DB', err);
});
