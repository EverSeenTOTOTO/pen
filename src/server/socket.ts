import http from 'http';
import https from 'https';
import { Server, Socket } from 'socket.io';
import {
  ClientEvents,
  ServerEvents,
  ClientToServerEvents,
  ServerToClientEvents,
  SocketOptions,
} from '../types';
import { createTheme } from './theme';

type PenSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const setupWatcher = (socket: PenSocket, options: SocketOptions) => {
  const { watcher, namespace } = options;

  watcher.setupEmit(socket.emit.bind(socket));

  socket.on('disconnect', () => watcher.close());
  socket.on(ClientEvents.BackRoot, () => watcher.setupWatching(namespace));
  socket.on(ClientEvents.BackUpdir, () => watcher.goUpdir());
  socket.on(ClientEvents.FetchData, (relative) => watcher.setupWatching(relative)); // already stripNamespace in clientside
};

const setupThemeProvider = (socket: PenSocket, options: SocketOptions) => {
  socket.on(ClientEvents.FetchStyle, async (name) => {
    socket.emit(ServerEvents.PenStyle, await createTheme(name, options.dist));
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
    setupThemeProvider(socket, options);
  });

  server.once('close', () => {
    io.close(() => {
      options.logger?.info('Pen socket closed');
    });
  });
};
