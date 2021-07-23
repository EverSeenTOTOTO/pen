/* eslint-disable import/no-extraneous-dependencies */
import {
  Reducer, useCallback, useEffect, useState,
} from 'react';
import { Socket } from 'socket.io-client';
import { useLocation } from 'react-router';

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
}

export type PenState = {
  socket: Socket | null,
  files: PenDirInfo[] | undefined,
  content: string,
  open: boolean
};

export const initialState: PenState = {
  socket: null,
  files: [],
  content: '<h1>Pen socket not connected.</p>',
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
    case PenConstants.UpdateData:
      return {
        ...state,
        content: action.payload.content,
        files: action.payload.files,
      };
    case PenConstants.ToggleOpen:
      return {
        ...state,
        open: action.payload ? action.payload : !state.open,
      };
    default:
      return state;
  }
};

export const useToggleHandler = (dispatch) => {
  return useCallback((value?: boolean) => (
    event: React.KeyboardEvent | React.MouseEvent,
  ) => {
    if (
      event
      && event.type === 'keydown'
      && ((event as React.KeyboardEvent).key === 'Tab'
        || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    dispatch({
      type: PenConstants.ToggleOpen,
      payload: typeof value === 'boolean' ? value : undefined,
    });
  }, [dispatch]);
};

export const usePathname = (socket: Socket) => {
  const { pathname } = useLocation();
  const [stack, setStack] = useState<{ relative: string, name: string }[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const split = pathname.split('/').slice(1);
    const result = [];
    for (let i = 0; i < split.length; ++i) {
      result.push({
        relative: split.slice(0, i).join('/'),
        name: split[i],
      });
    }
    setStack(result);
  }, [pathname]);

  useEffect(() => {
    if (socket && socket.connect) {
      console.log(pathname);
      socket.emit(PenConstants.EmitFile, pathname.substr(1));
    }
  }, [pathname, socket]);

  return stack;
};

export const initMermaid = (darkMode: boolean) => {
  const mermaidThemes = ['default', 'forest'];
  requestAnimationFrame(() => {
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
