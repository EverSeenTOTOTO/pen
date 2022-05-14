import { ThemeOptions } from '@material-ui/core/styles';

// client fetch
export enum ClientEvents {
  FetchStyle = 'fetchstyle',
  FetchData = 'fetchdata',
  BackUpdir = 'backupdir',
  BackRoot = 'backroot',
}

export type ClientToServerEvents = {
  [ClientEvents.FetchStyle]: (name: string) => void;
  [ClientEvents.FetchData]: (relative: string) => void;
  [ClientEvents.BackRoot ]: () => void;
  [ClientEvents.BackUpdir]: () => void
};

// server push
export enum ServerEvents {
  PenError = 'penerror',
  PenData = 'pendata',
  PenStyle = 'penstyle',
}

export type ServerToClientEvents = {
  [ServerEvents.PenData]: (data: PenMarkdownData | PenDirectoryData) => void;
  [ServerEvents.PenError]: (error: PenErrorData) => void;
  [ServerEvents.PenStyle]: (theme: PenTheme) => void;
};

export type EmitFunction<Evts extends { [k in string]: (...args: any[]) => void }, Evt extends keyof Evts> = (evt: Evt, ...args: Parameters<Evts[Evt]>) => void;

export type PenSocketInfo = {
  socketPath: string;
  transports: ('websocket' | 'polling')[]
};

export type PenTheme = {
  name: string;
  options: ThemeOptions;
  avaliable: string[];
};

export type PathInfo = {
  type: 'directory' | 'markdown' | 'other',
  fullpath: string,
  filename: string,
  relativePath: string,
};

export type DocToc = {
  name: string,
  children: DocToc[]
};

export type PenMarkdownData = {
  type: 'markdown',
  content: string,
  filename: string,
  relativePath: string
};

export type PenDirectoryData = {
  type: 'directory',
  filename: string,
  relativePath: string,
  children: PathInfo[],
  reading?: PenMarkdownData
  readme?: PenMarkdownData
};

export type PenErrorData = {
  type: 'error',
  message: string
};
