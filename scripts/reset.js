import { clearAll, seed } from '../src/seed.js';

clearAll();
const count = seed();
console.log(`Database reset. Re-seeded ${count} products.`);
