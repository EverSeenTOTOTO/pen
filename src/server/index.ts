import { formatPath, path } from '@/utils';
import express from 'express';
import getPort from 'detect-port';
import { RenderOptions, bindRender } from './render';
import { logger as builtInLogger, emptyLogger } from './logger';
import { WatcherOptions } from './watcher';
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

export type ServerOptions = PenOptions & {
  port?: number;
};

// hypothesis: client assets to be in the same directory
export const createServer = async (opts?: ServerOptions) => {
  const server = express();
  const options = normalizeOptions(opts);

  bindRender(server, options);

  const avaliablePort = await getPort(opts?.port ?? 3000);

  if (avaliablePort !== opts?.port) {
    options.logger.warn(`Pen found port ${opts?.port} unavaliable, use port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    console.log(`server listening on ${avaliablePort}`);
  });
};

createServer();
