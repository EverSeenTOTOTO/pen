import { createReadStream } from 'fs';
import { resolve } from 'path';
import { Server as HttpServer, IncomingMessage, ServerResponse } from 'http';
import { Namespace, Server, Socket } from 'socket.io';
import Watcher, { PenLogger, MdContent } from './watcher';

type PenOptions = {
  root?: string,
  namespace?: string,
  io?: Namespace | null
};

export type PenCreateOptions = Pick<PenOptions, 'root' | 'namespace'>;

export type PenConstructorOptions = {
  path?: string,
  logger?: PenLogger,
};

const middleware = <Req extends IncomingMessage, Res extends ServerResponse>
  (_req: Req, res: Res): void => {
  res.setHeader('Content-Type', 'text/html');
  createReadStream(require.resolve('@everseenflash/pen-middleware/dist/spa/index.html'))
    .pipe(res);
};
export default class Pen {
  public readonly path; // socket.io capture path

  private iobase?: Server;

  private logger?: PenLogger;

  public namespaces: Required<PenOptions>[];

  private readonly connectedSockets: { socket: Socket, watcher: Watcher }[];

  constructor(opts ?:PenConstructorOptions) {
    this.path = opts?.path || '/pensocket.io';
    this.logger = opts?.logger || undefined;
    this.connectedSockets = [];
    this.namespaces = [];

    this.logger?.info(`Construct pen with socket.io path: ${this.path}`);
  }

  attach<T extends HttpServer>(server: T): Pen {
    const iobase = new Server(server, {
      path: this.path,
    });
    this.namespaces.forEach(({ root, namespace }) => {
      this.logger?.info(`Create pen middleware with root ${root}, namespace: ${namespace}`);
      const io = iobase.of(namespace);

      io.on('connection', (socket: Socket) => {
        const startWatch = (path: string) => {
          const filepath = resolve(root, path);

          const id = this.connectedSockets.findIndex(
            ({ socket: s }) => s === socket,
          );
          if (id !== -1) { // if exist old watcher, stop it
            const { watcher: oldWatcher } = this.connectedSockets.splice(id, 1)[0];
            this.logger?.info(`Pen stop watching ${oldWatcher.path} due to new connection.`);
            oldWatcher.stop();
          }

          this.logger?.info(`Pen start watching ${filepath} due to new connection`);
          const newWatcher = new Watcher({
            path: filepath,
            root,
            ondata: (content: MdContent) => socket.emit('pencontent', JSON.stringify(content)),
            onerror: (e: Error) => socket.emit('penerror', e.message || `Internal Pen Error: ${e}`),
          });

          this.connectedSockets.push({
            socket,
            watcher: newWatcher,
          });

          newWatcher.start();
          newWatcher.trigger();
        };

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
        socket.on('penfile', startWatch);

        startWatch('./');
      });
      return io;
    });

    this.iobase = iobase;
    return this;
  }

  create(opts?: PenCreateOptions): Pen {
    const namespace = {
      root: opts?.root || resolve('.'),
      namespace: opts?.namespace || '/',
      io: null,
    };
    this.logger?.info(`Construct pen middleware with socket.io namespace ${namespace}, prepare to watch ${namespace.root}`);
    this.namespaces.push(namespace);
    return this;
  }

  clear(filter?: (nsp: PenCreateOptions) => boolean): Pen {
    const matched = this.namespaces.filter(
      ({ root, namespace }) => (filter ? filter({ root, namespace }) : true),
    );
    if (matched.length > 0) {
      matched.forEach((match) => {
        this.logger?.info(`Remove pen middleware ${match.namespace}`);
        match.io?.removeAllListeners();
        const index = this.namespaces.indexOf(match);
        this.namespaces.splice(index, 1);
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
}

// default pen instance
const pen = new Pen();

export {
  middleware,
  pen,
};
