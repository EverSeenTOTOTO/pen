import { Namespace, Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import Watcher, { MdContent } from './watcher';

type PenOptions = {
  path: string,
  namespace?: string,
};

export default class Pen {
  public readonly path; // markdown path

  public readonly namespace;

  private iobase?: Server;

  private io?: Namespace;

  private readonly connectedSockets: { socket: Socket, watcher: Watcher }[];

  constructor(opts?: PenOptions) {
    this.path = opts?.path || '.';
    this.namespace = opts?.namespace || '/';
    this.connectedSockets = [];
  }

  attach(server: HttpServer): Pen {
    server.on('listening', () => {
      const iobase = new Server(server);
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
    // 为这个socket配置一个watcher
    const watcher = new Watcher({
      path: this.path,
      ondata: (content: MdContent) => socket.emit('pencontent', JSON.stringify(content)),
      onerror: (e: Error) => socket.emit('penerror', e.message || `Internal Pen Error: ${e}`),
    });
    socket.on('disconnect', () => {
      watcher.stop();
      socket.disconnect(true);
      const id = this.connectedSockets.findIndex(
        ({ socket: s, watcher: w }) => s === socket && w === watcher,
      );
      if (id !== -1) {
        this.connectedSockets.splice(id, 1);
      }
    });
    this.connectedSockets.push({
      socket,
      watcher,
    });
    watcher.start();
    watcher.trigger();
  }
}
