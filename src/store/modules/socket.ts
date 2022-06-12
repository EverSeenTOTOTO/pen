import { io, Socket } from 'socket.io-client';
import { makeAutoObservable } from 'mobx';
import {
  PenTheme,
  ClientEvents,
  EmitFunction,
  PenErrorData,
  ServerEvents,
  PenSocketInfo,
  PenMarkdownData,
  PenDirectoryData,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/types';
import type { AppStore, PrefetchStore } from '..';

export class SocketStore implements PrefetchStore<PenSocketInfo> {
  root: AppStore;

  namespace: string = '/';

  socketPath: string = '/pensocket.io';

  transports: PenSocketInfo['transports'] = ['websocket']

  _socket?: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  computePath(relative: string) {
    return `${this.namespace === '/' ? '' : this.namespace}${relative}`;
  }

  get socket() {
    if (!this._socket) {
      console.info(`connect to ${this.namespace}`);

      this._socket = io(this.namespace, {
        path: this.socketPath,
        transports: this.transports,
      });
      this._socket.on(ServerEvents.PenData, (data) => this.onData(data));
      this._socket.on(ServerEvents.PenStyle, (style) => this.onStyle(style));
      this._socket.on(ServerEvents.PenError, (error) => this.onData(error));
      this._socket.on('connect', () => this.onConnect());
      this._socket.on('disconnect', () => this.onDisconnect());
      this._socket.on('connect_error', (error) => this.onError(error));
    }
    return this._socket;
  }

  get emit(): EmitFunction<ClientToServerEvents, ClientEvents> {
    return (evt, data) => {
      if (!this.socket.connected) return;
      this.socket.emit(evt, data);
    };
  }

  onData(data: PenMarkdownData | PenDirectoryData | PenErrorData) {
    if (import.meta.env.DEV) {
      console.info(data);
    }
    this.root.home.hydrate({ data });
  }

  onStyle(style: PenTheme) {
    if (import.meta.env.DEV) {
      console.info(style);
    }
    this.root.theme.hydrate(style);
  }

  onError(error: Error) {
    if (import.meta.env.DEV) {
      console.error(error);
    }
    this.root.home.notify('error', error.message);
  }

  onConnect() {
    this.root.home.fetchData(window.location.pathname, false);
  }

  onDisconnect() {
    this.root.home.notify('error', 'socket disconnect');
  }

  hydrate(opts: PenSocketInfo) {
    this.socketPath = opts.socketPath;
    this.transports = opts.transports;
    this.namespace = opts.namespace;
  }

  dehydra() {
    return {
      namespace: this.namespace,
      socketPath: this.socketPath,
      transports: this.transports,
    };
  }
}
