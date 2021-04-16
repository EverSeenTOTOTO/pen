import { createReadStream } from 'fs';
import { resolve } from 'path';
import { Server as HttpServer, IncomingMessage, ServerResponse } from 'http';
import { Namespace, Server, Socket } from 'socket.io';
import Watcher, { PenLogger } from './watcher';

type PenOptions = {
  root?: string,
  namespace?: string,
  ignores?: RegExp|RegExp[],
  io?: Namespace | null,
  logger?: PenLogger,
};

export type PenCreateOptions = Omit<PenOptions, 'io'>;

// express middleware
const middleware = <Req extends IncomingMessage, Res extends ServerResponse>
  (_req: Req, res: Res): void => {
  res.setHeader('Content-Type', 'text/html');
  createReadStream(require.resolve('@everseenflash/pen-middleware/dist/spa/index.html'))
    .pipe(res);
};

export default class Pen {
  private iobase?: Server;

  private logger?: PenLogger;

  private ignores?: PenCreateOptions['ignores'];

  public readonly namespaces: Required<Omit<PenOptions, 'logger'|'ignores'>>[] = [];

  private readonly connectedSockets: { socket: Socket, watcher: Watcher }[] = [];

  // attach to http server
  attach<T extends HttpServer>(server: T): Pen {
    const iobase = new Server(server, {
      path: '/pensocket.io',
    });
    this.namespaces.forEach(({ root, namespace }) => {
      this.logger?.info(`Create pen middleware with root ${root}, namespace: ${namespace}`);

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
        socket.on('penfile', (path: string) => {
          const filepath = resolve(root, path);
          this.logger?.info(`recieved new pen filepath: ${path}`);
          this.startWatch({ socket, root, filepath });
        });
        this.startWatch({
          filepath: resolve(root, './'),
          root,
          socket,
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
    this.logger?.info(`Construct pen middleware with socket.io namespace ${ns.namespace}, prepare to watch file ${ns.root}`);
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

      this.logger?.info(`Pen stop watching ${oldWatcher.path}.`);

      newPath = resolve(oldWatcher.path, newPath);

      oldWatcher.stop();
    }

    this.logger?.info(`Pen start watching ${filepath}...`);

    const newWatcher = new Watcher({
      path: newPath,
      root,
      ignores: this.ignores,
      ondata: (data) => socket.emit('pencontent', data),
      onerror: (err) => socket.emit('penerror', err.message || `Internal Pen Error: ${err}`),
    });

    this.connectedSockets.push({
      socket,
      watcher: newWatcher,
    });
    newWatcher.start().trigger();
  }
}

// default pen instance
const pen = new Pen();

export {
  middleware,
  pen,
};
