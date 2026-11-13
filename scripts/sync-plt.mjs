import {readdir, readFile, mkdir, rm, writeFile} from 'node:fs/promises';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const platformRoot = join(
  repositoryRoot,
  'node_modules',
  '@playlovetoys',
  'platform',
);
const liquidSource = join(
  platformRoot,
  'packages',
  'web-components',
  'adapters',
  'liquid',
);
const checkMode = process.argv.includes('--check');

if (
  process.argv.length > 3 ||
  (process.argv.length === 3 && process.argv[2] !== '--check')
) {
  throw new Error('Usage: node scripts/sync-plt.mjs [--check]');
}

const liquidEntries = (await readdir(liquidSource, {withFileTypes: true}))
  .filter((entry) => entry.isFile() && /^plt-.*\.liquid$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const artifacts = [
  {
    source: join(
      platformRoot,
      'packages',
      'web-components',
      'dist',
      'plt-web-components.bundle.js',
    ),
    destination: join(repositoryRoot, 'assets', 'plt-web-components.bundle.js'),
  },
  ...liquidEntries.map((name) => ({
    source: join(liquidSource, name),
    destination: join(repositoryRoot, 'snippets', name),
  })),
  ...['variant-picker.css', 'web-components.css'].map((name) => ({
    source: join(
      platformRoot,
      'packages',
      'design-system',
      'src',
      'components',
      name,
    ),
    destination: join(repositoryRoot, 'styles', 'plt', name),
  })),
];

const expectedLiquidFiles = new Set(liquidEntries);
const destinationLiquidFiles = (await readdir(join(repositoryRoot, 'snippets')))
  .filter((name) => /^plt-.*\.liquid$/.test(name))
  .sort();
const unexpectedLiquidFiles = destinationLiquidFiles.filter(
  (name) => !expectedLiquidFiles.has(name),
);

if (!checkMode) {
  for (const name of unexpectedLiquidFiles) {
    await rm(join(repositoryRoot, 'snippets', name));
  }

  for (const artifact of artifacts) {
    await mkdir(dirname(artifact.destination), {recursive: true});
    await writeFile(artifact.destination, await readFile(artifact.source));
    process.stdout.write(
      `Synced ${relative(repositoryRoot, artifact.destination)}\n`,
    );
  }

  process.stdout.write(`Synced ${artifacts.length} PLT shared artifacts.\n`);
  process.exit(0);
}

const drift = unexpectedLiquidFiles.map(
  (name) => `snippets/${name} (unexpected)`,
);

for (const artifact of artifacts) {
  const destinationPath = relative(repositoryRoot, artifact.destination);

  try {
    const [source, destination] = await Promise.all([
      readFile(artifact.source),
      readFile(artifact.destination),
    ]);

    if (!source.equals(destination)) {
      drift.push(`${destinationPath} (content differs)`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      drift.push(`${destinationPath} (missing)`);
      continue;
    }

    throw error;
  }
}

if (drift.length > 0) {
  process.stderr.write('PLT shared artifacts are out of sync:\n');
  process.stderr.write(`${drift.map((entry) => `- ${entry}`).join('\n')}\n`);
  process.stderr.write('Run npm run sync:plt and commit the results.\n');
  process.exit(1);
}

process.stdout.write(`Verified ${artifacts.length} PLT shared artifacts.\n`);
