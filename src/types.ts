// client fetch
export enum ClientEvents {
  FetchStyle = 'fetchstyle',
  FetchData = 'fetchdata',
  BackUpdir = 'backupdir',
  BackRoot = 'backroot',
}

export type StyleReq = 'mode' | 'theme';

export type PenStyleRequest = {
  type: StyleReq,
  name: string
};

export type PenFetchRequest = {
  relative: string
};

// server push
export enum ServerEvents {
  PenInit = 'peninit',
  PenError = 'penerror',
  PenData = 'pendata',
  PenChange = 'penchange',
  PenStyle = 'penstyle',
}

export type PenInitData = {
  type: 'info',
  availableThemes: string[];
  currentTheme: string;
  darkMode: boolean;
  watchRoot: string;
  socketNamespace: string;
};

export type PenMarkdownData = {
  type: 'markdown',
  content: string,
  relativePath: string
};

export type PenDirectoryData = {
  type: 'directory',
  children: string[],
  relativePath: string,
  reading?: PenMarkdownData
};

export type PenChangeData = {
  type: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
  detail: string[]
};

export type PenErrorData = {
  type: 'error',
  message: string
};

export type PenData = PenMarkdownData
| PenDirectoryData
| PenErrorData
| PenChangeData;

export type PenStyle = {
  type: StyleReq,
  name: string,
  cssFiles: string[]
};
