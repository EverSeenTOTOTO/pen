import { formatPath, path } from '@/utils';
import http from 'http';
import express from 'express';
import getPort from 'detect-port';
import { RenderOptions, bindRender } from './render';
import { SocketOptions, bindSocket } from './socket';
import { logger as builtInLogger, emptyLogger } from './logger';
import { themes } from './theme';

export type PenOptions = Partial<SocketOptions> & Partial<RenderOptions>
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
    connectTimeout: opts?.connectTimeout ?? 10000,
    socketPath: opts?.socketPath ?? '/pensocket.io',
    transports: opts?.transports ?? ['websocket', 'polling'],
    root: opts?.root ? formatPath(opts?.root) : process.cwd(),
    namespace: opts?.namespace ? formatPath(opts?.namespace) : '/',
    dist: opts?.dist ? formatPath(opts?.dist) : path.join(__dirname),
    theme: opts?.theme ?? { name: 'light', options: themes.light, avaliable: [] },
  };
};

export type ServerOptions = PenOptions & {
  port?: number;
};

// hypothesis: client assets to be in the same directory
export const createServer = async (opts?: ServerOptions) => {
  const app = express();
  const server = http.createServer(app);
  const options = normalizeOptions(opts);

  bindSocket(server, options);
  bindRender(app, options);

  const avaliablePort = await getPort(opts?.port ?? 3000);

  if (avaliablePort !== opts?.port) {
    options.logger.warn(`Pen found port ${opts?.port} unavaliable, use port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    console.log(`server listening on ${avaliablePort}`);
  });
};

createServer();
