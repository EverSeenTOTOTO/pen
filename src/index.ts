/* eslint-disable max-len */
import { existsSync } from 'fs';
import { Server as HttpServer } from 'http';
import { resolve } from 'path';
import { Server as IOBase, Socket } from 'socket.io';
import * as logger from './logger';
import createRender from './markdown';
import createMiddleware from './middleware';
import Watcher from './watcher';

export { logger };

export type PenCreateOptions = {
  root?: string,
  assets?: string,
  namespace?: string,
  ignores?: RegExp|RegExp[],
  logger?: typeof logger,
  server: HttpServer
  mditPlugins?: any[]
};

export class Pen {
  private iobase?: IOBase;

  public readonly root: string;

  public readonly ignores?: RegExp|RegExp[];

  public readonly logger?: typeof logger;

  private readonly connectedSockets: { socket: Socket, watcher: Watcher }[] = [];

  private readonly render: ReturnType<typeof createRender>;

  constructor(opts: PenCreateOptions) {
    this.root = opts.root ?? '.';
    this.ignores = opts.ignores;
    this.logger = opts.logger;
    this.render = createRender(opts.mditPlugins);

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
      render: this.render,
    });

    this.connectedSockets.push({
      socket,
      watcher: newWatcher,
    });
    newWatcher.start().trigger();
  }
}

export default (options: PenCreateOptions) => {
  const pen = new Pen(options);
  const middleware = createMiddleware(options);

  middleware.prototype.pen = pen;

  return middleware;
};
