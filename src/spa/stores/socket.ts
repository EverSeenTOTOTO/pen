import { makeAutoObservable } from 'mobx';
import { io, Socket } from 'socket.io-client';
import RootStore from './root';
import type { Theme } from '../../ThemeProvider';

export enum PenSocketSendEvents {
  Init = 'peninit',
  ChangeTheme= 'penChangeTheme',
}
export enum PenSocketRecvEvents {
  ErrorOccured = 'penerror',
  UpdateData = 'pendata',
  UpdateTheme = 'penUpdateTheme',
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
      transports: ['websocket', 'polling'],
    });

    this.socket.on('disconnect', (reason: string) => this.onError(new Error(reason)));
    this.socket.on('connect_error', (error: Error) => this.onError(error));
    this.socket.on('error', (error: Error) => this.onError(error));
    this.socket.on(PenSocketRecvEvents.ErrorOccured, (data: string) => this.onUpdatePenError(data));
    this.socket.on(PenSocketRecvEvents.UpdateData, (data: string) => this.onUpdatePenData(data));
    this.socket.on(PenSocketRecvEvents.UpdateTheme, (theme: string) => this.onUpdatePenTheme(theme));
  }

  get connected() {
    return this.socket.connected;
  }

  onError(error: Error) {
    this.loading = false;
    this.rootStore.uiStore.notify('error', error.message);
  }

  onUpdatePenError(data: string) {
    this.loading = false;
    this.rootStore.blogStore.updatePenError(data);
  }

  onUpdatePenData(data: string) {
    this.loading = false;
    this.rootStore.blogStore.updatePenData(data);
  }

  onUpdatePenTheme(theme: string) {
    this.loading = false;
    this.rootStore.uiStore.updateTheme(theme);
  }

  fetchData(pathname: string) {
    this.loading = false;
    this.socket.emit(PenSocketSendEvents.Init, pathname.slice(1));
  }

  fetchTheme(theme: Theme) {
    this.loading = true;
    this.socket.emit(PenSocketSendEvents.ChangeTheme, theme);
  }
}
