import { clearAll, seed } from '../src/seed.js';

clearAll();
const count = seed();
console.log(`Banco resetado. ${count} produtos recriados.`);
