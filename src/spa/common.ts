import { Reducer } from 'react';
import { Socket } from 'socket.io-client';

export const createMarkup = (__html) => ({ __html });

export type PenDirInfo = {
  filename: string,
  relative: string,
  type: 'dir' | 'markdown',
  current: boolean
};

export type PenState = {
  socket: Socket | null,
  files: PenDirInfo[] | undefined,
  content: string,
  stack: PenDirInfo[]
};

export const initialState: PenState = {
  socket: null,
  files: [],
  content: '<h1>Pen socket not connected.</p>',
  stack: [],
};

export enum PenEvents {
  CreateSocket = 'pensocket',
  ErrorOccured = 'penerror',
  UpdateData = 'pendata',
  EmitFile = 'peninit',
}

export const reducer: Reducer<PenState, any> = (state: PenState, action: any) => {
  switch (action.type) {
    case PenEvents.CreateSocket:
      return {
        ...state,
        socket: action.payload,
      };
    case PenEvents.ErrorOccured:
    case PenEvents.UpdateData:
      return {
        ...state,
        content: action.payload.content,
        files: action.payload.files,
      };
    default:
      return state;
  }
};
