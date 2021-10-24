/* eslint-disable import/no-extraneous-dependencies */
import {
  Reducer, useCallback,
} from 'react';
import { Socket } from 'socket.io-client';

import mermaid from 'mermaid';

export const createMarkup = (__html) => ({ __html });

export type PenDirInfo = {
  filename?: string,
  relative: string,
  type: 'dir' | 'markdown',
  current: boolean
};

export enum PenConstants {
  CreateSocket = 'createsocket',
  ToggleOpen = 'toggleopen',
  SessionKey = 'penrouteinfo',
  ErrorOccured = 'penerror',
  UpdateData = 'pendata',
  EmitFile = 'peninit',
  GoUpDir = 'penupdir',
}

export type PenState = {
  socket: Socket | null,
  files: PenDirInfo[] | undefined,
  content: string,
  current: string,
  open: boolean
};

export const initialState: PenState = {
  socket: null,
  files: [],
  content: '<h1>Pen socket not connected.</p>',
  current: '',
  open: false,
};

export const reducer: Reducer<PenState, any> = (state: PenState, action: any) => {
  switch (action.type) {
    case PenConstants.CreateSocket:
      return {
        ...state,
        socket: action.payload,
      };
    case PenConstants.ErrorOccured:
      return {
        ...state,
        content: action.payload,
      };
    case PenConstants.UpdateData:
      return {
        ...state,
        content: action.payload.content,
        files: action.payload.files,
        current: action.payload.current,
      };
    case PenConstants.ToggleOpen:
      if (typeof action.payload === 'boolean') {
        if (state.open === action.payload) {
          return state;
        }
      }

      return {
        ...state,
        open: typeof action.payload === 'boolean' ? action.payload : !state.open,
      };
    default:
      return state;
  }
};

export const useToggleHandler = (dispatch) => {
  return useCallback((value?: boolean) => () => {
    dispatch({
      type: PenConstants.ToggleOpen,
      payload: value,
    });
  }, [dispatch]);
};

export const initMermaid = (darkMode: boolean) => {
  const mermaidThemes = ['default', 'forest'];
  requestAnimationFrame(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mermaid.initialize({
      // startOnLoad: true,
      theme: darkMode ? 'dark' : mermaidThemes[Math.floor(Math.random() * mermaidThemes.length)],
      gantt: {
        axisFormatter: [
          ['%Y-%m-%d', (d) => {
            return d.getDay() === 1;
          }],
        ],
      },
      sequence: {
        showSequenceNumbers: true,
      },
    });
    mermaid.init();
  });
};

export const getUpdir = (pathname: string) => {
  const match = /(.*?\/[^/]*)\/[^/]*\/?$/.exec(pathname);

  if (match) {
    return match[1];
  }

  return '/';
};
