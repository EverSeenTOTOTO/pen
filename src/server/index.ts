import path from 'path';
import { formatPath } from '@/utils';
import http from 'http';
import express from 'express';
import getPort from 'detect-port';
import { PenOptions, PenCliOptions } from '@/types';
import { logger as builtInLogger, emptyLogger } from './logger';
import { createTheme } from './theme';
import { bindRender } from './render';
import { bindSocket } from './socket';
import { createWatcher } from './watcher';
import { RemarkRehype } from './rehype';

export const normalizeOptions = async (opts?: Partial<PenOptions>): Promise<Required<PenOptions>> => {
  const silent = opts?.silent ?? false;
  const logger = silent ? emptyLogger : builtInLogger;
  const dist = opts?.dist ? path.join(opts?.dist) : path.join(__dirname);

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
    theme: opts?.theme ?? await createTheme('light', dist),
    plugins: opts?.plugins ?? [],
  };
};

// for test
export const createServer = async (opts?: PenCliOptions) => {
  const app = express();
  const server = http.createServer(app);
  const options = await normalizeOptions(opts);
  const remark = new RemarkRehype(options);
  const watcher = createWatcher({ ...options, remark });

  bindRender(app, { ...options, remark });
  bindSocket(server, { ...options, watcher });

  const avaliablePort = await getPort(opts?.port ?? 3000);

  if (opts?.port && avaliablePort !== opts?.port) {
    options.logger.warn(`Pen found port ${opts?.port} unavaliable, use port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    console.log(`server listening on ${avaliablePort}`);
  });
};

createServer({
  root: path.join(process.cwd(), '../../doc'),
});
