import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Version ranges written into the scaffolded game's package.json. */
const FRAMEWORK_VERSIONS: Record<string, string> = {
  '@sim/engine': '^0.1.0',
  sim: '^0.1.0',
  '@sim/config': '^0.1.0',
};

const here = path.dirname(fileURLToPath(import.meta.url));

/** Locate the starter: bundled `./template` (published) or the monorepo copy. */
function resolveTemplateDir(): string {
  const candidates = [
    path.resolve(here, '..', 'template'),
    path.resolve(here, '..', '..', '..', 'templates', 'starter'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
  }
  throw new Error('Could not locate the starter template.');
}

function copyTemplate(from: string, to: string): void {
  fs.cpSync(from, to, {
    recursive: true,
    filter: (p) =>
      !p.split(path.sep).includes('node_modules') &&
      path.basename(p) !== 'dist' &&
      !p.endsWith('.tsbuildinfo'),
  });
}

/** Set the game name and swap workspace:* deps for real version ranges. */
function finalizePackageJson(dir: string, name: string): void {
  const pkgPath = path.join(dir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
    name: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  pkg.name = name;
  for (const group of [pkg.dependencies, pkg.devDependencies]) {
    if (!group) continue;
    for (const dep of Object.keys(group)) {
      if (group[dep] === 'workspace:*') {
        group[dep] = FRAMEWORK_VERSIONS[dep] ?? 'latest';
      }
    }
  }
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function main(): void {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: create-sim-game <directory>');
    process.exit(1);
  }

  const dest = path.resolve(process.cwd(), target);
  const name = path.basename(dest);

  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    console.error(`✗ Directory "${target}" already exists and is not empty.`);
    process.exit(1);
  }

  const template = resolveTemplateDir();
  fs.mkdirSync(dest, { recursive: true });
  copyTemplate(template, dest);
  finalizePackageJson(dest, name);

  // npm ignores a committed .gitignore during publish, so ship it as _gitignore
  // and restore the dotfile name here if present.
  const underscored = path.join(dest, '_gitignore');
  if (fs.existsSync(underscored)) {
    fs.renameSync(underscored, path.join(dest, '.gitignore'));
  }

  console.log(`
✓ Created ${name} at ${dest}

  Next steps:
    cd ${target}
    npm install
    npm run dev        # game at /, content editor at /editor

  Then edit src/game/data/*.json to build your world.
`);
}

main();
