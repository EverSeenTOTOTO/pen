import http from 'http';
import https from 'https';
import { Server, Socket } from 'socket.io';
import {
  ClientEvents,
  ServerEvents,
  ClientToServerEvents,
  ServerToClientEvents,
  PenSocketInfo,
} from '../types';
import { Watcher, WatcherOptions } from './watcher';
import { themes } from './theme';

export type SocketOptions = Omit<WatcherOptions, 'emit'> & PenSocketInfo & {
  namespace: string;
  connectTimeout: number;
};

type PenSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const setupWatcher = (socket: PenSocket, options: SocketOptions) => {
  const watcher = new Watcher({
    ...options,
    emit: socket.emit.bind(socket),
  });

  watcher.setupWatching('.').catch((e) => socket.emit(ServerEvents.PenError, e));

  socket.on(ClientEvents.BackRoot, () => watcher.setupWatching('.'));
  socket.on(ClientEvents.BackUpdir, () => watcher.goUpdir());
  socket.on(ClientEvents.FetchData, (relative: string) => watcher.setupWatching(relative));
  socket.on('disconnect', () => watcher.close());
};

const setupThemeProvider = (socket: PenSocket) => {
  socket.on(ClientEvents.FetchStyle, (name: string) => {
    if (themes[name]) {
      socket.emit(ServerEvents.PenStyle, {
        name,
        options: themes[name],
        avaliable: Object.keys(themes),
      });
    }
  });
};

export const bindSocket = (server: http.Server | https.Server, options: SocketOptions) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    path: options.socketPath,
    connectTimeout: options.connectTimeout,
    transports: options.transports,
  });
  const nsp = io.of(options.namespace);

  nsp.on('error', (e) => {
    options.logger?.error(`Pen socket error: ${e.message}`);
  });
  nsp.on('connection', (socket) => {
    options.logger?.done(`Pen connected with ${socket.id}`);

    setupWatcher(socket, options);
    setupThemeProvider(socket);
  });

  server.on('close', () => {
    io.close();
  });
};