import http from 'http';
import https from 'https';
import { Server, Socket } from 'socket.io';
import {
  ClientEvents,
} from '../types';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketOptions,
} from '../types';
import { Watcher } from './watcher';
import { extendLogger, scope } from './logger';

type PenSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const setupWatcher = (socket: PenSocket, options: SocketOptions) => {
  const { logger } = options;
  const watcher = new Watcher(options);
  const client = socket.id.slice(0, 4); // full ids only add noise

  watcher.setupEmit(socket.emit.bind(socket));

  logger.log(`${scope('socket')}${client} connected`);
  socket.on('disconnect', () => {
    logger.warn(`${scope('socket')}${client} disconnected`);
    watcher.close();
  });
  socket.on(ClientEvents.FetchData, (relative) => watcher.setupWatching(relative));
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

  logger.log(`${scope('socket')}path ${socketPath} (ns ${namespace})`);

  const nsp = io.of(namespace);

  nsp.on('error', (e) => {
    logger.error(`Pen socket error: ${e.message}`);
  });
  nsp.on('connection', (socket) => {
    // log for distinct client
    setupWatcher(socket, { ...options, logger: extendLogger(logger, socket.id.slice(0, 4)) });
  });

  server.once('close', () => {
    io.close(() => {
      logger.info('Pen socket closed');
    });
  });

  return io;
};
