const fs = require('fs');
const raw = fs.readFileSync('scripts/abhibus-services-full.json', 'utf8');
const json = JSON.parse(raw);

console.log('Top-level keys:', Object.keys(json));
console.log('Status:', json.status);

// Find the services/buses array
for (const key of Object.keys(json)) {
  const val = json[key];
  if (Array.isArray(val)) {
    console.log(`\nKey "${key}" is an array of length`, val.length);
    console.log('First item keys:', Object.keys(val[0]));
    console.log('First item:\n', JSON.stringify(val[0], null, 2).slice(0, 3000));
    break;
  } else if (typeof val === 'object' && val !== null) {
    const subKeys = Object.keys(val);
    console.log(`\nKey "${key}" is an object with ${subKeys.length} sub-keys`);
    // Check if any sub-key is an array
    for (const sk of subKeys.slice(0, 5)) {
      if (Array.isArray(val[sk])) {
        console.log(`  Sub-key "${sk}" is array[${val[sk].length}]`);
        console.log('  First item keys:', Object.keys(val[sk][0]));
        console.log('  First item:\n', JSON.stringify(val[sk][0], null, 2).slice(0, 3000));
      }
    }
  }
}
