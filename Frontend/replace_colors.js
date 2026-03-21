// const fs = require('fs');
// const path = require('path');

// function walk(dir) {
//   let results = [];
//   const list = fs.readdirSync(dir);
//   list.forEach(function(file) {
//     file = path.join(dir, file);
//     const stat = fs.statSync(file);
//     if (stat && stat.isDirectory()) { 
//       results = results.concat(walk(file));
//     } else { 
//       if (file.endsWith('.tsx') || file.endsWith('.ts')) {
//         results.push(file);
//       }
//     }
//   });
//   return results;
// }

// const files = walk('d:/Typescript/Forum/src');
// let count = 0;
// files.forEach(file => {
//   let content = fs.readFileSync(file, 'utf8');
//   let newContent = content.replace(/\bblue-(50|100|200|300|400|500|600|700|800|900|950)\b/g, 'green-$1');
//   if (content !== newContent) {
//     fs.writeFileSync(file, newContent, 'utf8');
//     count++;
//   }
// });

// console.log('Replaced colors in ' + count + ' files.');
