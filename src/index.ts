import { Namespace, Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import path from 'path';
import fs from 'fs';
import Watcher, { MdContent } from './watcher';

type PenOptions = {
  path: string,
  namespace?: string,
  socketPath?: string
};

export default class Pen {
  public readonly path;

  public readonly namespace ;

  public readonly socketPath ;

  private iobase?: Server;

  private io?: Namespace;

  private readonly connectedSockets: {socket: Socket, watcher: Watcher}[];

  constructor(opts: PenOptions) {
    this.path = opts.path;
    this.namespace = opts.namespace || '/';
    this.socketPath = opts.socketPath || '/socket.io';
    this.connectedSockets = [];
  }

  attach(server: HttpServer): Pen {
    const iobase = new Server(server);
    const io = iobase.of(this.namespace);

    io.on('connection', this.onConnection.bind(this));
    server.on('close', this.onClose.bind(this));

    this.iobase = iobase;
    this.io = io;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use(socketioMiddleware: (socket: Socket, next: (...args: any[]) => void) => void):Pen {
    this.io?.use(socketioMiddleware);
    return this;
  }

  static get middleware() {
    return (_req: any, res: any): void => {
      res.setHeader('Content-Type', 'text/html');
      fs.createReadStream(path.join(__dirname, './spa/index.html')).pipe(res);
    };
  }

  private onConnection(socket: Socket) {
    socket.on('disconnect', () => {
      this.onDisconnection(socket);
    });
    // 为这个socket配置一个watcher
    const watcher = new Watcher({
      path: this.path,
      ondata: (content: MdContent) => socket.emit('pencontent', JSON.stringify(content)),
      onerror: (e: Error) => socket.emit('penerror', e.message || `Internal Pen Error: ${e}`),
    });
    watcher.start();
    this.connectedSockets.push({ socket, watcher });
  }

  private onDisconnection(socket: Socket) {
    const index = this.connectedSockets.findIndex(({ socket: sock }) => sock === socket);
    if (index !== -1) {
      const { socket: sock, watcher } = this.connectedSockets[index];
      sock.disconnect();
      watcher.stop();
      this.connectedSockets.splice(index, 1);
    }
  }

  private onClose() {
    this.connectedSockets.forEach(({ socket, watcher }) => {
      socket.disconnect();
      watcher.stop();
    });
    this.iobase?.close();
  }
}
