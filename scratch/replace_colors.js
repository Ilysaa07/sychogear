const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /bg-\[\#000\]/g, replace: 'bg-void' },
  { search: /bg-\[\#020202\]/g, replace: 'bg-void' },
  { search: /bg-\[\#050505\]\/70/g, replace: 'bg-void/70' },
  { search: /border-\[\#111\]/g, replace: 'border-ember' },
  { search: /bg-\[\#111512\]/g, replace: 'bg-void' },
  { search: /text-\[\#111512\]/g, replace: 'text-salt' },
  { search: /hover:bg-\[\#e6e6e6\]/g, replace: 'hover:bg-dim' },
  { search: /bg-black\/(\d+)/g, replace: 'bg-void/$1' },
  { search: /bg-black/g, replace: 'bg-void' },
  { search: /border-white\/(\d+)/g, replace: 'border-salt/$1' },
  { search: /border-white/g, replace: 'border-salt' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('app').concat(walk('components'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;
  
  for (const { search, replace } of replacements) {
    if (search.test(content)) {
      content = content.replace(search, replace);
      changed = true;
    }
  }

  // Handle specific things like `bg-[#25d366] text-white` which shouldn't become text-salt maybe?
  // Let's leave text-white alone unless it's a structural class, wait, text-white was used mostly for dark mode text.
  // Actually text-white in a dark theme should become text-salt. Let's do it carefully.
  if (content.includes('text-white')) {
    // If it's a green or red button, let's keep text-white maybe, or just let text-white become text-void (white in light theme). Wait.
    // In our globals.css:
    // --void is white, --salt is black.
    // If someone hardcoded `text-white`, they literally meant white (#fff).
    // In a light theme, we often want black text (text-salt).
    // But if it's on a green button `bg-[#25d366] text-white`, it needs to stay white!
    // So I shouldn't replace text-white blindly.
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}
