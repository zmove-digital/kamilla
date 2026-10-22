import { seedIfEmpty } from '../src/seed.js';
import { config } from '../src/config.js';

// Safe by default: only fills an empty database. Use `npm run reset` to wipe and
// recreate the demo catalog.
const count = seedIfEmpty();

if (count) {
  console.log(`Catálogo demo criado: ${count} produtos em ${config.databasePath}`);
} else {
  console.log(
    `O banco já possui produtos — nada foi alterado.\nUse "npm run reset" para apagar tudo e recriar o catálogo demo.\nBanco: ${config.databasePath}`
  );
}
