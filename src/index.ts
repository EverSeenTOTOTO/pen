/* eslint-disable max-len */
import { resolve } from 'path';
import { existsSync, createReadStream } from 'fs';
import { Server as HttpServer } from 'http';
import { Server as IOBase, Socket } from 'socket.io';
import type { IncomingMessage, ServerResponse } from 'http';
import Watcher from './watcher';
import * as logger from './logger';

export { logger };

const AssetsPattern = /\.(?:css(\.map)?|js(\.map)?|jpe?g|png|gif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$/;

export type PenCreateOptions = {
  root?: string,
  assets?: string,
  ignores?: RegExp|RegExp[],
  logger?: typeof logger,
  server: HttpServer
};

class Pen {
  private iobase?: IOBase;

  public readonly root: string;

  public readonly ignores?: RegExp|RegExp[];

  public readonly logger?: typeof logger;

  private readonly connectedSockets: { socket: Socket, watcher: Watcher }[] = [];

  constructor(opts: PenCreateOptions) {
    this.root = opts.root ?? '.';
    this.ignores = opts.ignores;
    this.logger = opts.logger;

    const iobase = new IOBase(opts.server, {
      path: '/pensocket.io',
    });
    iobase.on('connection', (socket: Socket) => {
      socket.on('disconnect', () => {
        socket.disconnect(true);
        const id = this.connectedSockets.findIndex(
          ({ socket: s }) => s === socket,
        );
        if (id !== -1) {
          const { watcher } = this.connectedSockets.splice(id, 1)[0];
          this.logger?.info(`Pen stopped watching ${watcher.path} due to disconnection`);
          watcher.stop();
        }
      });

      // change watch file
      socket.on('peninit', (param: string) => {
        const resolvedFilePath = resolve(this.root, param);
        const filepath = existsSync(resolvedFilePath)
          ? resolvedFilePath
          : resolve(this.root, './');

        this.startWatch({
          socket,
          filepath,
        });
      });
    });

    this.logger?.info(`Pen intialized with root: ${this.root}`);
    this.iobase = iobase;
  }

  close(callback?: () => void): void {
    this.connectedSockets.forEach(({ socket, watcher }) => {
      socket.removeAllListeners();
      socket.disconnect(true);
      watcher.stop();
    });

    this.logger?.done('Pen closed.');

    if (this.iobase) {
      this.iobase.close(() => callback?.());
    } else {
      callback?.();
    }
  }

  private startWatch({ filepath, socket }:{ filepath: string, socket: Socket }) {
    const id = this.connectedSockets.findIndex(
      ({ socket: s }) => s === socket,
    );

    let newPath = filepath;

    if (id !== -1) { // if exist old watcher, stop it
      const { watcher: oldWatcher } = this.connectedSockets.splice(id, 1)[0];

      newPath = resolve(oldWatcher.path, newPath); // compute relative path with the old
      oldWatcher.stop();
    }

    const newWatcher = new Watcher({
      root: this.root,
      logger: this.logger,
      path: newPath,
      ignores: this.ignores,
      socket,
    });

    this.connectedSockets.push({
      socket,
      watcher: newWatcher,
    });
    newWatcher.start().trigger();
  }
}

export default (opts: PenCreateOptions) => {
  const assets = opts?.assets ?? opts?.root ?? '.';

  function middleware<Req extends IncomingMessage, Res extends ServerResponse>(req: Req, res: Res) {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    logger?.info(`Pen got request: ${url.pathname}`);

    if (AssetsPattern.test(url.pathname)) {
      const asset = resolve(assets, `.${url.pathname}`);
      if (existsSync(asset)) {
        logger?.info(`Pen found asset: ${asset}`);
        createReadStream(asset).pipe(res);
      } else {
        logger?.error(`Pen asset not founded: ${asset}`);
        res.statusCode = 404;
        res.end();
      }
    } else {
      logger?.info('Pen redirect to index.html');
      res.setHeader('Content-Type', 'text/html');
      createReadStream(resolve(__dirname, 'spa/index.html'))
        .pipe(res);
    }
  }

  middleware.prototype.pen = new Pen(opts);
  return middleware;
};
