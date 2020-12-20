import { createReadStream } from 'fs';
import { resolve } from 'path';
import { Server as HttpServer, IncomingMessage, ServerResponse } from 'http';
import { Namespace, Server, Socket } from 'socket.io';
import Watcher, { MdContent } from './watcher';

type PenOptions = {
  root?: string,
  path?: string,
  namespace?: string,
};

export const middleware = <Req extends IncomingMessage, Res extends ServerResponse>
  (_req: Req, res: Res): void => {
  createReadStream(require.resolve('@everseenflash/pen-middleware/dist/spa/index.html'))
    .pipe(res);
};
export class Pen {
  public readonly root; // markdown path

  public readonly path; // socket.io capture path

  public readonly namespace;

  private iobase?: Server;

  private io?: Namespace;

  private readonly connectedSockets: { socket: Socket, watcher: Watcher }[];

  constructor(opts?: PenOptions) {
    this.root = opts?.root || resolve('.');
    this.path = opts?.path || '/pensocket.io';
    this.namespace = opts?.namespace || '/';
    this.connectedSockets = [];
  }

  attach<T extends HttpServer>(server: T): Pen {
    server.on('listening', () => {
      const iobase = new Server(server, {
        path: this.path,
      });
      const io = iobase.of(this.namespace);

      io.on('connection', this.onConnection.bind(this));

      this.iobase = iobase;
      this.io = io;
    });
    return this;
  }

  close(callback?: () => void):void {
    this.connectedSockets.forEach(({ socket, watcher }) => {
      socket.removeAllListeners();
      socket.disconnect(true);
      watcher.stop();
    });
    if (this.iobase) {
      this.iobase.close(callback);
    } else {
      callback?.();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use(socketioMiddleware: (socket: Socket, next: (...args: any[]) => void) => void):Pen {
    this.io?.use(socketioMiddleware);
    return this;
  }

  private onConnection(socket: Socket) {
    const startWatch = (path: string) => {
      let filepath: string;

      const id = this.connectedSockets.findIndex(
        ({ socket: s }) => s === socket,
      );
      if (id !== -1) { // if exist old watcher, stop it
        const { watcher: oldWatcher } = this.connectedSockets.splice(id, 1)[0];
        oldWatcher.stop();
        filepath = resolve(oldWatcher.path, path); // 目录层级
      } else {
        filepath = resolve(this.root, path);
      }

      const newWatcher = new Watcher({
        path: filepath,
        root: this.root,
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
        watcher.stop();
      }
    });

    // change watch file
    socket.on('penfile', startWatch);

    startWatch('./');
  }
}
