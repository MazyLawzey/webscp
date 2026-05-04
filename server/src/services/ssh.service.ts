import { Client } from 'ssh2';

interface SSHConnection {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: Buffer;
}

interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

export class SSHService {
  private conn: Client | null = null;
  private isConnected = false;

  async connect(config: SSHConnection): Promise<void> {
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
        this.isConnected = true;
        resolve();
      });

      this.conn.on('error', (err) => {
        this.isConnected = false;
        reject(err);
      });

      this.conn.connect(connectConfig);
    });
  }

  async exec(command: string): Promise<CommandResult> {
    if (!this.conn || !this.isConnected) {
      throw new Error('SSH connection not established');
    }

    return new Promise((resolve, reject) => {
      this.conn!.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';
        let code = 0;

        stream.on('close', (exitCode) => {
          code = exitCode || 0;
          resolve({ stdout, stderr, code });
        });

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.conn) {
      this.conn.end();
      this.isConnected = false;
      this.conn = null;
    }
  }

  getConnection(): Client | null {
    return this.conn;
  }

  isOpen(): boolean {
    return this.isConnected;
  }
}
