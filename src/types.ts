import { ThemeOptions } from '@material-ui/core/styles';

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

export type PenTheme = {
  name: string;
  options: ThemeOptions;
  avaliable: string[];
};

export type PenInitData = {
  root: string;
  namespace: string;
};

export type PathInfo = {
  type: 'directory' | 'markdown' | 'other',
  fullpath: string,
  filename: string,
  relativePath: string,
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

export type PenData = PenMarkdownData
| PenDirectoryData
| PenErrorData;

export type PenStyle = {
  type: StyleReq,
  name: string,
  cssFiles: string[]
};
