import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SSHService } from './services/ssh.service.js';
import { SFTPService } from './services/sftp.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Store connections per session
const sshConnections = new Map<string, SSHService>();
const sftpConnections = new Map<string, SFTPService>();

// Helper to generate session ID
const generateSessionId = () => Math.random().toString(36).substring(2, 11);

// Routes

// SSH Routes
app.post('/api/ssh/connect', async (req: Request, res: Response) => {
  try {
    const { host, port = 22, username, password, privateKey } = req.body;

    if (!host || !username) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const sessionId = generateSessionId();
    const sshService = new SSHService();

    const config: any = { host, port, username };
    if (password) config.password = password;
    if (privateKey) config.privateKey = Buffer.from(privateKey, 'base64');

    await sshService.connect(config);
    sshConnections.set(sessionId, sshService);

    res.json({ sessionId, message: 'Connected to SSH server' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ssh/exec', async (req: Request, res: Response) => {
  try {
    const { sessionId, command } = req.body;

    if (!sessionId || !command) {
      res.status(400).json({ error: 'Missing sessionId or command' });
      return;
    }

    const sshService = sshConnections.get(sessionId);
    if (!sshService || !sshService.isOpen()) {
      res.status(400).json({ error: 'SSH session not found or not connected' });
      return;
    }

    const result = await sshService.exec(command);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ssh/disconnect', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId' });
      return;
    }

    const sshService = sshConnections.get(sessionId);
    if (sshService) {
      await sshService.disconnect();
      sshConnections.delete(sessionId);
    }

    res.json({ message: 'SSH session closed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SFTP Routes
app.post('/api/sftp/connect', async (req: Request, res: Response) => {
  try {
    const { host, port = 22, username, password, privateKey } = req.body;

    if (!host || !username) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const sessionId = generateSessionId();
    const sftpService = new SFTPService();

    const config: any = { host, port, username };
    if (password) config.password = password;
    if (privateKey) config.privateKey = Buffer.from(privateKey, 'base64');

    await sftpService.connect(config);
    sftpConnections.set(sessionId, sftpService);

    res.json({ sessionId, message: 'Connected to SFTP server' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sftp/list', async (req: Request, res: Response) => {
  try {
    const { sessionId, path = '/' } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId' });
      return;
    }

    const sftpService = sftpConnections.get(sessionId);
    if (!sftpService || !sftpService.isOpen()) {
      res.status(400).json({ error: 'SFTP session not found or not connected' });
      return;
    }

    const files = await sftpService.listDirectory(path);
    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sftp/stat', async (req: Request, res: Response) => {
  try {
    const { sessionId, path } = req.body;

    if (!sessionId || !path) {
      res.status(400).json({ error: 'Missing sessionId or path' });
      return;
    }

    const sftpService = sftpConnections.get(sessionId);
    if (!sftpService || !sftpService.isOpen()) {
      res.status(400).json({ error: 'SFTP session not found or not connected' });
      return;
    }

    const stat = await sftpService.stat(path);
    res.json(stat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sftp/read', async (req: Request, res: Response) => {
  try {
    const { sessionId, path } = req.body;

    if (!sessionId || !path) {
      res.status(400).json({ error: 'Missing sessionId or path' });
      return;
    }

    const sftpService = sftpConnections.get(sessionId);
    if (!sftpService || !sftpService.isOpen()) {
      res.status(400).json({ error: 'SFTP session not found or not connected' });
      return;
    }

    const data = await sftpService.readFile(path);
    res.json({ data: data.toString('base64') });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sftp/write', async (req: Request, res: Response) => {
  try {
    const { sessionId, path, data } = req.body;

    if (!sessionId || !path || !data) {
      res.status(400).json({ error: 'Missing sessionId, path or data' });
      return;
    }

    const sftpService = sftpConnections.get(sessionId);
    if (!sftpService || !sftpService.isOpen()) {
      res.status(400).json({ error: 'SFTP session not found or not connected' });
      return;
    }

    const buffer = Buffer.from(data, 'base64');
    await sftpService.writeFile(path, buffer);
    res.json({ message: 'File written successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sftp/delete', async (req: Request, res: Response) => {
  try {
    const { sessionId, path, isDirectory = false } = req.body;

    if (!sessionId || !path) {
      res.status(400).json({ error: 'Missing sessionId or path' });
      return;
    }

    const sftpService = sftpConnections.get(sessionId);
    if (!sftpService || !sftpService.isOpen()) {
      res.status(400).json({ error: 'SFTP session not found or not connected' });
      return;
    }

    if (isDirectory) {
      await sftpService.deleteDirectory(path);
    } else {
      await sftpService.deleteFile(path);
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sftp/mkdir', async (req: Request, res: Response) => {
  try {
    const { sessionId, path } = req.body;

    if (!sessionId || !path) {
      res.status(400).json({ error: 'Missing sessionId or path' });
      return;
    }

    const sftpService = sftpConnections.get(sessionId);
    if (!sftpService || !sftpService.isOpen()) {
      res.status(400).json({ error: 'SFTP session not found or not connected' });
      return;
    }

    await sftpService.createDirectory(path);
    res.json({ message: 'Directory created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sftp/rename', async (req: Request, res: Response) => {
  try {
    const { sessionId, oldPath, newPath } = req.body;

    if (!sessionId || !oldPath || !newPath) {
      res.status(400).json({ error: 'Missing sessionId, oldPath or newPath' });
      return;
    }

    const sftpService = sftpConnections.get(sessionId);
    if (!sftpService || !sftpService.isOpen()) {
      res.status(400).json({ error: 'SFTP session not found or not connected' });
      return;
    }

    await sftpService.rename(oldPath, newPath);
    res.json({ message: 'Item renamed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sftp/disconnect', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId' });
      return;
    }

    const sftpService = sftpConnections.get(sessionId);
    if (sftpService) {
      await sftpService.disconnect();
      sftpConnections.delete(sessionId);
    }

    res.json({ message: 'SFTP session closed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WebSCP Server running on port ${PORT}`);
});
