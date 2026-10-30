/** Static check: every relative require() in src/ must resolve to a real file. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
})(ROOT);

let bad = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const re = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  let match;
  while ((match = re.exec(source))) {
    const target = path.resolve(path.dirname(file), match[1]);
    const ok = [target, `${target}.js`, path.join(target, 'index.js')].some((candidate) => fs.existsSync(candidate));
    if (!ok) {
      bad += 1;
      console.log(`BROKEN  ${path.relative(ROOT, file)}  ->  ${match[1]}`);
    }
  }
}

console.log(bad === 0 ? `OK: all relative requires resolve (${files.length} files checked)` : `${bad} broken require(s)`);
process.exit(bad ? 1 : 0);
