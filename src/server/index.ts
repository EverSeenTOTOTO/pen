import path from 'path';
import { formatPath } from '@/utils';
import http from 'http';
import express from 'express';
import getPort from 'detect-port';
import { PenOptions, PenCliOptions } from '@/types';
import { logger as builtInLogger, emptyLogger } from './logger';
import { bindRender } from './render';
import { bindSocket } from './socket';
import { RemarkRehype } from './rehype';

export const normalizeOptions = (opts?: Partial<PenOptions>) => {
  const silent = opts?.silent ?? false;
  const logger = silent ? emptyLogger : builtInLogger;
  const dist = opts?.dist ? path.join(opts?.dist) : path.join(__dirname);
  const ignores = opts?.ignores?.filter((_: string) => _).map((p: string) => new RegExp(p, 'g')) ?? [];

  const hour = new Date().getHours();
  const name = hour >= 18 || hour <= 6 ? 'dark' : 'light';
  const theme = typeof opts?.theme === 'function' ? opts?.theme() : opts?.theme ?? name;

  return {
    dist,
    theme,
    silent,
    ignores,
    logger: silent ? emptyLogger : logger,
    connectTimeout: opts?.connectTimeout ?? 10000,
    socketPath: opts?.socketPath ?? '/pensocket.io',
    transports: opts?.transports ?? ['websocket', 'polling'],
    root: opts?.root ? formatPath(path.join(process.cwd(), opts?.root)) : formatPath(process.cwd()),
    namespace: opts?.namespace ? formatPath(opts?.namespace) : '/',
    plugins: opts?.plugins ?? [],
  };
};

// for test
export const createServer = async (opts?: PenCliOptions) => {
  const app = express();
  const server = http.createServer(app);
  const options = normalizeOptions(opts);
  const remark = new RemarkRehype(options);

  bindRender(app, { ...options, remark });
  bindSocket(server, { ...options, remark });

  const port = parseInt(opts?.port ?? '3000', 10);
  const avaliablePort = await getPort(Number.isNaN(port) ? 3000 : port);

  if (avaliablePort !== port) {
    options.logger.warn(`Pen found port ${opts?.port} unavaliable, use port ${avaliablePort} instead`);
  }

  return new Promise((resolve) => server.listen(avaliablePort, () => resolve({ server, port: avaliablePort, options })));
};
