import path from 'path';
import { slash, formatRelative, isMarkdown } from '@/utils';
import http from 'http';
import express from 'express';
import getPort from 'get-port';
import { PenOptions, PenCliOptions } from '@/types';
import { logger as builtInLogger, emptyLogger } from './logger';
import { bindRender } from './render';
import { bindSocket } from './socket';
import { RemarkRehype } from './rehype';

export const normalizeOptions = (opts?: Partial<PenOptions>) => {
  const root = slash(opts?.root ? path.join(process.cwd(), opts?.root) : process.cwd());

  if (isMarkdown(root)) {
    throw new Error('The "root" options must be a directory');
  }

  const silent = opts?.silent ?? false;
  const logger = silent ? emptyLogger : builtInLogger;
  const dist = opts?.dist ? path.join(opts?.dist) : path.join(__dirname);
  const ignores = opts?.ignores?.filter((_: string) => _).map((p: string) => new RegExp(p, 'g')) ?? [];

  const theme = opts?.theme ?? (() => {
    const hour = new Date().getHours();
    return hour >= 18 || hour <= 6 ? 'dark' : 'light';
  });

  return {
    root,
    dist,
    theme,
    silent,
    ignores,
    logger: silent ? emptyLogger : logger,
    connectTimeout: opts?.connectTimeout ?? 10000,
    socketPath: opts?.socketPath ?? '/pensocket.io',
    transports: opts?.transports ?? ['websocket'],
    namespace: opts?.namespace ? formatRelative(opts?.namespace) : '/',
    plugins: opts?.plugins ?? [],
  };
};

export const createServer = async (opts?: PenCliOptions) => {
  const app = express();
  const server = http.createServer(app);
  const options = normalizeOptions(opts);
  const remark = new RemarkRehype(options);

  bindRender(app, { ...options, remark });
  bindSocket(server, { ...options, remark });

  options.logger.info('Pen starting server, please wait...');

  const port = parseInt(opts?.port ?? '3000', 10);
  const avaliablePort = await getPort({ port: Number.isNaN(port) ? 3000 : port });

  if (avaliablePort !== port) {
    options.logger.warn(`Pen found port ${opts?.port} unavaliable, use port ${avaliablePort} instead`);
  }

  return new Promise((resolve) => server.listen(avaliablePort, () => resolve({ server, port: avaliablePort, options })));
};
