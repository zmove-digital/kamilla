import { clearAll, seed } from '../src/seed.js';
import { config } from '../src/config.js';

// Optional flags: --keep (add without wiping)
const keep = process.argv.includes('--keep');

if (!keep) clearAll();
const count = seed();
console.log(`Seeded ${count} products into ${config.databasePath}`);
