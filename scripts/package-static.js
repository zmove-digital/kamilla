// ============================================================================
// KAMILLA · gera um pacote estático pronto para upload em qualquer hospedagem.
//
//   node scripts/package-static.js
//   npm run package:static
//
// Saída:
//   dist/kamilla-hospedagem/       (arquivos soltos)
//   dist/kamilla-hospedagem.zip    (zip para enviar ao painel da hospedagem)
//
// O pacote funciona na raiz do domínio ou em uma subpasta. O Supabase continua
// sendo o backend (não é necessário Node/PHP na hospedagem).
// ============================================================================
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(DIST, 'kamilla-hospedagem');
const ZIP = join(DIST, 'kamilla-hospedagem.zip');

function copy(source, destination = source) {
  const from = join(ROOT, source);
  if (!existsSync(from)) throw new Error(`Arquivo não encontrado: ${source}`);
  cpSync(from, join(OUT, destination), { recursive: true });
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Shell da SPA. `apresentacao.html` é opcional, mas vai junto.
copy('index.html');
copy('apresentacao.html');
copy('.nojekyll');

// Assets e código do frontend.
copy('public/styles.css');
copy('public/logo.svg');
copy('public/favicon.svg');
copy('public/images');
copy('public/store');

// Remove o app SSR legado caso ele exista no diretório public.
// (O pacote estático usa apenas public/store/*.)
rmSync(join(OUT, 'public', 'app.js'), { force: true });
rmSync(join(OUT, 'public', 'images', '.gitkeep'), { force: true });

execFileSync(
  'powershell.exe',
  [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `Compress-Archive -Path '${OUT.replace(/'/g, "''")}\\*' -DestinationPath '${ZIP.replace(/'/g, "''")}' -Force`,
  ],
  { stdio: 'inherit' }
);

const zipSize = statSync(ZIP).size;
console.log('');
console.log('Pacote estático gerado:');
console.log(`  Pasta: ${OUT}`);
console.log(`  Zip:   ${ZIP} (${(zipSize / 1024).toFixed(1)} KB)`);
console.log('');
console.log('Envie o CONTEÚDO da pasta (ou o zip) para public_html/ ou para a raiz do site.');
