/* eslint-disable max-len */
import { existsSync } from 'fs';
import { Server as HttpServer } from 'http';
import { resolve } from 'path';
import { Server as IOBase, Socket } from 'socket.io';
import * as logger from './logger';
import createRender from './markdown';
import createMiddleware from './middleware';
import ThemeProvider, { Theme } from './ThemeProvider';
import Watcher from './watcher';

export { logger };

export type PenCreateOptions = {
  root?: string,
  ignores: RegExp[],
  logger?: typeof logger,
  filetypes: RegExp,
  mditPlugins?: any[],
};

export class Pen {
  private iobase?: IOBase;

  public readonly root: string;

  public readonly ignores: RegExp[];

  public readonly filetypes: RegExp;

  public readonly logger?: typeof logger;

  private readonly connectedSockets: { socket: Socket, watcher: Watcher }[] = [];

  private readonly markdownRender: ReturnType<typeof createRender>;

  private readonly themeProvider: ThemeProvider;

  constructor(opts: PenCreateOptions) {
    this.root = opts.root ?? '.';
    this.ignores = opts.ignores;
    this.filetypes = opts.filetypes;
    this.logger = opts.logger;
    this.markdownRender = createRender(opts.mditPlugins);
    this.themeProvider = new ThemeProvider({
      logger: this.logger,
    });
  }

  attach(server: HttpServer) {
    const iobase = new IOBase(server, {
      path: '/pensocket.io',
      transports: ['websocket', 'polling'],
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
      socket.emit('penUpdateTheme', this.themeProvider.getTheme({ darkMode: false }));
      socket.on('penChangeTheme', (theme: Theme) => {
        const themeStyleScript = this.themeProvider.getTheme(theme);

        socket.emit('penUpdateTheme', themeStyleScript);
      });
    });

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
      socket,
      root: this.root,
      logger: this.logger,
      path: newPath,
      filetypes: this.filetypes,
      ignores: this.ignores,
      render: this.markdownRender,
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  middleware.attach = pen.attach.bind(pen);

  return middleware;
};
