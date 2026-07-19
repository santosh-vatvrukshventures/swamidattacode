const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
let errorFound = false;
// Look for obvious JSX syntax errors or typos like missing closing tags
console.log("Checking App.tsx for syntax errors...");
try {
  require('@babel/core').transformSync(content, {
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
    filename: 'App.tsx'
  });
  console.log("Syntax is valid!");
} catch (e) {
  console.error("Syntax Error!", e.message);
  errorFound = true;
}
