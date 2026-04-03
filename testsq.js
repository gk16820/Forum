const sqlite3 = require('d:/Typescript/Forum-server1/node_modules/sqlite3');
const { open } = require('d:/Typescript/Forum-server1/node_modules/sqlite');

async function test() {
  const db = await open({
    filename: 'D:/Typescript/Forum-server1/forum.sqlite',
    driver: sqlite3.Database
  });

  try {
    await db.run('INSERT INTO votes (postId, userId, type) VALUES (?, ?, ?)', [2, 1, 'up']);
    console.log('Insert successful');
  } catch(e) {
    console.error('Insert error:', e.message);
  }

  try {
    await db.run('UPDATE users SET points = points + ? WHERE id = ?', [1, 1]);
    console.log('Update users successful');
  } catch(e) {
    console.error('Update users error:', e.message);
  }
}

test();
