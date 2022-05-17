/* eslint-disable @typescript-eslint/no-explicit-any */
import { ThemeOptions } from '@material-ui/core/styles';
import { Plugin } from 'unified';
import { Logger } from './server/logger';
import type { RemarkRehype } from './server/rehype';
import type { Watcher } from './server/watcher';

// client fetch
export enum ClientEvents {
  FetchStyle = 'fetchstyle',
  FetchData = 'fetchdata',
}

export type ClientToServerEvents = {
  [ClientEvents.FetchStyle]: (name: string) => void;
  [ClientEvents.FetchData]: (relative: string) => void;
};

// server push
export enum ServerEvents {
  PenError = 'penerror',
  PenData = 'pendata',
  PenStyle = 'penstyle',
}

export type ServerToClientEvents = {
  [ServerEvents.PenData]: (data: PenMarkdownData | PenDirectoryData | PenErrorData) => void;
  [ServerEvents.PenError]: (error: PenErrorData) => void;
  [ServerEvents.PenStyle]: (theme: PenTheme) => void;
};

export type EmitFunction<Evts extends { [k in string]: (...args: any[]) => void }, Evt extends keyof Evts> =
  (evt: Evt, ...args: Parameters<Evts[Evt]>) => void;

export type PenSocketInfo = {
  namespace: string;
  socketPath: string;
  transports: ('websocket' | 'polling')[]
};

export type PenTheme = {
  name: string;
  id: string;
  css: string;
  options: ThemeOptions;
  avaliable: string[];
};

export type PathInfo = {
  type: 'directory' | 'markdown' | 'other',
  filename: string,
  relativePath: string,
  fullpath: string,
};

// export type DocToc = {
//   name: string,
//   children: DocToc[]
// };

export type PenMarkdownData = {
  type: 'markdown',
  filename: string,
  relativePath: string
  content: string,
};

export type PenDirectoryData = {
  type: 'directory',
  filename: string,
  relativePath: string,
  children: Omit<PathInfo, 'fullpath'>[],
  reading?: PenMarkdownData
};

export type PenErrorData = {
  type: 'error',
  message: string
};

export type ReaderOptions = {
  root: string;
  relative: string;
  remark: RemarkRehype;
  ignores: RegExp[]
};

export type WatcherOptions = {
  root: string;
  ignores: RegExp[];
  remark: RemarkRehype;
  logger: Logger;
};

export type RemarkPlugin = [string, Plugin | false, ...any];

export type RemarkOptions = {
  logger: Logger;
  plugins: RemarkPlugin[]
};

export type SocketOptions = PenSocketInfo & {
  dist: string;
  connectTimeout: number;
  watcher: Watcher;
  logger: Logger;
};

export type RenderOptions = WatcherOptions & {
  dist: string;
  namespace: string;
  theme: PenTheme;
};

export type PenOptions = Omit<WatcherOptions
& ReaderOptions
& SocketOptions
& RemarkOptions
& RenderOptions
& {
  silent: boolean;
}, 'relative' | 'remark' | 'watcher'>;

export type PenCliOptions = Partial<PenOptions & {
  port: number
}>;
