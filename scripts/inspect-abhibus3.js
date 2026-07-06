const fs = require('fs');
const json = JSON.parse(fs.readFileSync('scripts/abhibus-services-full.json', 'utf8'));
const s = json.services[0];

console.log('sourceId:', json.sourceId);
console.log('destinationId:', json.destinationId);
console.log('journeyDate:', json.journeyDate);
console.log('services count:', json.services.length);
console.log('\n--- Service sample ---');
console.log('serviceId:', s.serviceId);
console.log('serviceKey:', s.serviceKey);
console.log('travelerAgentName:', s.travelerAgentName);
console.log('busTypeName:', s.busTypeName);
console.log('timings:', JSON.stringify(s.timings));
console.log('fares:', JSON.stringify(s.fares));
console.log('seatStats:', JSON.stringify(s.seatStats));
console.log('rating:', s.rating);
console.log('noOfRatings:', s.noOfRatings);

// Check booking URL pattern from a second service
const s2 = json.services[5];
console.log('\n--- Service 2 ---');
console.log('serviceId:', s2.serviceId);
console.log('serviceKey:', s2.serviceKey);
console.log('travelerAgentName:', s2.travelerAgentName);
console.log('timings:', JSON.stringify(s2.timings));
console.log('fares:', JSON.stringify(s2.fares));

// What does the booking URL look like?
// Pattern from the search URL: /bus_search/Bangalore/7/Hyderabad/3/06-07-2026/O
// Booking is likely: /book/{serviceId}/{from}/{fromId}/{to}/{toId}/{date}
console.log('\nAbhiBus URL pattern from probe:', 'https://www.abhibus.com/bus_search/Bangalore/7/Hyderabad/3/06-07-2026/O');
console.log('Booking URL pattern (guessed):', `https://www.abhibus.com/book/${s.serviceId}/Bangalore/7/Hyderabad/3/06-07-2026`);
