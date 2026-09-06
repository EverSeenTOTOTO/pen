import path from 'path';
import { slash, formatRelative, isMarkdown } from '@/utils';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import getPort from 'get-port';
import type { PenOptions, PenCliOptions } from '@/types';
import { logger as builtInLogger, emptyLogger, printBanner, paint } from './logger';
import { version } from '../../package.json';
import { bindRender } from './render';
import { bindSocket } from './socket';
import { RemarkRehype } from './rehype';

export const normalizeOptions = (opts?: Partial<PenOptions>) => {
  // resolve (not join) so an absolute --root is honored instead of concatenated
  const root = slash(path.resolve(process.cwd(), opts?.root ?? '.'));

  if (isMarkdown(root)) {
    throw new Error('The "root" option must be a directory.');
  }

  const silent = opts?.silent ?? false;
  const logger = silent ? emptyLogger : builtInLogger;
  const dist = opts?.dist ? path.join(opts?.dist) : import.meta.dirname;
  const ignores = opts?.ignores?.filter((_: string) => _).map((p: string) => new RegExp(p, 'g')) ?? [];

  return {
    root,
    dist,
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

  app.use(cookieParser());
  bindRender(app, { ...options, remark });
  bindSocket(server, { ...options, remark });

  options.logger.info('starting server...');

  const port = parseInt(opts?.port ?? '3000', 10);
  const avaliablePort = await getPort({ port: Number.isNaN(port) ? 3000 : port });

  if (avaliablePort !== port) {
    options.logger.warn(`port ${opts?.port} in use, using ${avaliablePort} instead`);
  }

  return new Promise((resolve) => server.listen(avaliablePort, () => {
    printBanner(options.logger, `pen v${version}`, [
      ['listening', paint.metric(`http://localhost:${avaliablePort}${options.namespace}`)],
      ['root', options.root],
      ['ignores', options.ignores.map((re) => re.source).join(', ') || '(none)'],
      ['socket', `${options.socketPath} (ns ${options.namespace})`],
    ]);
    resolve({ server, port: avaliablePort, options });
  }));
};
