export interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  usePrivateKey: boolean;
}

export interface FileInfo {
  filename: string;
  longname: string;
  attrs: {
    mode: number;
    uid?: number;
    gid?: number;
    size: number;
    atime?: number;
    mtime?: number;
  };
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  permissions: string;
  size: number;
  modifiedTime: number;
}

export interface SSHSession {
  sessionId: string;
  connected: boolean;
}

export interface SFTPSession {
  sessionId: string;
  connected: boolean;
}
