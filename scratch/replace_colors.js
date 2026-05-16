const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components')
];

const extensions = ['.tsx', '.ts', '.css'];

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkAndReplace(fullPath);
    } else if (extensions.includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Perform regex replacements for Tailwind color classes
      // We want to replace exactly "-blue-" or "blue-" at word boundaries.
      // E.g. bg-blue-600 -> bg-red-600
      // E.g. text-blue-500 -> text-red-500
      // E.g. border-blue-200 -> border-red-200
      // We must avoid replacing things like "bluetooth" (though unlikely)
      
      const originalContent = content;
      
      content = content.replace(/bg-blue-/g, 'bg-red-');
      content = content.replace(/text-blue-/g, 'text-red-');
      content = content.replace(/border-blue-/g, 'border-red-');
      content = content.replace(/ring-blue-/g, 'ring-red-');
      content = content.replace(/from-blue-/g, 'from-red-');
      content = content.replace(/to-blue-/g, 'to-red-');
      content = content.replace(/via-blue-/g, 'via-red-');
      content = content.replace(/shadow-blue-/g, 'shadow-red-');
      content = content.replace(/fill-blue-/g, 'fill-red-');
      content = content.replace(/stroke-blue-/g, 'stroke-red-');
      
      // Also some custom classes in globals.css
      content = content.replace(/blue-gradient-text/g, 'red-gradient-text');
      content = content.replace(/deep-blue-bg/g, 'deep-red-bg');
      
      if (originalContent !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkAndReplace(dir);
  }
});
console.log('Replacement complete.');
