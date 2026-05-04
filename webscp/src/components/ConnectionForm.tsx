import { useState } from 'react';
import type { ConnectionConfig } from '../types'
import '../styles/ConnectionForm.css';

interface ConnectionFormProps {
  onConnect: (config: ConnectionConfig) => Promise<void>;
  loading?: boolean;
}

export function ConnectionForm({ onConnect, loading = false }: ConnectionFormProps) {
  const [config, setConfig] = useState<ConnectionConfig>({
    host: 'localhost',
    port: 22,
    username: 'root',
    password: '',
    privateKey: '',
    usePrivateKey: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setConfig(prev => ({ ...prev, [name]: checked }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onConnect(config);
    } catch (error: any) {
      alert(`Connection error: ${error.message}`);
    }
  };

  return (
    <div className="connection-form-container">
      <div className="connection-form">
        <h2>SSH/SFTP Connection</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="host">Host</label>
            <input
              type="text"
              id="host"
              name="host"
              value={config.host}
              onChange={handleChange}
              placeholder="localhost"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="port">Port</label>
            <input
              type="number"
              id="port"
              name="port"
              value={config.port}
              onChange={handlePortChange}
              placeholder="22"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={config.username}
              onChange={handleChange}
              placeholder="root"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="usePrivateKey"
                checked={config.usePrivateKey}
                onChange={handleChange}
                disabled={loading}
              />
              Use Private Key
            </label>
          </div>

          {config.usePrivateKey ? (
            <div className="form-group">
              <label htmlFor="privateKey">Private Key (PEM)</label>
              <textarea
                id="privateKey"
                name="privateKey"
                value={config.privateKey}
                onChange={handleChange}
                placeholder="-----BEGIN RSA PRIVATE KEY-----"
                rows={8}
                disabled={loading}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={config.password}
                onChange={handleChange}
                placeholder="Enter password"
                disabled={loading}
              />
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
}
