import { build } from 'esbuild';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const contracts = ['check-handoff-schemas.cjs', 'test-design-handoff.cjs', 'test-design-catalog.cjs', 'test-navigation-designs.cjs', 'test-design-concepts.cjs', 'test-ui-libraries.cjs', 'test-library-metrics.cjs'];
function run(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}
if (process.argv.includes('--contracts')) {
  for (const script of contracts) {
    const status = run(['--test', `scripts/${script}`]);
    if (status) process.exit(status);
  }
} else {
  const directory = mkdtempSync(join(tmpdir(), 'palette-state-'));
  try {
    const entries = ['selection-store', 'selection-persistence'].map(name => `src/core/${name}.ts`).filter(name => existsSync(join(root, name)));
    if (entries.length) await build({ absWorkingDir: root, entryPoints: entries, outdir: directory, bundle: true, platform: 'node', format: 'cjs', outExtension: { '.js': '.cjs' } });
    process.exitCode = run(['--test', 'scripts/test-selection-state.cjs'], { ...process.env, STUDIO_STATE_BUILD: directory });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
