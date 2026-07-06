const fs = require('fs');
const calls = JSON.parse(fs.readFileSync('scripts/abhibus2-api.json', 'utf8'));
const s = calls.find(c => c.url.includes('/buslist/v3/services') && !c.url.includes('meta'));
const body = s.body;

console.log('Body length:', body.length);

// Extract all unique keys
const keys = new Set();
const re = /"([a-zA-Z][a-zA-Z0-9_]{2,30})":/g;
let m;
while ((m = re.exec(body)) !== null) keys.add(m[1]);
console.log('\nAll keys:', [...keys].sort().join(', '));

// Find the services/buses array
const servicesIdx = body.indexOf('"services"');
const busesIdx = body.indexOf('"buses"');
const dataIdx = body.indexOf('"data"');
console.log('\nservices key at:', servicesIdx);
console.log('buses key at:', busesIdx);
console.log('data key at:', dataIdx);

// Show snippet around first bus-like structure
const opIdx = body.indexOf('"operatorName"');
if (opIdx > 0) {
  console.log('\nAround operatorName:\n', body.slice(Math.max(0, opIdx - 200), opIdx + 500));
}

// Show the structure around the services array start
const svcStart = body.indexOf('"services":[');
if (svcStart > 0) {
  console.log('\nFirst service entry:\n', body.slice(svcStart, svcStart + 2000));
}
