import { useState, useEffect } from 'react';
import type { FileInfo } from '../types'
import '../styles/FileManager.css';

const API_URL = 'http://localhost:3001/api';

interface FileManagerProps {
  sftpSessionId: string | null;
}

export function FileManager({ sftpSessionId }: FileManagerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    if (sftpSessionId) {
      loadFiles(currentPath);
    }
  }, [sftpSessionId, currentPath]);

  const loadFiles = async (path: string) => {
    if (!sftpSessionId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/sftp/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sftpSessionId, path }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      setFiles(data.files.sort((a: FileInfo, b: FileInfo) => {
        if (a.isDirectory !== b.isDirectory) return b.isDirectory ? 1 : -1;
        return a.filename.localeCompare(b.filename);
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (filename: string) => {
    const file = files.find(f => f.filename === filename);
    if (file?.isDirectory) {
      const newPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
      setCurrentPath(newPath);
    }
  };

  const handleGoBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      setCurrentPath(parts.length ? '/' + parts.join('/') : '/');
    }
  };

  const handleCreateFolder = async () => {
    if (!sftpSessionId || !newFolderName.trim()) return;

    try {
      const newPath = currentPath === '/' ? `/${newFolderName}` : `${currentPath}/${newFolderName}`;
      const response = await fetch(`${API_URL}/sftp/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sftpSessionId, path: newPath }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setNewFolderName('');
      setShowNewFolder(false);
      loadFiles(currentPath);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!sftpSessionId || !confirm(`Delete "${filename}"?`)) return;

    try {
      const file = files.find(f => f.filename === filename);
      const itemPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;

      const response = await fetch(`${API_URL}/sftp/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sftpSessionId,
          path: itemPath,
          isDirectory: file?.isDirectory || false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      loadFiles(currentPath);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownload = async (filename: string) => {
    if (!sftpSessionId) return;

    try {
      const itemPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
      const response = await fetch(`${API_URL}/sftp/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sftpSessionId, path: itemPath }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!sftpSessionId) {
    return <div className="file-manager">Connect to server to browse files</div>;
  }

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h3>File Manager - {currentPath}</h3>
        <div className="breadcrumb">
          <button onClick={() => setCurrentPath('/')} className="breadcrumb-btn">
            Root
          </button>
          {currentPath !== '/' && (
            <button onClick={handleGoBack} className="breadcrumb-btn">
              ← Back
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="file-manager-toolbar">
        <button onClick={() => setShowNewFolder(!showNewFolder)}>+ New Folder</button>
        <button onClick={() => loadFiles(currentPath)}>Refresh</button>
      </div>

      {showNewFolder && (
        <div className="new-folder-form">
          <input
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyPress={e => e.key === 'Enter' && handleCreateFolder()}
          />
          <button onClick={handleCreateFolder}>Create</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Cancel</button>
        </div>
      )}

      <div className="file-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : files.length === 0 ? (
          <div className="empty">No files</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Modified</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.filename}>
                  <td
                    onClick={() => handleNavigate(file.filename)}
                    className={file.isDirectory ? 'clickable directory' : ''}
                  >
                    {file.isDirectory ? '📁' : '📄'} {file.filename}
                  </td>
                  <td>{file.isDirectory ? 'Directory' : 'File'}</td>
                  <td>{formatBytes(file.size)}</td>
                  <td>{new Date(file.modifiedTime).toLocaleString()}</td>
                  <td>{file.permissions}</td>
                  <td className="actions">
                    {!file.isDirectory && (
                      <button onClick={() => handleDownload(file.filename)} className="btn-small">
                        ⬇️
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(file.filename)}
                      className="btn-small btn-delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
