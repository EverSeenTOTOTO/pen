import { formatPath, path } from '@/utils';
import http from 'http';
import express from 'express';
import getPort from 'detect-port';
import { PenOptions, PenCliOptions } from '@/types';
import { logger as builtInLogger, emptyLogger } from './logger';
import { createTheme } from './theme';
import { bindRender } from './render';
import { bindSocket } from './socket';
import { Watcher } from './watcher';
import { RemarkRehype } from './rehype';

export const normalizeOptions = (opts?: PenOptions): Required<PenOptions> => {
  const silent = opts?.silent ?? false;
  const logger = silent ? emptyLogger : builtInLogger;
  const dist = opts?.dist ? formatPath(opts?.dist) : path.join(__dirname);

  return {
    dist,
    silent,
    ignores: opts?.ignores ?? [],
    logger: silent ? emptyLogger : logger,
    connectTimeout: opts?.connectTimeout ?? 10000,
    socketPath: opts?.socketPath ?? '/pensocket.io',
    transports: opts?.transports ?? ['websocket', 'polling'],
    root: opts?.root ? formatPath(opts?.root) : process.cwd(),
    namespace: opts?.namespace ? formatPath(opts?.namespace) : '/',
    theme: opts?.theme ?? createTheme('light', dist),
    plugins: opts?.plugins ?? [],
  };
};

// hypothesis: client assets to be in the same directory
export const createServer = async (opts?: PenCliOptions) => {
  const app = express();
  const server = http.createServer(app);
  const options = normalizeOptions(opts);
  const remark = new RemarkRehype(options);
  const watcher = new Watcher({ ...options, remark });

  bindRender(app, options);
  bindSocket(server, { ...options, watcher, remark });

  const avaliablePort = await getPort(opts?.port ?? 3000);

  if (avaliablePort !== opts?.port) {
    options.logger.warn(`Pen found port ${opts?.port} unavaliable, use port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    console.log(`server listening on ${avaliablePort}`);
  });
};

createServer();
