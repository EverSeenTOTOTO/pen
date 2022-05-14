import { io, Socket } from 'socket.io-client';
import { makeAutoObservable } from 'mobx';
import {
  PenTheme,
  ClientEvents,
  EmitFunction,
  PenErrorData,
  ServerEvents,
  PenMarkdownData,
  PenDirectoryData,
  ClientToServerEvents,
  ServerToClientEvents,
  PenSocketInfo,
} from '@/types';
import type { AppStore, PrefetchStore } from '..';

export class SocketStore implements PrefetchStore<PenSocketInfo> {
  root: AppStore;

  socketPath: string = '/pensocket.io';

  transports: PenSocketInfo['transports'] = ['websocket', 'polling']

  _socket?: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  get socket() {
    if (!this._socket) {
      this._socket = io({
        path: this.socketPath,
        transports: this.transports,
      });
      this._socket.on(ServerEvents.PenData, (data: PenMarkdownData | PenDirectoryData) => this.onData(data));
      this._socket.on(ServerEvents.PenStyle, (style) => this.onStyle(style));
      this._socket.on(ServerEvents.PenError, (error) => this.onError(error));
      this._socket.on('disconnect', () => this.onDisconnect());
      this._socket.on('connect_error', (error) => this.onError(error));
    }
    return this._socket;
  }

  get emit(): EmitFunction<ClientToServerEvents, ClientEvents> {
    return this.socket.emit.bind(this.socket);
  }

  onData(data: PenMarkdownData | PenDirectoryData) {
    if (import.meta.env.DEV) {
      console.log(data);
    }
    this.root.home.hydrate({ data });
  }

  onStyle(style: PenTheme) {
    this.root.theme.hydrate(style);
  }

  onError(error: Error | PenErrorData) {
    if (import.meta.env.DEV) {
      console.error(error);
    }
    this.root.home.notify('error', error.message);
  }

  onDisconnect() {
    this.root.home.notify('warning', 'socket disconnect');
  }

  hydrate(opts: PenSocketInfo) {
    this.socketPath = opts.socketPath;
    this.transports = opts.transports;
  }

  dehydra() {
    return {
      socketPath: this.socketPath,
      transports: this.transports,
    };
  }
}