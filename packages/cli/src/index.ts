import { build, createServer, preview } from 'vite';

import { buildConfig } from './config';

const HELP = `sim — the sim game framework CLI

Usage:
  sim dev       Start the dev server (game at /, content editor at /editor)
  sim build     Type-agnostic single-file build → dist/index.html
  sim editor    Start the dev server and print the editor URL
  sim preview   Preview a production build
  sim check     Validate game content (coming soon)
`;

async function main(): Promise<void> {
  const cwd = process.cwd();
  const cmd = process.argv[2];

  switch (cmd) {
    case 'dev':
    case 'editor': {
      const server = await createServer(
        await buildConfig({ cwd, build: false, mode: 'development' }),
      );
      await server.listen();
      server.printUrls();
      if (cmd === 'editor') {
        const base = server.resolvedUrls?.local[0];
        console.log(`\n  ➜  Editor:  ${base ? `${base}editor` : '/editor'}\n`);
      }
      break;
    }
    case 'build': {
      await build(await buildConfig({ cwd, build: true, mode: 'production' }));
      break;
    }
    case 'preview': {
      const server = await preview(
        await buildConfig({ cwd, build: true, mode: 'production' }),
      );
      server.printUrls();
      break;
    }
    case 'check': {
      console.error('`sim check` is not implemented yet (Phase 3).');
      process.exit(1);
      break;
    }
    default: {
      console.log(HELP);
      if (cmd) process.exit(1);
    }
  }
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
