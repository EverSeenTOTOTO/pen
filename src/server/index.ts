import { formatPath, path } from '@/utils';
import express, { Express } from 'express';
import getPort from 'detect-port';
import { RenderOptions, bindRender } from './ssr';
import { logger as builtInLogger, emptyLogger } from './logger';
import { WatcherOptions, Watcher } from './watcher';
import { themes } from './theme';

export type PenOptions = Partial<Omit<RenderOptions, 'watcher'>> & Partial<Omit<WatcherOptions, 'emit'>>
& {
  silent?: boolean,
};

export const normalizeOptions = (opts?: PenOptions): Required<PenOptions> => {
  const silent = opts?.silent ?? false;
  const logger = silent ? emptyLogger : builtInLogger;

  return {
    silent,
    ignores: opts?.ignores ?? [],
    logger: silent ? emptyLogger : logger,
    theme: opts?.theme ?? { name: 'light', options: themes.light, avaliable: [] },
    root: opts?.root ? formatPath(opts?.root) : process.cwd(),
    namespace: opts?.namespace ? formatPath(opts?.namespace) : '/',
    dist: opts?.dist ? formatPath(opts?.dist) : path.join(__dirname),
  };
};

export const bindMiddleware = async (server: Express, options: Required<PenOptions>) => {
  const watcher = new Watcher({ ...options, emit: console.log });

  await watcher.setupWatching('.');
  bindRender(server, { ...options, watcher });

  server.on('close', () => watcher.close());
};

export type ServerOptions = PenOptions & {
  port?: number;
};

// hypothesis: client assets to be in the same directory
export const createServer = async (opts?: ServerOptions) => {
  const server = express();
  const options = normalizeOptions(opts);

  await bindMiddleware(server, options);

  const avaliablePort = await getPort(opts?.port ?? 3000);

  if (avaliablePort !== opts?.port) {
    options.logger.warn(`Pen found port ${opts?.port} unavaliable, use random port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    console.log(`server listening on ${avaliablePort}`);
  });
};

createServer();
