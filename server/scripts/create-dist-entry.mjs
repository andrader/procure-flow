// Creates server/dist/index.js that forwards to the actual compiled entry at server/dist/server/src/index.js
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants as FS_CONSTANTS } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distDir = path.resolve(__dirname, '..', 'dist');
  const nestedEntry = path.join(distDir, 'server', 'src', 'index.js');
  const topLevelEntry = path.join(distDir, 'index.js');

  // Ensure dist exists
  await mkdir(distDir, { recursive: true });

  // Warn if the nested entry doesn't exist yet (build order issue)
  try {
    await access(nestedEntry, FS_CONSTANTS.R_OK);
  } catch {
    // Not fatal; we still create the shim so Vercel finds an entry file.
  }

  // Include an explicit express import so platforms that statically analyze
  // the entrypoint (like Vercel) detect an Express server.
  const contents = "import 'express';\nimport './server/src/index.js';\n";
  await writeFile(topLevelEntry, contents, 'utf8');
  console.log(`[postbuild] Wrote entrypoint: ${path.relative(process.cwd(), topLevelEntry)}`);
}

main().catch((err) => {
  console.error('[postbuild] Failed to create dist/index.js', err);
  process.exit(1);
});
