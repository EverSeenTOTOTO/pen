import { io, Socket } from 'socket.io-client';
import { makeAutoObservable } from 'mobx';

import RootStore from './root';

export enum PenSocketSendEvents {
  Init = 'peninit',
}
export enum PenSocketRecvEvents {
  ErrorOccured = 'penerror',
  UpdateData = 'pendata',
}

export default class PenSocketStore {
  socket: Socket;

  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
    this.socket = io({
      path: '/pensocket.io',
    });

    this.socket.on('reconnect_error', (error: Error) => this.onReconnectError(error));
    this.socket.on('reconnect_failed', () => this.onReconnectError(new Error('reconnect attemped failed')));
    this.socket.on('error', (error: Error) => this.onSocketError(error));
    this.socket.on(PenSocketRecvEvents.ErrorOccured, (data: string) => this.onUpdatePenError(data));
    this.socket.on(PenSocketRecvEvents.UpdateData, (data: string) => this.onUpdatePenData(data));
  }

  get connected() {
    return this.socket.connected;
  }

  onReconnectError(error: Error) {
    this.rootStore.uiStore.notifyError(error);
  }

  onSocketError(error: Error) {
    this.rootStore.uiStore.notifyError(error);
  }

  onUpdatePenError(data: string) {
    this.rootStore.blogStore.updatePenError(data);
  }

  onUpdatePenData(data: string) {
    this.rootStore.blogStore.updatePenData(data);
  }

  fetchData(pathname: string) {
    this.socket.emit(PenSocketSendEvents.Init, pathname.slice(1));
  }
}
