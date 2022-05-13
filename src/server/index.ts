import { formatPath, path } from '@/utils';
import express, { Express } from 'express';
import getPort from 'detect-port';
import { RenderOptions, bindRender } from './ssr';
import { logger as builtInLogger, emptyLogger } from './logger';
import { WatcherOptions, Watcher } from './watcher';

export type ServerOptions = Partial<Omit<RenderOptions, 'watcher'>>
& Partial<Omit<WatcherOptions, 'emit'>>
& {
  port?: number,
  silent?: boolean,
};

export const normalizeOptions = async (opts?: ServerOptions): Promise<Required<ServerOptions>> => {
  const silent = opts?.silent ?? false;
  const logger = silent ? emptyLogger : builtInLogger;
  const avaliablePort = await getPort(opts?.port ?? 3000);

  if (avaliablePort !== opts?.port) {
    logger.warn(`Pen found port ${opts?.port} unavaliable, use random port ${avaliablePort} instead`);
  }

  return {
    silent,
    port: avaliablePort,
    dark: opts?.dark ?? false,
    dist: opts?.dist ? formatPath(opts?.dist) : path.join(__dirname),
    namespace: opts?.namespace ? formatPath(opts?.namespace) : '/',
    logger: silent ? emptyLogger : logger,
    ignores: opts?.ignores ?? [],
    watchRoot: opts?.watchRoot ? formatPath(opts?.watchRoot) : process.cwd(),
  };
};

export const bindMiddleware = async (server: Express, options: Required<ServerOptions>) => {
  const watcher = new Watcher({
    ...options,
    emit: console.log,
  });

  await watcher.setupWatching('.');

  bindRender(server, {
    ...options,
    watcher,
  });

  return () => watcher.close();
};

// hypothesis: client assets to be in the same directory
export const createServer = async (opts?: ServerOptions) => {
  const server = express();
  const options = await normalizeOptions(opts);
  const close = await bindMiddleware(server, options);

  server.on('close', close);
  server.listen(options.port, () => {
    console.log(`server listening on ${options.port}`);
  });
};

createServer();
