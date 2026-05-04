import { Client } from 'ssh2';

interface FileInfo {
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

export class SFTPService {
  private conn: Client | null = null;
  private sftp: any = null;
  private isConnected = false;

  async connect(config: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: Buffer;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.conn = new Client();

      const connectConfig: any = {
        host: config.host,
        port: config.port,
        username: config.username,
      };

      if (config.privateKey) {
        connectConfig.privateKey = config.privateKey;
      } else if (config.password) {
        connectConfig.password = config.password;
      }

      this.conn.on('ready', () => {
        this.conn!.sftp((err, sftp) => {
          if (err) {
            this.isConnected = false;
            reject(err);
            return;
          }
          this.sftp = sftp;
          this.isConnected = true;
          resolve();
        });
      });

      this.conn.on('error', (err) => {
        this.isConnected = false;
        reject(err);
      });

      this.conn.connect(connectConfig);
    });
  }

  async listDirectory(path: string): Promise<FileInfo[]> {
    if (!this.sftp || !this.isConnected) {
      throw new Error('SFTP connection not established');
    }

    return new Promise((resolve, reject) => {
      this.sftp!.readdir(path, (err, list) => {
        if (err) {
          reject(err);
          return;
        }

        const files: FileInfo[] = list.map((file: any) => {
          const mode = file.attrs.mode || 0;
          const isDir = (mode & 0o040000) !== 0;
          const isFile = (mode & 0o100000) !== 0;
          const isSymlink = (mode & 0o120000) !== 0;

          return {
            filename: file.filename,
            longname: file.longname,
            attrs: {
              mode: file.attrs.mode || 0,
              size: file.attrs.size || 0,
              atime: file.attrs.atime,
              mtime: file.attrs.mtime,
              uid: file.attrs.uid,
              gid: file.attrs.gid,
            },
            isDirectory: isDir,
            isFile: isFile || (!isDir && !isSymlink),
            isSymlink: isSymlink,
            permissions: this.modeToString(mode),
            size: file.attrs.size || 0,
            modifiedTime: (file.attrs.mtime || 0) * 1000,
          };
        });

        resolve(files);
      });
    });
  }

  async readFile(path: string): Promise<Buffer> {
    if (!this.sftp || !this.isConnected) {
      throw new Error('SFTP connection not established');
    }

    return new Promise((resolve, reject) => {
      this.sftp!.readFile(path, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }

  async writeFile(path: string, data: Buffer): Promise<void> {
    if (!this.sftp || !this.isConnected) {
      throw new Error('SFTP connection not established');
    }

    return new Promise((resolve, reject) => {
      this.sftp!.writeFile(path, data, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.sftp || !this.isConnected) {
      throw new Error('SFTP connection not established');
    }

    return new Promise((resolve, reject) => {
      this.sftp!.unlink(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async deleteDirectory(path: string): Promise<void> {
    if (!this.sftp || !this.isConnected) {
      throw new Error('SFTP connection not established');
    }

    return new Promise((resolve, reject) => {
      this.sftp!.rmdir(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async createDirectory(path: string): Promise<void> {
    if (!this.sftp || !this.isConnected) {
      throw new Error('SFTP connection not established');
    }

    return new Promise((resolve, reject) => {
      this.sftp!.mkdir(path, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    if (!this.sftp || !this.isConnected) {
      throw new Error('SFTP connection not established');
    }

    return new Promise((resolve, reject) => {
      this.sftp!.rename(oldPath, newPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async stat(path: string): Promise<FileInfo> {
    if (!this.sftp || !this.isConnected) {
      throw new Error('SFTP connection not established');
    }

    return new Promise((resolve, reject) => {
      this.sftp!.stat(path, (err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        const mode = stats.mode || 0;
        const isDir = (mode & 0o040000) !== 0;
        const isFile = (mode & 0o100000) !== 0;
        const isSymlink = (mode & 0o120000) !== 0;

        resolve({
          filename: path.split('/').pop() || path,
          longname: '',
          attrs: {
            mode: stats.mode || 0,
            size: stats.size || 0,
            atime: stats.atime,
            mtime: stats.mtime,
            uid: stats.uid,
            gid: stats.gid,
          },
          isDirectory: isDir,
          isFile: isFile || (!isDir && !isSymlink),
          isSymlink: isSymlink,
          permissions: this.modeToString(mode),
          size: stats.size || 0,
          modifiedTime: (stats.mtime || 0) * 1000,
        });
      });
    });
  }

  private modeToString(mode: number): string {
    const perms = [
      mode & 0o400 ? 'r' : '-',
      mode & 0o200 ? 'w' : '-',
      mode & 0o100 ? 'x' : '-',
      mode & 0o040 ? 'r' : '-',
      mode & 0o020 ? 'w' : '-',
      mode & 0o010 ? 'x' : '-',
      mode & 0o004 ? 'r' : '-',
      mode & 0o002 ? 'w' : '-',
      mode & 0o001 ? 'x' : '-',
    ].join('');

    let typeChar = '-';
    if ((mode & 0o040000) !== 0) typeChar = 'd';
    else if ((mode & 0o120000) !== 0) typeChar = 'l';

    return typeChar + perms;
  }

  async disconnect(): Promise<void> {
    if (this.conn) {
      if (this.sftp) {
        this.sftp.end();
        this.sftp = null;
      }
      this.conn.end();
      this.isConnected = false;
      this.conn = null;
    }
  }

  isOpen(): boolean {
    return this.isConnected;
  }
}
