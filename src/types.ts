/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Plugin } from 'unified';
import type { Logger } from './server/logger';
import type { RemarkRehype } from './server/rehype';

export type ThemeNames = 'dark' | 'light';

// client fetch
export enum ClientEvents {
  FetchData = 'fetchdata',
}

export type ClientToServerEvents = {
  [ClientEvents.FetchData]: (relative: string) => void;
};

// server push
export enum ServerEvents {
  PenError = 'penerror',
  PenData = 'pendata',
}

export type ServerToClientEvents = {
  [ServerEvents.PenData]: (data: PenDirectoryData | PenErrorData) => void;
  [ServerEvents.PenError]: (error: PenErrorData) => void;
};

export type EmitFunction<Evts extends { [k in string]: (...args: any[]) => void }, Evt extends keyof Evts> =
  (evt: Evt, ...args: Parameters<Evts[Evt]>) => void;

export type PenSocketInfo = {
  namespace: string;
  socketPath: string;
  transports: ['websocket']
};

export type PenTheme = {
  name: ThemeNames;
  css: string; // app chrome css for this theme (may be '')
  links: string; // <link> tags for markdown/hljs theme css
  avaliable: string[];
};

export type PathInfo = {
  type: 'directory' | 'markdown' | 'other',
  filename: string,
  relativePath: string,
  fullpath: string,
};

export type DocToc = {
  text: string,
  id: string,
  heading: number;
  children: DocToc[]
};

export type PenMarkdownData = {
  type: 'markdown',
  filename: string,
  relativePath: string,
  content: string,
  toc?: DocToc[],
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

export type SocketOptions = PenSocketInfo & WatcherOptions & {
  dist: string;
  connectTimeout: number;
  remark: RemarkRehype;
  logger: Logger;
};

export type RenderOptions = WatcherOptions & {
  dist: string;
  namespace: string;
};

export type PenOptions = Omit<WatcherOptions
& ReaderOptions
& SocketOptions
& RemarkOptions
& RenderOptions, 'ignores' | 'relative' | 'remark'>
& {
  silent: boolean;
  ignores: string[];
};

export type PenCliOptions = Partial<PenOptions & {
  port: string
}>;
