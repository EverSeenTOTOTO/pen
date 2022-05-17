import { stripNamespace } from '@/utils';
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
  const { watcher, logger, namespace } = options;

  watcher.setupEmit(socket.emit.bind(socket));

  socket.on('disconnect', () => {
    logger.warn(`Pen disconnect with ${socket.id}`);
    watcher.close();
  });
  socket.on(ClientEvents.FetchData, (relative) => watcher.setupWatching(stripNamespace(namespace, relative))); // already stripNamespace in clientside
};

const setupThemeProvider = (socket: PenSocket, options: SocketOptions) => {
  socket.on(ClientEvents.FetchStyle, async (name) => {
    socket.emit(ServerEvents.PenStyle, await createTheme(name, options.dist));
  });
};

export const bindSocket = (server: http.Server | https.Server, options: SocketOptions) => {
  const {
    logger, socketPath, connectTimeout, transports, namespace,
  } = options;

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    transports,
    connectTimeout,
    path: socketPath,
  });
  logger.info(`Pen socket namespace: ${namespace}`);
  const nsp = io.of(namespace);

  nsp.on('error', (e) => {
    logger.error(`Pen socket error: ${e.message}`);
  });
  nsp.on('connection', (socket) => {
    logger.done(`Pen connected with ${socket.id}`);

    setupWatcher(socket, options);
    setupThemeProvider(socket, options);
  });

  server.once('close', () => {
    io.close(() => {
      logger.info('Pen socket closed');
    });
  });
};
