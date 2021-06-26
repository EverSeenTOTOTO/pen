/* eslint-disable max-len */
import { resolve } from 'path';
import { Server as HttpServer } from 'http';
import { Namespace, Server as IOBase, Socket } from 'socket.io';
import Watcher, { PenLogger } from './watcher';

export {
  createPenMiddleware,
  middleware,
} from './middleware';

export type PenCreateOptions = {
  root?: string,
  namespace?: string,
  ignores?: RegExp|RegExp[],
  logger?: PenLogger,
};

type PenNamespaceOptions = {
  root: string,
  namespace: string,
  io: Namespace | null,
};

export default class Pen {
  private iobase?: IOBase;

  private logger?: PenLogger;

  private ignores?: PenCreateOptions['ignores'];

  public readonly namespaces: PenNamespaceOptions[] = [];

  private readonly connectedSockets: { socket: Socket, watcher: Watcher }[] = [];

  // attach to http server
  attach<T extends HttpServer>(server: T): Pen {
    const iobase = new IOBase(server, {
      path: '/pensocket.io',
    });
    this.namespaces.forEach(({ root, namespace }) => {
      this.logger?.info(`Pen create with root: ${root}, namespace: ${namespace}`);

      iobase.of(namespace).on('connection', (socket: Socket) => {
        socket.on('disconnect', () => {
          socket.disconnect(true);
          const id = this.connectedSockets.findIndex(
            ({ socket: s }) => s === socket,
          );
          if (id !== -1) {
            const { watcher } = this.connectedSockets.splice(id, 1)[0];
            this.logger?.info(`Pen stop watching ${watcher.path} due to disconnection`);
            watcher.stop();
          }
        });

        // change watch file
        socket.on('peninit', (filepath: string) => {
          this.startWatch({
            socket,
            root,
            filepath: filepath
              ? resolve(root, filepath)
              : resolve(root, './'),
          });
        });
      });
    });

    this.iobase = iobase;
    return this;
  }

  // init pen
  create(opts?: PenCreateOptions): Pen {
    const ns = {
      root: opts?.root || resolve('.'),
      namespace: opts?.namespace || '/',
      io: null,
    };
    this.logger = opts?.logger;

    this.logger?.info(`Pen construct middleware with socket.io namespace ${ns.namespace}, prepare to watch file ${ns.root}`);

    this.namespaces.push(ns);
    this.ignores = opts?.ignores;
    return this;
  }

  clear(filter?: (nsp: PenCreateOptions) => boolean): Pen {
    const matched = this.namespaces.filter(
      ({ root, namespace }) => (filter ? filter({ root, namespace }) : true),
    );

    if (matched.length > 0) {
      matched.forEach((match) => {
        this.logger?.info(`Remove pen middleware ${match.namespace}`);

        const index = this.namespaces.indexOf(match);

        this.namespaces.splice(index, 1);
        match.io?.removeAllListeners();
      });
    }
    return this;
  }

  close(callback?: () => void): void {
    this.connectedSockets.forEach(({ socket, watcher }) => {
      socket.removeAllListeners();
      socket.disconnect(true);
      watcher.stop();
    });

    this.logger?.info('Pen closed.');

    if (this.iobase) {
      this.iobase.close(() => callback?.());
    } else {
      callback?.();
    }
  }

  private startWatch({ filepath, root, socket }:{ filepath: string, root: string, socket: Socket }) {
    const id = this.connectedSockets.findIndex(
      ({ socket: s }) => s === socket,
    );

    let newPath = filepath;

    if (id !== -1) { // if exist old watcher, stop it
      const { watcher: oldWatcher } = this.connectedSockets.splice(id, 1)[0];

      newPath = resolve(oldWatcher.path, newPath); // compute relative path with the old
      oldWatcher.stop();
    }

    const watcherOptions = {
      path: newPath,
      root,
      ignores: this.ignores,
    };

    this.logger?.info(`Pen start watching: ${JSON.stringify(watcherOptions)}`);

    const newWatcher = new Watcher({
      ...watcherOptions,
      logger: this.logger,
      socket,
    });

    this.connectedSockets.push({
      socket,
      watcher: newWatcher,
    });
    newWatcher.start().trigger();
  }
}

// a default pen instance
export const pen = new Pen();
