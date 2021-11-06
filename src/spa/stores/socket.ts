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

  loading = false;

  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
    this.socket = io({
      path: '/pensocket.io',
    });

    this.socket.on('disconnect', (reason: string) => this.onError(new Error(reason)));
    this.socket.on('connect_error', (error: Error) => this.onError(error));
    this.socket.on('error', (error: Error) => this.onError(error));
    this.socket.on(PenSocketRecvEvents.ErrorOccured, (data: string) => this.onUpdatePenError(data));
    this.socket.on(PenSocketRecvEvents.UpdateData, (data: string) => this.onUpdatePenData(data));
  }

  get connected() {
    return this.socket.connected;
  }

  onError(error: Error) {
    this.loading = false;
    this.rootStore.uiStore.notifyError(error);
  }

  onUpdatePenError(data: string) {
    this.loading = false;
    this.rootStore.blogStore.updatePenError(data);
  }

  onUpdatePenData(data: string) {
    this.loading = false;
    this.rootStore.blogStore.updatePenData(data);
  }

  fetchData(pathname: string) {
    this.loading = true;
    this.socket.emit(PenSocketSendEvents.Init, pathname.slice(1));
  }
}
