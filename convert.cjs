const fs = require('fs');
const path = require('path');

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function processObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(processObject);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key of Object.keys(obj)) {
      if (key === '_metadata' || key === '_testing_stub') {
        if (key === '_metadata') {
           newObj[key] = processObject(obj[key]);
        }
        continue;
      }
      const newKey = toCamelCase(key);
      
      if (newKey === 'description' && typeof obj[key] === 'string') {
        newObj[newKey] = { en: obj[key] };
      } else {
        newObj[newKey] = processObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

const filesToProcess = [
  path.join(__dirname, 'backend', 'stadium_data.json'),
  path.join(__dirname, 'stadium_data.json')
];

for (const file of filesToProcess) {
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const transformed = processObject(data);
    fs.writeFileSync(file, JSON.stringify(transformed, null, 2));
    console.log(`Processed ${file}`);
  }
}
